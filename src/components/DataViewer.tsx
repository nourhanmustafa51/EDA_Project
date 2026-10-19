import React, { useState } from 'react';
import { Search, Filter, Download, ArrowUpDown, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PipelineResult } from '../types/pipeline';

interface DataViewerProps {
  result: PipelineResult;
  onDownloadCSV: () => void;
}

export const DataViewer: React.FC<DataViewerProps> = ({ result, onDownloadCSV }) => {
  const [viewMode, setViewMode] = useState<'cleaned' | 'raw'>('cleaned');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { cleanedRows, rawRows, cleanedColumns, rawColumns, log } = result;

  const currentDataset = viewMode === 'cleaned' ? cleanedRows : rawRows;
  const currentColumns = viewMode === 'cleaned' ? cleanedColumns : rawColumns;

  // Filter rows by search term
  const filteredRows = currentDataset.filter(row => {
    if (!search.trim()) return true;
    return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View mode toggle */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => {
                setViewMode('cleaned');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                viewMode === 'cleaned'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cleaned Data ({cleanedRows.length} rows)
            </button>
            <button
              onClick={() => {
                setViewMode('raw');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                viewMode === 'raw'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Input ({rawRows.length} rows)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search table values..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={onDownloadCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
          Columns: {currentColumns.length}
        </span>
        {viewMode === 'cleaned' ? (
          <>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Duplicates Removed: {log.duplicates_removed}
            </span>
            {log.columns_dropped.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Dropped Columns: {log.columns_dropped.join(', ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
              Imputed Columns: {Object.keys(log.missing_filled).length}
            </span>
          </>
        ) : (
          <span className="text-slate-500">
            Raw dataset before deduplication, imputation, and outlier detection.
          </span>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#1F3A5F] text-white z-10 shadow-sm">
              <tr>
                <th className="p-2.5 font-bold border-r border-[#2C4E7D] w-12 text-center">#</th>
                {currentColumns.map(col => (
                  <th key={col} className="p-2.5 font-bold border-r border-[#2C4E7D] whitespace-nowrap">
                    {col}
                    {log.outliers[col] && log.outliers[col].count > 0 && (
                      <span className="ml-1 text-[10px] text-amber-300 font-normal">
                        ({log.outliers[col].count} outl)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-2.5 text-center text-slate-400 bg-slate-50/50 border-r border-slate-200">
                        {globalIdx}
                      </td>
                      {currentColumns.map(col => {
                        const val = row[col];
                        const isNull = val === null || val === undefined || val === '';
                        return (
                          <td
                            key={col}
                            className={`p-2.5 border-r border-slate-100 whitespace-nowrap ${
                              isNull ? 'bg-amber-50 text-amber-600 font-semibold italic' : 'text-slate-800'
                            }`}
                          >
                            {isNull ? 'null (missing)' : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={currentColumns.length + 1} className="p-8 text-center text-slate-400 italic">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500 bg-slate-50">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
