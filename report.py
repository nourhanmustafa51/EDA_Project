"""report.py - Build the PDF report with ReportLab.

The whole report is generated from the cleaning log and the EDA results using
rules and templates (no AI). It explains every decision: what was done, on which
column, and why.
"""
import os
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, Image, PageBreak)

from cleaner import SKEW_LIMIT, MISSING_DROP_PCT, Z_LIMIT, IQR_FACTOR

NAVY = colors.HexColor("#1F3A5F")
LIGHT = colors.HexColor("#EAF1F8")
GRID = colors.HexColor("#C5D3E3")

_base = getSampleStyleSheet()
BODY = ParagraphStyle("Body", parent=_base["BodyText"], fontSize=10, leading=14)
CELL = ParagraphStyle("Cell", parent=BODY, fontSize=8.5, leading=11)
CELL_HEAD = ParagraphStyle("CellHead", parent=CELL, textColor=colors.white,
                           fontName="Helvetica-Bold")
H1 = ParagraphStyle("H1", parent=_base["Heading1"], textColor=NAVY, fontSize=15,
                    spaceBefore=14, spaceAfter=6)
TITLE = ParagraphStyle("Title2", parent=_base["Title"], textColor=NAVY, fontSize=24)
SUB = ParagraphStyle("Sub", parent=BODY, textColor=colors.grey, alignment=1)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=14, bulletIndent=2)


def _p(text, style=BODY):
    return Paragraph(escape(str(text)), style)


def _table(rows, col_widths, header=True):
    """rows: list of lists of plain strings; wraps text in cells."""
    data = []
    for r, row in enumerate(rows):
        style = CELL_HEAD if (header and r == 0) else CELL
        data.append([_p(c, style) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    cmds = [("GRID", (0, 0), (-1, -1), 0.4, GRID),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]
    if header:
        cmds.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
        for i in range(1, len(rows)):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), LIGHT))
    t.setStyle(TableStyle(cmds))
    return t


def _image(path, max_w):
    w, h = ImageReader(path).getSize()
    scale = max_w / w
    return Image(path, width=w * scale, height=h * scale)


def _image_grid(paths, per_row, cell_w):
    rows, row = [], []
    for p in paths:
        row.append(_image(p, cell_w))
        if len(row) == per_row:
            rows.append(row)
            row = []
    if row:
        rows.append(row + [""] * (per_row - len(row)))
    return Table(rows, colWidths=[cell_w + 0.3 * cm] * per_row) if rows else None


def _strength(r):
    a = abs(r)
    if a < 0.1:
        label = "negligible"
    elif a < 0.3:
        label = "weak"
    elif a < 0.5:
        label = "moderate"
    elif a < 0.7:
        label = "strong"
    else:
        label = "very strong"
    return f"{label} {'positive' if r > 0 else 'negative' if r < 0 else ''}".strip()


def _observations(log, eda):
    """Rule-based key observations."""
    obs = []
    obs.append(f"The dataset started with {log['rows_before']} rows and "
               f"{log['columns_before']} columns and ended with {log['rows_after']} rows "
               f"and {log['columns_after']} columns after cleaning.")
    if log["duplicates_removed"]:
        obs.append(f"{log['duplicates_removed']} duplicate rows were removed.")
    if log["columns_dropped"]:
        obs.append("Dropped columns (too many missing values): "
                   + ", ".join(log["columns_dropped"]) + ".")
    if log["missing_filled"]:
        total = sum(log["missing_filled"].values())
        worst = max(log["missing_filled"], key=log["missing_filled"].get)
        obs.append(f"{total} missing values were filled across "
                   f"{len(log['missing_filled'])} columns; the most affected column was "
                   f"'{worst}' ({log['missing_filled'][worst]} values).")
    flagged = {c: o for c, o in log["outliers"].items() if o["count"] > 0}
    if flagged:
        top = max(flagged, key=lambda c: flagged[c]["count"])
        obs.append(f"Outliers were flagged in {len(flagged)} numeric columns; '{top}' had "
                   f"the most ({flagged[top]['count']} values, {flagged[top]['percent']}%).")
    else:
        obs.append("No outliers were flagged in the numeric columns.")
    if eda["skewness"]:
        col = max(eda["skewness"], key=lambda c: abs(eda["skewness"][c]))
        obs.append(f"The most skewed column is '{col}' (skewness {eda['skewness'][col]}), "
                   f"so its mean is not a good summary of a typical value.")
    if eda["top_correlations"]:
        p = eda["top_correlations"][0]
        obs.append(f"The strongest relationship is between '{p['col1']}' and '{p['col2']}' "
                   f"(r = {p['corr']}, {_strength(p['corr'])}).")
    return obs


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(2 * cm, 1.2 * cm, "Automated EDA Report")
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
    canvas.restoreState()


