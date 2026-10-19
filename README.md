# Automated Data Cleaning & EDA Report Generator

A Python pipeline that takes a raw CSV or Excel dataset and produces a **PDF report** that explains
how the data was cleaned, **which decision was made on every column, and why**.
Everything is done with code and statistics (Pandas, NumPy, Matplotlib, Seaborn). No AI is involved,
so the same data always gives the same report.

## Problem

Data scientists and analysts spend a lot of time writing the same boilerplate code to clean data,
compute statistics and write up the result. This project automates the whole chain.

## How it works

```
 CSV / Excel file
        |
        v
 [ watcher.py ]  watches data/incoming (watchdog)  or  POST /upload (FastAPI)
        |
        v
 [ main.py ]  runs the pipeline
        |
        +--> [ cleaner.py ]  clean the data + record every decision and its reason
        |
        +--> [ eda.py ]      statistics, correlations, charts (Matplotlib / Seaborn)
        |
        +--> [ report.py ]   PDF report (ReportLab)
        |
        +--> [ emailer.py ]  optional: email the PDF (smtplib)
```

## Cleaning rules (statistics, not AI)

| Situation | Rule | Why |
|---|---|---|
| Column with more than 50% missing values | Drop the column | Too little information to fill reliably |
| Missing numeric values, \|skewness\| < 0.5 | Fill with the **mean** | Symmetric distribution, the mean is representative |
| Missing numeric values, \|skewness\| >= 0.5 | Fill with the **median** | Skewed distribution, the median resists extreme values |
| Missing categorical values | Fill with the **mode** | Most frequent value is the standard choice |
| Outliers, \|skewness\| < 0.5 | **Z-Score** (\|z\| > 3) | Mean and standard deviation are reliable |
| Outliers, \|skewness\| >= 0.5 | **IQR** (Q1 - 1.5 IQR, Q3 + 1.5 IQR) | Robust to skewed data |
| Outliers | Flagged only, never removed | They may be genuine extreme values |
| Duplicate rows | Removed | They would be counted twice |
| Text columns that are really numbers or dates | Converted | At least 90% of values parse correctly |

The thresholds are constants at the top of `cleaner.py`.

## The report contains

1. Summary (rows before/after, duplicates, dropped columns, key observations)
2. Decision rules used
3. **Cleaning decisions table: what was done and why**
4. Outlier detection results
5. Descriptive statistics
6. Strongest correlations
7. Charts: histograms, boxplots, correlation heatmap

## Project structure

```
Project/
  cleaner.py      data cleaning + decision log
  eda.py          statistics and charts
  report.py       PDF report builder
  main.py         full pipeline
  watcher.py      folder watcher (watchdog) + upload API (FastAPI)
  webapp.py       web interface backend (FastAPI)
  static/         web interface (index.html)
  emailer.py      email dispatch (smtplib)
  data/incoming/  drop files here
  outputs/        charts, cleaned data, logs and PDF reports
```

## Setup

```
python -m venv venv
venv\Scripts\activate            (Windows)
pip install -r requirements.txt
```

Optional email settings: copy `.env.example` to `.env` and fill it in
(Gmail needs an **App Password** and 2-Step Verification).
Never commit the real `.env` file.

## Usage

Run once on a file:

```
python main.py data/incoming/titanic.csv
```

Watch a folder (drop a file into `data/incoming` and the report is created automatically):

```
python watcher.py
```

Upload API:

```
uvicorn watcher:app
```

Then open http://127.0.0.1:8000/docs and use `POST /upload`.

Reports are saved in `outputs/reports/<file name>_report.pdf`.

## Web app

A browser interface that runs the same pipeline on the server.

```
uvicorn webapp:app --reload
```

Open http://127.0.0.1:8000, drop a CSV or Excel file (or press "Try the Titanic sample") and you get
the decisions table, the outlier results, the charts, and downloads for the PDF report, the cleaned CSV
and the decision log. Uploaded files are not kept, and results are deleted after 24 hours.

Note: GitHub Pages only hosts static pages, so it cannot run this Python server.
To put the app online, deploy the repository to a service that runs Python (for example Render)
with the start command `uvicorn webapp:app --host 0.0.0.0 --port $PORT`.

## Technologies

Python, Pandas, NumPy, Matplotlib, Seaborn, ReportLab, watchdog, FastAPI, smtplib.

## Limitations and future work

- The rules are fixed, so the pipeline does not understand the meaning of a column
  (for example, an ID column is treated like any other number).
- Only numeric columns are plotted and analyzed statistically.
- Future work: a language model could add a written narrative on top of these results,
  and the thresholds could be configurable per dataset.

## Screenshots

Add screenshots of the generated report and the terminal output here.
