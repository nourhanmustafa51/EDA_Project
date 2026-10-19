import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SAMPLE_DATASETS, SampleDatasetInfo } from '../utils/sampleData';

interface DatasetUploadProps {
  onLoadDataset: (data: Record<string, any>[], filename: string) => void;
  currentFilename?: string;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({ onLoadDataset, currentFilename }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (file: File) => {
    setErrorMessage(null);
    setIsParsing(true);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsParsing(false);
          if (results.data && results.data.length > 0) {
            onLoadDataset(results.data as Record<string, any>[], file.name);
          } else {
            setErrorMessage('CSV file appears to be empty.');
          }
        },
        error: (err) => {
          setIsParsing(false);
          setErrorMessage(`Failed to parse CSV: ${err.message}`);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          setIsParsing(false);
          if (json.length > 0) {
            onLoadDataset(json as Record<string, any>[], file.name);
          } else {
            setErrorMessage('Excel sheet appears to be empty.');
          }
        } catch (err: any) {
          setIsParsing(false);
          setErrorMessage(`Failed to read Excel file: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setIsParsing(false);
      setErrorMessage('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-white shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files[0])}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-800">
          Click to upload or drag and drop dataset file
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports CSV (.csv) or Microsoft Excel (.xlsx, .xls)
        </p>
        {isParsing && (
          <p className="text-xs text-blue-600 font-medium mt-2 animate-pulse">
            Parsing dataset structure...
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Sample Datasets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Or load a benchmark test dataset
          </h3>
          <span className="text-xs text-slate-400">Pre-configured with duplicates &amp; missing values</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_DATASETS.map((sample: SampleDatasetInfo) => {
            const isSelected = currentFilename === sample.filename;
            return (
              <div
                key={sample.filename}
                onClick={() => onLoadDataset(sample.data, sample.filename)}
                className={`relative flex flex-col justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      {sample.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="font-mono text-slate-600 font-medium">
                    {sample.data.length} rows • {sample.filename}
                  </span>
                  <span className="inline-flex items-center text-blue-600 font-semibold group hover:underline">
                    Load <ArrowRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
