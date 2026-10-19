import React from 'react';
import { Printer, Download, Copy, Check, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { PipelineResult } from '../types/pipeline';
import { generateKeyObservations } from '../utils/eda';
import { SKEW_LIMIT, MISSING_DROP_PCT, Z_LIMIT, IQR_FACTOR } from '../utils/cleaner';
import { ChartsView } from './ChartsView';

interface ReportViewProps {
  result: PipelineResult;
  onPrint: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ result, onPrint }) => {
  const { log, eda, cleanedRows } = result;
  const observations = generateKeyObservations(log, eda);
  const [copied, setCopied] = React.useState(false);

  const handleCopySummary = () => {
    const text = [
      `Automated Data Cleaning & EDA Report: ${log.file}`,
      `Generated: ${new Date(log.timestamp).toLocaleString()}`,
      '',
      'Key Observations:',
      ...observations.map(o => `- ${o}`),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-[#1F3A5F]" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Generated Report: {log.file}
            </h2>
            <p className="text-xs text-slate-500">
              Compiled using fixed statistical rules &amp; ReportLab typography standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy Summary'}
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1F3A5F] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#152740] shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Main Report Document Sheet (Styled to match ReportLab A4 Document) */}
      <div
        id="printable-report"
        className="bg-white rounded-xl border border-slate-300 p-8 sm:p-12 shadow-md max-w-5xl mx-auto space-y-8 font-sans print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="border-b-2 border-[#1F3A5F] pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F3A5F] tracking-tight">
            Automated Data Cleaning &amp; EDA Report
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Dataset: {log.file}</span>
            <span>Generated on {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* 1. Summary */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1F3A5F] flex items-center gap-2">
            1. Summary
          </h2>
          <div className="bg-[#EAF1F8] border-l-4 border-[#1F3A5F] p-4 rounded-r-md">
            <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
              {observations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#1F3A5F] font-bold">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2. Decision Rules Used */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1F3A5F]">
            2. Decision Rules Used
          </h2>
          <p className="text-xs text-slate-600">
            All decisions were made by fixed statistical rules in code, so the same data always gives the same result. The thresholds are:
          </p>

          <div className="overflow-x-auto rounded border border-[#C5D3E3]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1F3A5F] text-white">
                  <th className="p-2.5 font-bold border border-[#C5D3E3] w-1/3">Situation</th>
                  <th className="p-2.5 font-bold border border-[#C5D3E3]">Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5D3E3]">
                <tr className="bg-white">
                  <td className="p-2.5 font-semibold text-slate-800 border border-[#C5D3E3]">Missing values in a column</td>
                  <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">More than {MISSING_DROP_PCT}% missing: drop the column.</td>
                </tr>
                <tr className="bg-[#EAF1F8]/50">
                  <td className="p-2.5 font-semibold text-slate-800 border border-[#C5D3E3]">Missing numeric values</td>
                  <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">|skewness| &lt; {SKEW_LIMIT}: fill with the mean. Otherwise: fill with the median.</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-2.5 font-semibold text-slate-800 border border-[#C5D3E3]">Missing categorical values</td>
                  <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">Fill with the most frequent value (mode).</td>
                </tr>
                <tr className="bg-[#EAF1F8]/50">
                  <td className="p-2.5 font-semibold text-slate-800 border border-[#C5D3E3]">Outlier detection</td>
                  <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">|skewness| &lt; {SKEW_LIMIT}: Z-Score (|z| &gt; {Z_LIMIT}). Otherwise: IQR (outside Q1 - {IQR_FACTOR}xIQR or Q3 + {IQR_FACTOR}xIQR).</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-2.5 font-semibold text-slate-800 border border-[#C5D3E3]">Outliers</td>
                  <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">Flagged only, never removed.</td>
                </tr>
                <tr className="bg-[#EAF1F8]/50">
                  <td className="p-2.5 font-semibold text-slate-800 border border-[#C5D3E3]">Duplicates</td>
                  <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">Exact duplicate rows are removed.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Cleaning Decisions Log */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1F3A5F]">
            3. Cleaning Decisions: What Was Done and Why
          </h2>
          <div className="overflow-x-auto rounded border border-[#C5D3E3]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1F3A5F] text-white">
                  <th className="p-2.5 font-bold border border-[#C5D3E3] w-28">Step</th>
                  <th className="p-2.5 font-bold border border-[#C5D3E3] w-28">Column</th>
                  <th className="p-2.5 font-bold border border-[#C5D3E3] w-60">What was done</th>
                  <th className="p-2.5 font-bold border border-[#C5D3E3]">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5D3E3]">
                {log.decision_table.map((d, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#EAF1F8]/50' : 'bg-white'}>
                    <td className="p-2.5 font-medium text-slate-800 border border-[#C5D3E3] align-top">{d.step}</td>
                    <td className="p-2.5 font-mono text-slate-900 border border-[#C5D3E3] align-top">{d.column}</td>
                    <td className="p-2.5 text-slate-800 border border-[#C5D3E3] align-top">{d.action}</td>
                    <td className="p-2.5 text-slate-600 border border-[#C5D3E3] align-top">{d.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Outliers */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1F3A5F]">
            4. Outlier Detection Results
          </h2>
          {Object.keys(log.outliers).length > 0 ? (
            <div className="overflow-x-auto rounded border border-[#C5D3E3]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1F3A5F] text-white">
                    <th className="p-2.5 font-bold border border-[#C5D3E3]">Column</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3]">Method</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3]">Outliers</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3]">% of values</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3]">Bounds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5D3E3]">
                  {Object.entries(log.outliers).map(([col, o], idx) => (
                    <tr key={col} className={idx % 2 === 1 ? 'bg-[#EAF1F8]/50' : 'bg-white'}>
                      <td className="p-2.5 font-semibold text-slate-900 border border-[#C5D3E3]">{col}</td>
                      <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">{o.method}</td>
                      <td className="p-2.5 font-bold text-slate-800 border border-[#C5D3E3]">
                        {o.count} {o.count > 0 && <span className="text-amber-600 font-normal">flagged</span>}
                      </td>
                      <td className="p-2.5 text-slate-700 border border-[#C5D3E3]">{o.percent}%</td>
                      <td className="p-2.5 font-mono text-slate-600 border border-[#C5D3E3]">
                        {o.bounds ? `${o.bounds[0]} to ${o.bounds[1]}` : `|z| > ${Z_LIMIT}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No numeric columns were eligible for outlier detection.</p>
          )}
        </section>

        {/* 5. Descriptive Statistics */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1F3A5F]">
            5. Descriptive Statistics (after cleaning)
          </h2>
          {Object.keys(eda.summary_stats).length > 0 ? (
            <div className="overflow-x-auto rounded border border-[#C5D3E3]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1F3A5F] text-white">
                    <th className="p-2.5 font-bold border border-[#C5D3E3]">Column</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Count</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Mean</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Std</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Min</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Median</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Max</th>
                    <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Skew</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C5D3E3] font-mono">
                  {Object.entries(eda.summary_stats).map(([col, s], idx) => (
                    <tr key={col} className={idx % 2 === 1 ? 'bg-[#EAF1F8]/50' : 'bg-white'}>
                      <td className="p-2.5 font-sans font-semibold text-slate-900 border border-[#C5D3E3]">{col}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">{s.count}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">{s.mean}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">{s.std}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">{s.min}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">{s.median}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">{s.max}</td>
                      <td className="p-2.5 text-right border border-[#C5D3E3]">
                        <span className={Math.abs(s.skewness) >= SKEW_LIMIT ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                          {s.skewness}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">The dataset has no numeric columns.</p>
          )}
        </section>

        {/* 6. Correlations */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1F3A5F]">
            6. Strongest Correlations
          </h2>
          {eda.top_correlations.length > 0 ? (
            <div className="space-y-2">
              <div className="overflow-x-auto rounded border border-[#C5D3E3]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1F3A5F] text-white">
                      <th className="p-2.5 font-bold border border-[#C5D3E3]">Column A</th>
                      <th className="p-2.5 font-bold border border-[#C5D3E3]">Column B</th>
                      <th className="p-2.5 font-bold border border-[#C5D3E3] text-right">Correlation (r)</th>
                      <th className="p-2.5 font-bold border border-[#C5D3E3]">Strength</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C5D3E3]">
                    {eda.top_correlations.map((pair, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-[#EAF1F8]/50' : 'bg-white'}>
                        <td className="p-2.5 font-semibold text-slate-900 border border-[#C5D3E3]">{pair.col1}</td>
                        <td className="p-2.5 font-semibold text-slate-900 border border-[#C5D3E3]">{pair.col2}</td>
                        <td className="p-2.5 font-mono text-right font-bold text-slate-800 border border-[#C5D3E3]">{pair.corr}</td>
                        <td className="p-2.5 text-slate-700 capitalize border border-[#C5D3E3]">{pair.strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Correlation shows that two columns move together; it does not prove that one causes the other.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Not enough numeric columns to compute correlations.</p>
          )}
        </section>

        {/* 7. Charts section embedded in report */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-bold text-[#1F3A5F]">
            7. Statistical Charts
          </h2>
          <ChartsView eda={eda} rows={cleanedRows} embedded />
        </section>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
          <span>Automated EDA Report • Generated by AI Studio React Pipeline</span>
          <span>End of Report</span>
        </div>
      </div>
    </div>
  );
};
