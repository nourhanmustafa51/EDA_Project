import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { CleaningLog } from '../types/pipeline';

interface AuditLogViewProps {
  log: CleaningLog;
  onDownloadJSON: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ log, onDownloadJSON }) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'json' | 'loglines'>('table');

  const jsonString = JSON.stringify(log, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rows Before &rarr; After</span>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {log.rows_before} &rarr; {log.rows_after}
          </p>
          <span className="text-[11px] text-slate-500">
            {log.duplicates_removed} duplicate rows removed
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Columns Kept</span>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {log.columns_after} / {log.columns_before}
          </p>
          <span className="text-[11px] text-rose-600 font-medium">
            {log.columns_dropped.length > 0 ? `Dropped: ${log.columns_dropped.join(', ')}` : 'None dropped'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Imputed Columns</span>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {Object.keys(log.missing_filled).length}
          </p>
          <span className="text-[11px] text-blue-600 font-medium">
            {Object.values(log.missing_filled).reduce((a, b) => a + b, 0)} missing values filled
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Audit Decisions</span>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {log.decision_table.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Fully deterministic
          </span>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
          <button
            onClick={() => setActiveView('table')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'table' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Decision Table ({log.decision_table.length})
          </button>
          <button
            onClick={() => setActiveView('loglines')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'loglines' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Formatted Log Stream
          </button>
          <button
            onClick={() => setActiveView('json')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'json' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON Raw Export ({log.file.replace(/\.[^/.]+$/, '')}_log.json)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>

          <button
            onClick={onDownloadJSON}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Download Log
          </button>
        </div>
      </div>

      {/* Table view */}
      {activeView === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1F3A5F] text-white">
                <tr>
                  <th className="p-3 font-bold w-32 border-r border-[#2C4E7D]">Pipeline Step</th>
                  <th className="p-3 font-bold w-36 border-r border-[#2C4E7D]">Target Column</th>
                  <th className="p-3 font-bold w-72 border-r border-[#2C4E7D]">Action Taken</th>
                  <th className="p-3 font-bold">Statistical Rationale / Decision Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {log.decision_table.map((d, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="p-3 font-medium text-slate-900 border-r border-slate-100 align-top">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold">
                        {d.step}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-900 border-r border-slate-100 align-top">
                      {d.column}
                    </td>
                    <td className="p-3 font-medium text-slate-800 border-r border-slate-100 align-top">
                      {d.action}
                    </td>
                    <td className="p-3 text-slate-600 align-top text-xs leading-relaxed">
                      {d.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formatted Log stream view */}
      {activeView === 'loglines' && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
          <div className="text-slate-400 pb-2 border-b border-slate-800">
            # Decision Log Stream generated by cleaner.py pipeline
          </div>
          {log.decisions.map((line, idx) => (
            <div key={idx} className="hover:bg-slate-800/80 p-1 rounded">
              <span className="text-blue-400 font-bold mr-2">[{idx + 1}]</span>
              <span className="text-slate-200">{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* JSON View */}
      {activeView === 'json' && (
        <div className="relative bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-[500px]">
          <pre>{jsonString}</pre>
        </div>
      )}
    </div>
  );
};
