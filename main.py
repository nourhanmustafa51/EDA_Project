"""main.py - The full pipeline: clean -> EDA -> PDF report (-> email).

Usage:  python main.py data/incoming/titanic.csv
"""
import os
import sys
import json

from cleaner import clean_data
from eda import run_eda
from report import build_report

BASE = os.path.dirname(os.path.abspath(__file__))


def run_pipeline(file_path, send_email=False):
    """Run the whole pipeline for one dataset and return the PDF path."""
    stem = os.path.splitext(os.path.basename(file_path))[0]
    print(f"[pipeline] Processing {file_path}")

    # 1. Clean
    df, log = clean_data(file_path)
    print(f"[pipeline] Cleaned: {log['rows_before']} -> {log['rows_after']} rows")

    # Save the cleaned data and the decision log
    cleaned_dir = os.path.join(BASE, "outputs", "cleaned")
    os.makedirs(cleaned_dir, exist_ok=True)
    df.to_csv(os.path.join(cleaned_dir, f"{stem}_cleaned.csv"), index=False)
    with open(os.path.join(cleaned_dir, f"{stem}_log.json"), "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2, ensure_ascii=False, default=str)

    # 2. EDA and charts
    eda_result = run_eda(df, chart_dir=os.path.join(BASE, "outputs", "charts", stem))
    print("[pipeline] Statistics and charts done")

    # 3. PDF report
    pdf_path = os.path.join(BASE, "outputs", "reports", f"{stem}_report.pdf")
    build_report(df, log, eda_result, pdf_path)
    print(f"[pipeline] Report saved: {pdf_path}")

    # 4. Email (added later in emailer.py)
    if send_email:
        from emailer import send_report
        send_report(pdf_path, log)
        print("[pipeline] Report emailed")

    return pdf_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <path-to-file> [--email]")
        sys.exit(1)
    run_pipeline(sys.argv[1], send_email="--email" in sys.argv)
