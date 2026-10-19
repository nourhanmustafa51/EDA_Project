# Automated EDA & Data Cleaning Pipeline

A React & TypeScript implementation of the statistical data cleaning, exploratory data analysis (EDA), and audit report generation pipeline originally developed in Python.

## Core Features Preserved

1. **Statistical Cleaning Pipeline (`cleaner`)**
   - **Deduplication:** Automatic identification and removal of exact duplicate records.
   - **Type Inference:** Automatic detection and conversion of text columns to numeric or datetime when &ge;90% of non-null values conform.
   - **Missing Value Imputation:**
     - Drops columns with &gt;50% missing values (`MISSING_DROP_PCT = 50`).
     - Numeric columns: skewness &lt; 0.5 uses Mean (symmetric distribution); skewness &ge; 0.5 uses Median (robust to skew/extreme values).
     - Datetime columns: preserved without arbitrary interpolation.
     - Categorical columns: imputed using the Mode (most frequent value).
   - **Outlier Detection:**
     - Skewness &lt; 0.5: Z-Score method ($|z| > 3$).
     - Skewness &ge; 0.5: Interquartile Range method ($[Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$).
     - Outliers flagged only, never deleted.
   - **Audit Trail:** Deterministic record of every step, column, action, and statistical rationale.

2. **Exploratory Data Analysis (`eda`)**
   - Descriptive summary statistics: count, mean, standard deviation, minimum, 25th percentile, median, 75th percentile, maximum, and sample skewness.
   - Full Pearson correlation matrix with strength descriptors (negligible, weak, moderate, strong, very strong).
   - Top correlations ranking.
   - Interactive visualizations: Distribution histograms with KDE curve approximation and mean/median lines, Outlier boxplots with whiskers and scatter points, and Diverging coolwarm correlation heatmap.

3. **Report Generation (`report`)**
   - 7-section publication format matching ReportLab PDF typography (Navy `#1F3A5F`, Light `#EAF1F8`, Grid `#C5D3E3`):
     1. Executive Summary & Key Observations
     2. Statistical Decision Rules Reference Table
     3. Complete Cleaning Decisions Log
     4. Outlier Detection Results & Bounds
     5. Post-Cleaning Descriptive Statistics Table
     6. Strongest Feature Correlations
     7. Statistical Visualizations
   - One-click PDF Export, Native Printing, Cleaned CSV Export, and Decision Log JSON Download.

4. **Delivery & Upload Pipeline (`watcher` & `emailer`)**
   - Drag-and-drop file ingestion for CSV (`.csv`) and Microsoft Excel (`.xlsx`, `.xls`).
   - Pre-loaded benchmark datasets (Titanic Passengers, Real Estate & Housing, Employee Salaries).
   - Email dispatch configuration with SMTP settings, automated subject and body generation, and attachment bundling.

## Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS
- **Data Ingestion:** PapaParse (CSV) & SheetJS XLSX (Excel)
- **Icons:** Lucide React
