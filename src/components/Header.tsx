import React from 'react';
import { Database, FileDown, Mail, Printer, RefreshCw, Upload } from 'lucide-react';
import { PipelineResult } from '../types/pipeline';

interface HeaderProps {
  result: PipelineResult | null;
  onRunPipeline: () => void;
  onExportPDF: () => void;
  onDownloadCSV: () => void;
  onDownloadJSON: () => void;
  onOpenEmail: () => void;
  onOpenUpload: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  result,
  onRunPipeline,
  onExportPDF,
  onDownloadCSV,
  onDownloadJSON,
  onOpenEmail,
  onOpenUpload,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-slate-200 bg-[#1F3A5F] text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/30 text-blue-200 ring-1 ring-white/20">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Automated EDA &amp; Cleaning Pipeline
                </h1>
                <span className="rounded bg-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-200 ring-1 ring-blue-400/40">
                  v2.0 React
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Colored Upload Button at the top */}
            <button
              onClick={onOpenUpload}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold shadow-md transition-all ${
                activeTab === 'upload'
                  ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white ring-1 ring-emerald-300/40'
              }`}
              title="Upload a new dataset (CSV or Excel)"
            >
              <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
              Upload Dataset
            </button>

            {result && (
              <>
                <button
                  onClick={onRunPipeline}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-white/20 transition-colors"
                  title="Re-run pipeline from scratch"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-run
                </button>

                <button
                  onClick={onDownloadCSV}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
                  title="Download cleaned CSV dataset"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Cleaned CSV
                </button>

                <button
                  onClick={onDownloadJSON}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-white/20 transition-colors"
                  title="Download decision log JSON"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Log JSON
                </button>

                <button
                  onClick={onExportPDF}
                  className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 transition-colors"
                  title="Download or print publication report"
                >
                  <Printer className="h-3.5 w-3.5" />
                  PDF Report
                </button>

                <button
                  onClick={onOpenEmail}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-amber-400 transition-colors"
                  title="Dispatch or preview email report"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation (Shown when data is loaded) */}
        {result && (
          <div className="mt-4 flex space-x-1 border-t border-white/10 pt-3 overflow-x-auto text-sm">
            {[
              { id: 'report', label: '1. Executive Report (PDF View)' },
              { id: 'charts', label: '2. Statistical Charts' },
              { id: 'data', label: '3. Data Table (Raw vs Clean)' },
              { id: 'decisions', label: '4. Decision Log & Audit Trail' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1F3A5F] shadow'
                    : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