def build_report(df, log, eda, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(output_path, pagesize=A4, leftMargin=2 * cm,
                            rightMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
                            title="Automated EDA Report")
    W = A4[0] - 4 * cm
    story = []

    # ---- Title
    story += [Spacer(1, 1.5 * cm), _p("Automated Data Cleaning & EDA Report", TITLE),
              Spacer(1, 6), _p(f"Dataset: {log['file']}", SUB),
              _p(f"Generated on {datetime.now():%Y-%m-%d %H:%M}", SUB), Spacer(1, 18)]

    # ---- 1. Key observations
    story.append(_p("1. Summary", H1))
    for line in _observations(log, eda):
        story.append(Paragraph(escape(line), BULLET, bulletText="-"))

    # ---- 2. Decision rules
    story.append(_p("2. Decision Rules Used", H1))
    story.append(_p("All decisions were made by fixed statistical rules in code, so the "
                    "same data always gives the same result. The thresholds are:"))
    story.append(Spacer(1, 4))
    story.append(_table([
        ["Situation", "Rule"],
        ["Missing values in a column", f"More than {MISSING_DROP_PCT}% missing: drop the column."],
        ["Missing numeric values", f"|skewness| < {SKEW_LIMIT}: fill with the mean. Otherwise: fill with the median."],
        ["Missing categorical values", "Fill with the most frequent value (mode)."],
        ["Outlier detection", f"|skewness| < {SKEW_LIMIT}: Z-Score (|z| > {Z_LIMIT}). Otherwise: IQR "
                              f"(outside Q1 - {IQR_FACTOR}xIQR or Q3 + {IQR_FACTOR}xIQR)."],
        ["Outliers", "Flagged only, never removed."],
        ["Duplicates", "Exact duplicate rows are removed."],
    ], [5.2 * cm, W - 5.2 * cm]))

    # ---- 3. Decisions log
    story.append(_p("3. Cleaning Decisions: What Was Done and Why", H1))
    rows = [["Step", "Column", "What was done", "Why"]]
    for d in log["decision_table"]:
        rows.append([d["step"], d["column"], d["action"], d["reason"]])
    story.append(_table(rows, [2.6 * cm, 2.4 * cm, 5.0 * cm, W - 10.0 * cm]))

    # ---- 4. Outliers
    story.append(_p("4. Outlier Detection Results", H1))
    if log["outliers"]:
        rows = [["Column", "Method", "Outliers", "% of values", "Bounds"]]
        for col, o in log["outliers"].items():
            rows.append([col, o["method"], o["count"], f"{o['percent']}%",
                         f"{o['bounds'][0]} to {o['bounds'][1]}" if o["bounds"] else f"|z| > {Z_LIMIT}"])
        story.append(_table(rows, [4 * cm, 2.4 * cm, 2.4 * cm, 2.6 * cm, W - 11.4 * cm]))
    else:
        story.append(_p("No numeric columns were eligible for outlier detection."))

    # ---- 5. Statistics
    story.append(PageBreak())
    story.append(_p("5. Descriptive Statistics (after cleaning)", H1))
    stats = eda["summary_stats"]
    if stats:
        rows = [["Column", "Count", "Mean", "Std", "Min", "Median", "Max", "Skew"]]
        for col, s in stats.items():
            rows.append([col, int(s["count"]), s["mean"], s["std"], s["min"], s["50%"],
                         s["max"], eda["skewness"].get(col, "")])
        story.append(_table(rows, [3.4 * cm] + [(W - 3.4 * cm) / 7] * 7))
    else:
        story.append(_p("The dataset has no numeric columns."))

    # ---- 6. Correlations
    story.append(_p("6. Strongest Correlations", H1))
    if eda["top_correlations"]:
        rows = [["Column A", "Column B", "Correlation (r)", "Strength"]]
        for p in eda["top_correlations"]:
            rows.append([p["col1"], p["col2"], p["corr"], _strength(p["corr"])])
        story.append(_table(rows, [4 * cm, 4 * cm, 3 * cm, W - 11 * cm]))
        story.append(Spacer(1, 4))
        story.append(_p("Correlation shows that two columns move together; it does not "
                        "prove that one causes the other."))
    else:
        story.append(_p("Not enough numeric columns to compute correlations."))

    # ---- 7. Charts
    charts = eda["charts"]
    if charts["hist"] or charts["heatmap"]:
        story.append(PageBreak())
        story.append(_p("7. Charts", H1))
    if charts["hist"]:
        story.append(_p("Distributions: the shape of each numeric column."))
        story.append(Spacer(1, 4))
        story.append(_image_grid(charts["hist"], 2, W / 2 - 0.3 * cm))
    if charts["box"]:
        story.append(Spacer(1, 8))
        story.append(_p("Boxplots: points beyond the whiskers are potential outliers."))
        story.append(Spacer(1, 4))
        story.append(_image_grid(charts["box"], 2, W / 2 - 0.3 * cm))
    if charts["heatmap"]:
        story.append(PageBreak())
        story.append(_p("Correlation heatmap: red = positive, blue = negative."))
        story.append(Spacer(1, 4))
        story.append(_image(charts["heatmap"], W * 0.85))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return output_path
