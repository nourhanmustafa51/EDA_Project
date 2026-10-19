"""cleaner.py - Data cleaning using code and statistics only (no AI involved).

Every decision is recorded in the log together with its reason.
The report generator reads this log to explain what was done and why.
"""
import os
import sys
import json
import warnings

import pandas as pd

SKEW_LIMIT = 0.5        # |skewness| below this = roughly symmetric distribution
MISSING_DROP_PCT = 50   # drop a column if more than this % of values are missing
Z_LIMIT = 3             # Z-Score threshold
IQR_FACTOR = 1.5        # IQR multiplier


def _decide(log, step, column, action, reason):
    """Record one decision (what was done, on which column, and why)."""
    log["decision_table"].append(
        {"step": step, "column": column, "action": action, "reason": reason})
    log["decisions"].append(f"[{step}] {column}: {action} - {reason}")


def load_file(path):
    """Load a CSV or Excel file."""
    if path.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(path)
    return pd.read_csv(path)


def infer_types(df, log):
    """Convert text columns to numeric or datetime when most values fit."""
    for col in df.columns:
        if (pd.api.types.is_numeric_dtype(df[col])
                or pd.api.types.is_datetime64_any_dtype(df[col])
                or pd.api.types.is_bool_dtype(df[col])):
            continue
        non_null = df[col].notna().sum()
        if non_null == 0:
            continue

        # Try numeric first (at least 90% of values must convert)
        as_num = pd.to_numeric(df[col], errors="coerce")
        if as_num.notna().sum() >= 0.9 * non_null:
            df[col] = as_num
            log["type_changes"].append(f"{col}: text -> numeric")
            _decide(log, "Type inference", col, "Converted from text to numeric",
                    "At least 90% of the values could be parsed as numbers")
            continue

        # Then try datetime
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            as_date = pd.to_datetime(df[col], errors="coerce")
        if as_date.notna().sum() >= 0.9 * non_null:
            df[col] = as_date
            log["type_changes"].append(f"{col}: text -> datetime")
            _decide(log, "Type inference", col, "Converted from text to datetime",
                    "At least 90% of the values could be parsed as dates")
    return df


def handle_missing(df, log):
    """Handle missing values using statistical rules."""
    for col in list(df.columns):
        n_missing = int(df[col].isna().sum())
        if n_missing == 0:
            continue
        pct = round(n_missing / len(df) * 100, 1)

        # Rule 1: too many missing values -> drop the column
        if pct > MISSING_DROP_PCT:
            df = df.drop(columns=[col])
            log["columns_dropped"].append(col)
            _decide(log, "Missing values", col,
                    f"Column dropped ({n_missing} missing, {pct}%)",
                    f"More than {MISSING_DROP_PCT}% of the values are missing, "
                    f"so there is too little information to fill reliably")
            continue

        # Rule 2: numeric -> mean if skewness is small, otherwise median
        if pd.api.types.is_numeric_dtype(df[col]):
            skew = float(df[col].skew())
            if abs(skew) < SKEW_LIMIT:
                value, method = df[col].mean(), "mean"
                reason = (f"Skewness is {skew:.2f} (within +/-{SKEW_LIMIT}), so the "
                          f"distribution is roughly symmetric and the mean is representative")
            else:
                value, method = df[col].median(), "median"
                reason = (f"Skewness is {skew:.2f} (beyond +/-{SKEW_LIMIT}), so the "
                          f"distribution is skewed and the median is robust to extreme values")
            df[col] = df[col].fillna(value)
            _decide(log, "Missing values", col,
                    f"Filled {n_missing} missing values ({pct}%) with the {method} ({value:.2f})",
                    reason)

        # Rule 3: datetime -> leave as is
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            _decide(log, "Missing values", col,
                    f"{n_missing} missing dates left unchanged",
                    "There is no statistically sound way to estimate a missing date")
            continue

        # Rule 4: categorical -> mode
        else:
            mode = df[col].mode()
            value = mode.iloc[0] if len(mode) else "Unknown"
            df[col] = df[col].fillna(value)
            _decide(log, "Missing values", col,
                    f"Filled {n_missing} missing values ({pct}%) with the mode ('{value}')",
                    "The column is categorical, so the most frequent value is the "
                    "standard replacement")

        log["missing_filled"][col] = n_missing
    return df


