"""eda.py - Summary statistics and charts (Matplotlib / Seaborn)."""
import os

import matplotlib
matplotlib.use("Agg")  # save images without opening any windows
import matplotlib.pyplot as plt
import seaborn as sns

MAX_COLS = 6  # maximum number of columns to plot, to keep the report short


def run_eda(df, chart_dir="outputs/charts"):
    os.makedirs(chart_dir, exist_ok=True)
    numeric = df.select_dtypes(include="number")
    charts = {"hist": [], "box": [], "heatmap": None}

    # Descriptive statistics and skewness
    summary = numeric.describe().round(2)
    skewness = {c: round(float(numeric[c].skew()), 2) for c in numeric.columns}

    # Strongest correlations
    corr = numeric.corr().round(2)
    pairs = []
    cols = list(corr.columns)
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            value = corr.iloc[i, j]
            if value == value:  # skip NaN
                pairs.append((cols[i], cols[j], float(value)))
    pairs.sort(key=lambda p: abs(p[2]), reverse=True)
    top_pairs = [{"col1": a, "col2": b, "corr": c} for a, b, c in pairs[:5]]

    # Skip binary columns when plotting
    plot_cols = [c for c in numeric.columns if numeric[c].nunique() > 2][:MAX_COLS]

    # Histograms
    for col in plot_cols:
        plt.figure(figsize=(6, 4))
        sns.histplot(numeric[col].dropna(), kde=True, color="#2E6F9E")
        plt.title(f"Distribution of {col}")
        path = os.path.join(chart_dir, f"hist_{col}.png")
        plt.tight_layout()
        plt.savefig(path, dpi=120)
        plt.close()
        charts["hist"].append(path)

    # Boxplots
    for col in plot_cols:
        plt.figure(figsize=(6, 3))
        sns.boxplot(x=numeric[col].dropna(), color="#9ECAE1")
        plt.title(f"Boxplot of {col}")
        path = os.path.join(chart_dir, f"box_{col}.png")
        plt.tight_layout()
        plt.savefig(path, dpi=120)
        plt.close()
        charts["box"].append(path)

    # Correlation heatmap
    if numeric.shape[1] >= 2:
        plt.figure(figsize=(7, 6))
        sns.heatmap(corr, annot=True, cmap="coolwarm", center=0, fmt=".2f")
        plt.title("Correlation Heatmap")
        path = os.path.join(chart_dir, "heatmap.png")
        plt.tight_layout()
        plt.savefig(path, dpi=120)
        plt.close()
        charts["heatmap"] = path

    return {
        "summary_stats": summary.to_dict(),
        "skewness": skewness,
        "top_correlations": top_pairs,
        "charts": charts,
    }


if __name__ == "__main__":
    # Quick test:  python eda.py data/incoming/titanic.csv
    import sys
    from cleaner import clean_data

    if len(sys.argv) < 2:
        print("Usage: python eda.py <path-to-file>")
        sys.exit(1)
    clean_df, _ = clean_data(sys.argv[1])
    result = run_eda(clean_df)
    print("Top correlations:")
    for p in result["top_correlations"]:
        print(f"  {p['col1']} vs {p['col2']}: {p['corr']}")
    n = len(result["charts"]["hist"]) + len(result["charts"]["box"]) + (1 if result["charts"]["heatmap"] else 0)
    print(f"\n{n} charts saved in outputs/charts")
