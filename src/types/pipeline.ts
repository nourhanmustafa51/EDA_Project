export interface DecisionItem {
  step: string;
  column: string;
  action: string;
  reason: string;
}

export interface OutlierDetail {
  method: 'Z-Score' | 'IQR';
  count: number;
  percent: number;
  bounds: [number, number] | null;
}

export interface CleaningLog {
  file: string;
  rows_before: number;
  columns_before: number;
  rows_after: number;
  columns_after: number;
  duplicates_removed: number;
  type_changes: string[];
  columns_dropped: string[];
  missing_filled: Record<string, number>;
  outliers: Record<string, OutlierDetail>;
  skewness: Record<string, number>;
  decisions: string[];
  decision_table: DecisionItem[];
  timestamp: string;
}

export interface ColumnSummaryStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  skewness: number;
}

export interface CorrelationPair {
  col1: string;
  col2: string;
  corr: number;
  strength: string;
}

export interface EDAResult {
  summary_stats: Record<string, ColumnSummaryStats>;
  skewness: Record<string, number>;
  correlations: {
    columns: string[];
    matrix: number[][];
  };
  top_correlations: CorrelationPair[];
  numericColumns: string[];
  categoricalColumns: string[];
  datetimeColumns: string[];
}

export interface PipelineResult {
  fileName: string;
  rawRows: Record<string, any>[];
  cleanedRows: Record<string, any>[];
  cleanedColumns: string[];
  rawColumns: string[];
  log: CleaningLog;
  eda: EDAResult;
}