def detect_outliers(df, log):
    """Detect outliers (flag only, nothing is removed)."""
    for col in df.select_dtypes(include="number").columns:
        series = df[col].dropna()
        if series.nunique() <= 2 or len(series) < 5:
            continue  # skip binary (0/1) columns and tiny samples

        skew = float(series.skew())
        log["skewness"][col] = round(skew, 3)

        if abs(skew) < SKEW_LIMIT:
            # Roughly symmetric -> Z-Score
            method = "Z-Score"
            std = series.std()
            if std == 0:
                continue
            z = (series - series.mean()) / std
            count = int((z.abs() > Z_LIMIT).sum())
            bounds = None
            reason = (f"Skewness is {skew:.2f}, so the distribution is roughly symmetric "
                      f"and mean/std are reliable; values with |z| > {Z_LIMIT} are flagged")
        else:
            # Skewed -> IQR
            method = "IQR"
            q1, q3 = series.quantile(0.25), series.quantile(0.75)
            iqr = q3 - q1
            low, high = q1 - IQR_FACTOR * iqr, q3 + IQR_FACTOR * iqr
            count = int(((series < low) | (series > high)).sum())
            bounds = [round(float(low), 2), round(float(high), 2)]
            reason = (f"Skewness is {skew:.2f}, so the distribution is skewed and the "
                      f"mean/std are distorted by the tail; the IQR method is robust "
                      f"(values outside [{bounds[0]}, {bounds[1]}] are flagged)")

        log["outliers"][col] = {
            "method": method,
            "count": count,
            "percent": round(count / len(series) * 100, 2),
            "bounds": bounds,
        }
        _decide(log, "Outlier detection", col,
                f"{method}: {count} outliers flagged (kept in the data, not removed)",
                reason + ". Outliers are kept because they may be genuine extreme values")
    return df


def clean_data(path):
    """Main function: returns the cleaned DataFrame and the cleaning log."""
    df = load_file(path)
    log = {
        "file": os.path.basename(path),
        "rows_before": len(df),
        "columns_before": len(df.columns),
        "duplicates_removed": 0,
        "type_changes": [],
        "columns_dropped": [],
        "missing_filled": {},
        "outliers": {},
        "skewness": {},
        "decisions": [],
        "decision_table": [],
    }

    # Step 1: duplicates
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    removed = before - len(df)
    log["duplicates_removed"] = removed
    if removed:
        _decide(log, "Duplicates", "(all columns)",
                f"Removed {removed} duplicate rows",
                "Exact duplicate records would be counted twice and distort the statistics")
    else:
        _decide(log, "Duplicates", "(all columns)", "No duplicate rows found",
                "Every row is unique, so nothing was removed")

    # Steps 2-4
    df = infer_types(df, log)
    df = handle_missing(df, log)
    df = detect_outliers(df, log)

    if not log["missing_filled"] and not log["columns_dropped"]:
        _decide(log, "Missing values", "(all columns)", "No missing values found",
                "No imputation was needed")

    log["rows_after"] = len(df)
    log["columns_after"] = len(df.columns)
    return df, log


if __name__ == "__main__":
    # Quick test:  python cleaner.py data/incoming/titanic.csv
    if len(sys.argv) < 2:
        print("Usage: python cleaner.py <path-to-file>")
        sys.exit(1)
    clean_df, clean_log = clean_data(sys.argv[1])
    print(json.dumps(clean_log, indent=2, ensure_ascii=False, default=str))
