import React, { useState } from 'react';
import { EDAResult } from '../types/pipeline';
import { calculateQuantile } from '../utils/cleaner';
import { MAX_COLS_PLOT } from '../utils/eda';
import { BarChart3, Box, Flame } from 'lucide-react';

interface ChartsViewProps {
  eda: EDAResult;
  rows: Record<string, any>[];
  embedded?: boolean;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ eda, rows, embedded = false }) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'hist' | 'box' | 'heatmap'>('all');

  // Filter numeric columns with > 2 unique values, limit to MAX_COLS_PLOT (6)
  const plotCols = eda.numericColumns
    .filter(col => {
      const vals = rows.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v));
      return new Set(vals).size > 2;
    })
    .slice(0, MAX_COLS_PLOT);

  // Helper for coolwarm heatmap color interpolation
  const getCoolWarmColor = (val: number): string => {
    // val ranges -1.0 to 1.0
    const clamped = Math.max(-1, Math.min(1, val));
    if (clamped < 0) {
      // Blue scale from #3B4CC0 (-1) to white (#F8FAFC)
      const ratio = Math.abs(clamped);
      const r = Math.round(248 - ratio * (248 - 59));
      const g = Math.round(250 - ratio * (250 - 76));
      const b = Math.round(252 - ratio * (252 - 192));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Red scale from white (#F8FAFC) to #B40426 (+1)
      const ratio = clamped;
      const r = Math.round(248 - ratio * (248 - 180));
      const g = Math.round(250 - ratio * (250 - 4));
      const b = Math.round(252 - ratio * (252 - 38));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  if (plotCols.length === 0 && eda.numericColumns.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
        No numeric columns available for statistical charts.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chart Views:</span>
            <div className="flex rounded-md bg-slate-100 p-0.5 text-xs">
              {[
                { id: 'all', label: 'All Charts' },
                { id: 'hist', label: 'Distributions (Histograms)' },
                { id: 'box', label: 'Outlier Boxplots' },
                { id: 'heatmap', label: 'Correlation Heatmap' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id as any)}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    activeSubTab === t.id
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Rendering {plotCols.length} non-binary numeric attributes
          </span>
        </div>
      )}

      {/* 1. Histograms */}
      {(activeSubTab === 'all' || activeSubTab === 'hist') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#2E6F9E]" />
            <h3 className="text-sm font-bold text-slate-800">
              Distributions (Histograms &amp; KDE Approximation)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Shape of each numeric feature. Dotted red line is Mean, dashed navy line is Median.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plotCols.map(col => {
              const vals = rows.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v)) as number[];
              if (vals.length === 0) return null;

              const stats = eda.summary_stats[col];
              const min = stats?.min ?? Math.min(...vals);
              const max = stats?.max ?? Math.max(...vals);
              const mean = stats?.mean ?? 0;
              const median = stats?.median ?? 0;

              // Compute 10 bins
              const binCount = 10;
              const range = max - min || 1;
              const binWidth = range / binCount;
              const bins = new Array(binCount).fill(0);

              vals.forEach(v => {
                const idx = Math.min(binCount - 1, Math.floor((v - min) / binWidth));
                bins[idx]++;
              });

              const maxBinCount = Math.max(...bins, 1);
              const chartHeight = 120;
              const chartWidth = 320;
              const barW = (chartWidth - 40) / binCount;

              // Generate KDE curve points
              const kdePoints = bins.map((b, i) => {
                const x = 30 + i * barW + barW / 2;
                const y = chartHeight - 20 - (b / maxBinCount) * (chartHeight - 35);
                return `${x},${y}`;
              }).join(' ');

              // Marker positions
              const meanX = 30 + Math.max(0, Math.min(1, (mean - min) / range)) * (chartWidth - 40);
              const medianX = 30 + Math.max(0, Math.min(1, (median - min) / range)) * (chartWidth - 40);

              return (
                <div key={col} className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-900">{col}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Mean: {mean} | Med: {median} | Skew: {stats?.skewness}
                    </span>
                  </div>

                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36 overflow-visible">
                    {/* Grid lines */}
                    <line x1="30" y1="10" x2={chartWidth - 10} y2="10" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="30" y1="55" x2={chartWidth - 10} y2="55" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="30" y1={chartHeight - 20} x2={chartWidth - 10} y2={chartHeight - 20} stroke="#CBD5E1" strokeWidth="1.5" />

                    {/* Bars */}
                    {bins.map((count, i) => {
                      const h = (count / maxBinCount) * (chartHeight - 35);
                      const x = 30 + i * barW + 1;
                      const y = chartHeight - 20 - h;
                      return (
                        <g key={i}>
                          <rect
                            x={x}
                            y={y}
                            width={Math.max(1, barW - 2)}
                            height={h}
                            fill="#2E6F9E"
                            rx="1.5"
                            className="transition-all hover:fill-[#1b4e74]"
                          >
                            <title>{`Bin ${i + 1}: ${count} rows`}</title>
                          </rect>
                        </g>
                      );
                    })}

                    {/* Smooth KDE-style trendline */}
                    <polyline
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="2"
                      points={kdePoints}
                      strokeLinecap="round"
                    />

                    {/* Mean line */}
                    <line
                      x1={meanX}
                      y1="8"
                      x2={meanX}
                      y2={chartHeight - 20}
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />

                    {/* Median line */}
                    <line
                      x1={medianX}
                      y1="8"
                      x2={medianX}
                      y2={chartHeight - 20}
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />

                    {/* Min and Max labels */}
                    <text x="30" y={chartHeight - 6} fontSize="9" fill="#64748B" textAnchor="start">
                      {min}
                    </text>
                    <text x={chartWidth - 10} y={chartHeight - 6} fontSize="9" fill="#64748B" textAnchor="end">
                      {max}
                    </text>
                  </svg>

                  <div className="flex items-center justify-center gap-4 mt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-red-500 inline-block"></span> Mean
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span> Median
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#2E6F9E] inline-block rounded-xs"></span> Freq Count
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Boxplots */}
      {(activeSubTab === 'all' || activeSubTab === 'box') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-[#1F3A5F]" />
            <h3 className="text-sm font-bold text-slate-800">
              Boxplots &amp; Whisker Analysis (Outlier Detection)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Box shows Q1, Median, and Q3. Whiskers extend 1.5x IQR. Red dots indicate potential outliers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plotCols.map(col => {
              const vals = rows.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v)) as number[];
              if (vals.length === 0) return null;

              const sorted = [...vals].sort((a, b) => a - b);
              const min = sorted[0];
              const max = sorted[sorted.length - 1];
              const q1 = calculateQuantile(sorted, 0.25);
              const median = calculateQuantile(sorted, 0.5);
              const q3 = calculateQuantile(sorted, 0.75);
              const iqr = q3 - q1;
              const lowerFence = Math.max(min, q1 - 1.5 * iqr);
              const upperFence = Math.min(max, q3 + 1.5 * iqr);

              const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

              const w = 320;
              const h = 75;
              const range = max - min || 1;

              const scaleX = (val: number) => 30 + Math.max(0, Math.min(1, (val - min) / range)) * (w - 60);

              const boxLeft = scaleX(q1);
              const boxRight = scaleX(q3);
              const medianX = scaleX(median);
              const whiskerMinX = scaleX(lowerFence);
              const whiskerMaxX = scaleX(upperFence);

              return (
                <div key={col} className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900">{col}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      IQR: {Number(iqr.toFixed(1))} | Outliers: {outliers.length}
                    </span>
                  </div>

                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20 overflow-visible">
                    {/* Center whisker line */}
                    <line
                      x1={whiskerMinX}
                      y1={h / 2}
                      x2={whiskerMaxX}
                      y2={h / 2}
                      stroke="#1F3A5F"
                      strokeWidth="1.5"
                    />

                    {/* Whisker caps */}
                    <line x1={whiskerMinX} y1={h / 2 - 10} x2={whiskerMinX} y2={h / 2 + 10} stroke="#1F3A5F" strokeWidth="1.5" />
                    <line x1={whiskerMaxX} y1={h / 2 - 10} x2={whiskerMaxX} y2={h / 2 + 10} stroke="#1F3A5F" strokeWidth="1.5" />

                    {/* Box IQR */}
                    <rect
                      x={boxLeft}
                      y={h / 2 - 14}
                      width={Math.max(2, boxRight - boxLeft)}
                      height={28}
                      fill="#9ECAE1"
                      stroke="#1F3A5F"
                      strokeWidth="1.5"
                      rx="1"
                    />

                    {/* Median Line */}
                    <line
                      x1={medianX}
                      y1={h / 2 - 14}
                      x2={medianX}
                      y2={h / 2 + 14}
                      stroke="#1F3A5F"
                      strokeWidth="2.5"
                    />

                    {/* Outlier dots */}
                    {outliers.map((o, idx) => (
                      <circle
                        key={idx}
                        cx={scaleX(o)}
                        cy={h / 2}
                        r="3.5"
                        fill="#EF4444"
                        stroke="#991B1B"
                        strokeWidth="1"
                      >
                        <title>{`Outlier value: ${o}`}</title>
                      </circle>
                    ))}

                    {/* Value indicators */}
                    <text x="30" y={h - 4} fontSize="8" fill="#64748B" textAnchor="start">{min}</text>
                    <text x={w - 30} y={h - 4} fontSize="8" fill="#64748B" textAnchor="end">{max}</text>
                  </svg>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>Q1: {Number(q1.toFixed(1))}</span>
                    <span>Median: {Number(median.toFixed(1))}</span>
                    <span>Q3: {Number(q3.toFixed(1))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Correlation Heatmap */}
      {(activeSubTab === 'all' || activeSubTab === 'heatmap') && eda.correlations.columns.length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Pearson Correlation Matrix Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Diverging Coolwarm palette: Deep Blue (-1.0) &rarr; White (0.0) &rarr; Deep Red (+1.0).
          </p>

          <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 overflow-x-auto">
            <table className="border-collapse mx-auto text-xs">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-200 bg-white"></th>
                  {eda.correlations.columns.map(col => (
                    <th key={col} className="p-2 font-bold text-slate-700 border border-slate-200 bg-white max-w-[90px] truncate" title={col}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eda.correlations.columns.map((rowCol, i) => (
                  <tr key={rowCol}>
                    <th className="p-2 font-bold text-slate-700 border border-slate-200 bg-white text-left max-w-[100px] truncate" title={rowCol}>
                      {rowCol}
                    </th>
                    {eda.correlations.columns.map((colCol, j) => {
                      const val = eda.correlations.matrix[i]?.[j] ?? 0;
                      const bgColor = getCoolWarmColor(val);
                      const isHighContrast = Math.abs(val) > 0.45;
                      const textColor = isHighContrast ? 'text-white font-bold' : 'text-slate-800';

                      return (
                        <td
                          key={colCol}
                          style={{ backgroundColor: bgColor }}
                          className={`p-2.5 text-center font-mono border border-slate-200 transition-transform hover:scale-105 cursor-pointer ${textColor}`}
                          title={`${rowCol} vs ${colCol}: ${val}`}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Heatmap Legend */}
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500 font-mono">
              <span>-1.0 (Negative)</span>
              <div className="h-3 w-48 rounded bg-gradient-to-r from-[#3B4CC0] via-[#F8FAFC] to-[#B40426] border border-slate-300"></div>
              <span>+1.0 (Positive)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
