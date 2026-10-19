import { CleaningLog, DecisionItem, OutlierDetail } from '../types/pipeline';

export const SKEW_LIMIT = 0.5;
export const MISSING_DROP_PCT = 50;
export const Z_LIMIT = 3;
export const IQR_FACTOR = 1.5;

function isBlank(val: any): boolean {
  return val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val)) || String(val).trim() === '';
}

export function calculateSkewness(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  let sumSq = 0;
  let sumCube = 0;
  for (const v of values) {
    const diff = v - mean;
    sumSq += diff * diff;
    sumCube += diff * diff * diff;
  }
  const variance = sumSq / (n - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  
  // Pandas adjusted Fisher-Pearson sample skewness
  const m3 = sumCube / n;
  const m2 = sumSq / n;
  const factor = Math.sqrt(n * (n - 1)) / (n - 2);
  const skew = factor * (m3 / Math.pow(m2, 1.5));
  return isNaN(skew) || !isFinite(skew) ? 0 : skew;
}

export function calculateQuantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const pos = (sortedAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedAsc[base + 1] !== undefined) {
    return sortedAsc[base] + rest * (sortedAsc[base + 1] - sortedAsc[base]);
  }
  return sortedAsc[base];
}

export function cleanData(rawRows: Record<string, any>[], filename: string): { cleanedRows: Record<string, any>[]; log: CleaningLog } {
  const log: CleaningLog = {
    file: filename,
    rows_before: rawRows.length,
    columns_before: rawRows.length > 0 ? Object.keys(rawRows[0]).length : 0,
    rows_after: 0,
    columns_after: 0,
    duplicates_removed: 0,
    type_changes: [],
    columns_dropped: [],
    missing_filled: {},
    outliers: {},
    skewness: {},
    decisions: [],
    decision_table: [],
    timestamp: new Date().toISOString(),
  };

  const addDecision = (step: string, column: string, action: string, reason: string) => {
    log.decision_table.push({ step, column, action, reason });
    log.decisions.push(`[${step}] ${column}: ${action} - ${reason}`);
  };

  if (rawRows.length === 0) {
    log.rows_after = 0;
    log.columns_after = 0;
    return { cleanedRows: [], log };
  }

  // Deep clone rows to prevent mutating input
  let rows: Record<string, any>[] = rawRows.map(r => ({ ...r }));
  let columns = Object.keys(rows[0]);

  // Step 1: Duplicates removal
  const beforeCount = rows.length;
  const seenKeys = new Set<string>();
  const dedupedRows: Record<string, any>[] = [];

  for (const row of rows) {
    const key = JSON.stringify(row);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      dedupedRows.push(row);
    }
  }

  const removedDuplicates = beforeCount - dedupedRows.length;
  log.duplicates_removed = removedDuplicates;
  rows = dedupedRows;

  if (removedDuplicates > 0) {
    addDecision(
      'Duplicates',
      '(all columns)',
      `Removed ${removedDuplicates} duplicate rows`,
      'Exact duplicate records would be counted twice and distort the statistics'
    );
  } else {
    addDecision(
      'Duplicates',
      '(all columns)',
      'No duplicate rows found',
      'Every row is unique, so nothing was removed'
    );
  }

  // Step 2: Type Inference
  // Try numeric first (at least 90% non-null parsed as number)
  // Then try datetime (at least 90% non-null parsed as dates)
  for (const col of columns) {
    const values = rows.map(r => r[col]);
    const nonNullValues = values.filter(v => !isBlank(v));
    const nonNullCount = nonNullValues.length;

    if (nonNullCount === 0) continue;

    // Check if already typed as pure numbers
    const allAlreadyNumber = nonNullValues.every(v => typeof v === 'number');
    if (allAlreadyNumber) continue;

    // Try numeric
    let numericSuccessCount = 0;
    for (const v of nonNullValues) {
      if (typeof v === 'number' && !isNaN(v)) {
        numericSuccessCount++;
      } else if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed !== '' && !isNaN(Number(trimmed)) && !trimmed.includes(':') && !trimmed.includes('-')) {
          numericSuccessCount++;
        }
      }
    }

    if (numericSuccessCount >= 0.9 * nonNullCount) {
      for (const row of rows) {
        if (!isBlank(row[col])) {
          const num = Number(row[col]);
          row[col] = isNaN(num) ? null : num;
        } else {
          row[col] = null;
        }
      }
      log.type_changes.push(`${col}: text -> numeric`);
      addDecision(
        'Type inference',
        col,
        'Converted from text to numeric',
        'At least 90% of the values could be parsed as numbers'
      );
      continue;
    }

    // Try datetime
    let dateSuccessCount = 0;
    for (const v of nonNullValues) {
      if (typeof v === 'string' && v.trim().length >= 6) {
        const parsed = Date.parse(v);
        if (!isNaN(parsed)) {
          dateSuccessCount++;
        }
      } else if (v instanceof Date && !isNaN(v.getTime())) {
        dateSuccessCount++;
      }
    }

    if (dateSuccessCount >= 0.9 * nonNullCount) {
      for (const row of rows) {
        if (!isBlank(row[col])) {
          const d = new Date(row[col]);
          row[col] = isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        } else {
          row[col] = null;
        }
      }
      log.type_changes.push(`${col}: text -> datetime`);
      addDecision(
        'Type inference',
        col,
        'Converted from text to datetime',
        'At least 90% of the values could be parsed as dates'
      );
    }
  }

  // Step 3: Handle Missing Values using statistical rules
  const activeCols = [...columns];
  for (const col of activeCols) {
    const missingCount = rows.filter(r => isBlank(r[col])).length;
    if (missingCount === 0) continue;

    const pct = Number(((missingCount / rows.length) * 100).toFixed(1));

    // Rule 1: > 50% missing -> drop column
    if (pct > MISSING_DROP_PCT) {
      for (const row of rows) {
        delete row[col];
      }
      columns = columns.filter(c => c !== col);
      log.columns_dropped.push(col);
      addDecision(
        'Missing values',
        col,
        `Column dropped (${missingCount} missing, ${pct}%)`,
        `More than ${MISSING_DROP_PCT}% of the values are missing, so there is too little information to fill reliably`
      );
      continue;
    }

    // Check column type (numeric vs date vs categorical)
    const nonNullVals = rows.filter(r => !isBlank(r[col])).map(r => r[col]);
    const isNumeric = nonNullVals.length > 0 && nonNullVals.every(v => typeof v === 'number');
    const isDate = nonNullVals.length > 0 && nonNullVals.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v));

    if (isNumeric) {
      const nums = nonNullVals as number[];
      const skew = Number(calculateSkewness(nums).toFixed(2));
      let fillVal: number;
      let method: string;
      let reason: string;

      if (Math.abs(skew) < SKEW_LIMIT) {
        fillVal = nums.reduce((a, b) => a + b, 0) / nums.length;
        method = 'mean';
        reason = `Skewness is ${skew.toFixed(2)} (within +/-${SKEW_LIMIT}), so the distribution is roughly symmetric and the mean is representative`;
      } else {
        const sorted = [...nums].sort((a, b) => a - b);
        fillVal = calculateQuantile(sorted, 0.5);
        method = 'median';
        reason = `Skewness is ${skew.toFixed(2)} (beyond +/-${SKEW_LIMIT}), so the distribution is skewed and the median is robust to extreme values`;
      }

      fillVal = Number(fillVal.toFixed(2));
      for (const row of rows) {
        if (isBlank(row[col])) {
          row[col] = fillVal;
        }
      }

      addDecision(
        'Missing values',
        col,
        `Filled ${missingCount} missing values (${pct}%) with the ${method} (${fillVal})`,
        reason
      );
      log.missing_filled[col] = missingCount;
    } else if (isDate) {
      addDecision(
        'Missing values',
        col,
        `${missingCount} missing dates left unchanged`,
        'There is no statistically sound way to estimate a missing date'
      );
    } else {
      // Categorical -> Mode
      const counts: Record<string, number> = {};
      for (const val of nonNullVals) {
        const s = String(val).trim();
        counts[s] = (counts[s] || 0) + 1;
      }

      let maxCount = -1;
      let modeVal = 'Unknown';
      for (const [k, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          modeVal = k;
        }
      }

      for (const row of rows) {
        if (isBlank(row[col])) {
          row[col] = modeVal;
        }
      }

      addDecision(
        'Missing values',
        col,
        `Filled ${missingCount} missing values (${pct}%) with the mode ('${modeVal}')`,
        'The column is categorical, so the most frequent value is the standard replacement'
      );
      log.missing_filled[col] = missingCount;
    }
  }

  // Step 4: Outlier Detection (flag only, nothing removed)
  for (const col of columns) {
    const nonNullVals = rows.map(r => r[col]).filter(v => typeof v === 'number') as number[];
    const uniqueCount = new Set(nonNullVals).size;

    if (uniqueCount <= 2 || nonNullVals.length < 5) {
      continue; // Skip binary and tiny samples
    }

    const skew = Number(calculateSkewness(nonNullVals).toFixed(3));
    log.skewness[col] = skew;

    let method: 'Z-Score' | 'IQR';
    let outlierCount = 0;
    let bounds: [number, number] | null = null;
    let reason = '';

    if (Math.abs(skew) < SKEW_LIMIT) {
      method = 'Z-Score';
      const mean = nonNullVals.reduce((a, b) => a + b, 0) / nonNullVals.length;
      const variance = nonNullVals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (nonNullVals.length - 1);
      const std = Math.sqrt(variance);

      if (std === 0) continue;

      for (const v of nonNullVals) {
        const z = Math.abs((v - mean) / std);
        if (z > Z_LIMIT) {
          outlierCount++;
        }
      }
      bounds = [Number((mean - Z_LIMIT * std).toFixed(2)), Number((mean + Z_LIMIT * std).toFixed(2))];
      reason = `Skewness is ${skew.toFixed(2)}, so the distribution is roughly symmetric and mean/std are reliable; values with |z| > ${Z_LIMIT} are flagged`;
    } else {
      method = 'IQR';
      const sorted = [...nonNullVals].sort((a, b) => a - b);
      const q1 = calculateQuantile(sorted, 0.25);
      const q3 = calculateQuantile(sorted, 0.75);
      const iqr = q3 - q1;
      const low = Number((q1 - IQR_FACTOR * iqr).toFixed(2));
      const high = Number((q3 + IQR_FACTOR * iqr).toFixed(2));
      bounds = [low, high];

      for (const v of nonNullVals) {
        if (v < low || v > high) {
          outlierCount++;
        }
      }
      reason = `Skewness is ${skew.toFixed(2)}, so the distribution is skewed and the mean/std are distorted by the tail; the IQR method is robust (values outside [${low}, ${high}] are flagged)`;
    }

    const pct = Number(((outlierCount / nonNullVals.length) * 100).toFixed(2));
    log.outliers[col] = {
      method,
      count: outlierCount,
      percent: pct,
      bounds,
    };

    addDecision(
      'Outlier detection',
      col,
      `${method}: ${outlierCount} outliers flagged (kept in the data, not removed)`,
      `${reason}. Outliers are kept because they may be genuine extreme values`
    );
  }

  if (Object.keys(log.missing_filled).length === 0 && log.columns_dropped.length === 0) {
    addDecision(
      'Missing values',
      '(all columns)',
      'No missing values found',
      'No imputation was needed'
    );
  }

  log.rows_after = rows.length;
  log.columns_after = columns.length;

  return { cleanedRows: rows, log };
}
