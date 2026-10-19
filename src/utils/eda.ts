import { CleaningLog, ColumnSummaryStats, CorrelationPair, EDAResult } from '../types/pipeline';
import { calculateQuantile, calculateSkewness } from './cleaner';

export const MAX_COLS_PLOT = 6;

export function getStrengthLabel(r: number): string {
  const a = Math.abs(r);
  let label = '';
  if (a < 0.1) {
    label = 'negligible';
  } else if (a < 0.3) {
    label = 'weak';
  } else if (a < 0.5) {
    label = 'moderate';
  } else if (a < 0.7) {
    label = 'strong';
  } else {
    label = 'very strong';
  }
  const direction = r > 0 ? 'positive' : r < 0 ? 'negative' : '';
  return `${label} ${direction}`.trim();
}

export function runEDA(rows: Record<string, any>[]): EDAResult {
  if (rows.length === 0) {
    return {
      summary_stats: {},
      skewness: {},
      correlations: { columns: [], matrix: [] },
      top_correlations: [],
      numericColumns: [],
      categoricalColumns: [],
      datetimeColumns: [],
    };
  }

  const columns = Object.keys(rows[0]);
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const datetimeColumns: string[] = [];

  for (const col of columns) {
    const nonNullVals = rows.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullVals.length === 0) continue;

    const isNumeric = nonNullVals.every(v => typeof v === 'number' && !isNaN(v));
    const isDate = nonNullVals.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v));

    if (isNumeric) {
      numericColumns.push(col);
    } else if (isDate) {
      datetimeColumns.push(col);
    } else {
      categoricalColumns.push(col);
    }
  }

  // Summary stats and skewness
  const summary_stats: Record<string, ColumnSummaryStats> = {};
  const skewness: Record<string, number> = {};

  for (const col of numericColumns) {
    const values = rows.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v)) as number[];
    const n = values.length;
    if (n === 0) continue;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const std = Math.sqrt(variance);

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const q25 = calculateQuantile(sorted, 0.25);
    const median = calculateQuantile(sorted, 0.5);
    const q75 = calculateQuantile(sorted, 0.75);
    const skew = calculateSkewness(values);

    summary_stats[col] = {
      count: n,
      mean: Number(mean.toFixed(2)),
      std: Number(std.toFixed(2)),
      min: Number(min.toFixed(2)),
      q25: Number(q25.toFixed(2)),
      median: Number(median.toFixed(2)),
      q75: Number(q75.toFixed(2)),
      max: Number(max.toFixed(2)),
      skewness: Number(skew.toFixed(2)),
    };
    skewness[col] = Number(skew.toFixed(2));
  }

  // Pearson Correlation Matrix
  const matrix: number[][] = [];
  for (let i = 0; i < numericColumns.length; i++) {
    matrix[i] = [];
    const colA = numericColumns[i];
    const valsA = rows.map(r => r[colA] as number);
    const meanA = summary_stats[colA]?.mean ?? 0;
    const stdA = summary_stats[colA]?.std ?? 1;

    for (let j = 0; j < numericColumns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
        continue;
      }
      const colB = numericColumns[j];
      const valsB = rows.map(r => r[colB] as number);
      const meanB = summary_stats[colB]?.mean ?? 0;
      const stdB = summary_stats[colB]?.std ?? 1;

      if (stdA === 0 || stdB === 0) {
        matrix[i][j] = 0;
        continue;
      }

      let sumCov = 0;
      let validCount = 0;
      for (let k = 0; k < rows.length; k++) {
        const a = valsA[k];
        const b = valsB[k];
        if (typeof a === 'number' && !isNaN(a) && typeof b === 'number' && !isNaN(b)) {
          sumCov += (a - meanA) * (b - meanB);
          validCount++;
        }
      }

      const cov = sumCov / (validCount > 1 ? validCount - 1 : 1);
      const r = cov / (stdA * stdB);
      matrix[i][j] = Number(Math.max(-1, Math.min(1, r)).toFixed(2));
    }
  }

  // Top correlation pairs
  const pairs: { col1: string; col2: string; corr: number }[] = [];
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const val = matrix[i][j];
      if (!isNaN(val)) {
        pairs.push({
          col1: numericColumns[i],
          col2: numericColumns[j],
          corr: val,
        });
      }
    }
  }

  pairs.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
  const top_correlations: CorrelationPair[] = pairs.slice(0, 5).map(p => ({
    col1: p.col1,
    col2: p.col2,
    corr: p.corr,
    strength: getStrengthLabel(p.corr),
  }));

  return {
    summary_stats,
    skewness,
    correlations: {
      columns: numericColumns,
      matrix,
    },
    top_correlations,
    numericColumns,
    categoricalColumns,
    datetimeColumns,
  };
}

export function generateKeyObservations(log: CleaningLog, eda: EDAResult): string[] {
  const obs: string[] = [];

  obs.push(
    `The dataset started with ${log.rows_before} rows and ${log.columns_before} columns and ended with ${log.rows_after} rows and ${log.columns_after} columns after cleaning.`
  );

  if (log.duplicates_removed > 0) {
    obs.push(`${log.duplicates_removed} duplicate rows were removed.`);
  }

  if (log.columns_dropped.length > 0) {
    obs.push(`Dropped columns (too many missing values): ${log.columns_dropped.join(', ')}.`);
  }

  if (Object.keys(log.missing_filled).length > 0) {
    const totalFilled = Object.values(log.missing_filled).reduce((a, b) => a + b, 0);
    const worstCol = Object.entries(log.missing_filled).reduce((max, curr) => (curr[1] > max[1] ? curr : max));
    obs.push(
      `${totalFilled} missing values were filled across ${Object.keys(log.missing_filled).length} columns; the most affected column was '${worstCol[0]}' (${worstCol[1]} values).`
    );
  }

  const flaggedCols = Object.entries(log.outliers).filter(([_, o]) => o.count > 0);
  if (flaggedCols.length > 0) {
    const topCol = flaggedCols.reduce((max, curr) => (curr[1].count > max[1].count ? curr : max));
    obs.push(
      `Outliers were flagged in ${flaggedCols.length} numeric columns; '${topCol[0]}' had the most (${topCol[1].count} values, ${topCol[1].percent}%).`
    );
  } else {
    obs.push('No outliers were flagged in the numeric columns.');
  }

  const skewCols = Object.entries(eda.skewness);
  if (skewCols.length > 0) {
    const mostSkewed = skewCols.reduce((max, curr) => (Math.abs(curr[1]) > Math.abs(max[1]) ? curr : max));
    obs.push(
      `The most skewed column is '${mostSkewed[0]}' (skewness ${mostSkewed[1]}), so its mean is not a good summary of a typical value.`
    );
  }

  if (eda.top_correlations.length > 0) {
    const p = eda.top_correlations[0];
    obs.push(
      `The strongest relationship is between '${p.col1}' and '${p.col2}' (r = ${p.corr}, ${p.strength}).`
    );
  }

  return obs;
}
