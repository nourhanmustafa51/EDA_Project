import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Header } from './components/Header';
import { PipelineSteps } from './components/PipelineSteps';
import { DatasetUpload } from './components/DatasetUpload';
import { ReportView } from './components/ReportView';
import { ChartsView } from './components/ChartsView';
import { DataViewer } from './components/DataViewer';
import { AuditLogView } from './components/AuditLogView';
import { EmailModal } from './components/EmailModal';
import { PipelineResult } from './types/pipeline';
import { cleanData } from './utils/cleaner';
import { runEDA } from './utils/eda';
import { SAMPLE_DATASETS } from './utils/sampleData';

export function App() {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('report');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize pipeline with default Titanic dataset
  const processDataset = (data: Record<string, any>[], filename: string) => {
    setIsProcessing(true);
    try {
      const rawRows = data;
      const rawColumns = data.length > 0 ? Object.keys(data[0]) : [];

      // 1. Clean data using statistical rules
      const { cleanedRows, log } = cleanData(rawRows, filename);
      const cleanedColumns = cleanedRows.length > 0 ? Object.keys(cleanedRows[0]) : [];

      // 2. Run EDA statistics and correlations
      const eda = runEDA(cleanedRows);

      setResult({
        fileName: filename,
        rawRows,
        cleanedRows,
        rawColumns,
        cleanedColumns,
        log,
        eda,
      });
    } catch (err) {
      console.error('Error running pipeline:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Load default Titanic dataset on first mount
    const defaultDataset = SAMPLE_DATASETS[0];
    processDataset(defaultDataset.data, defaultDataset.filename);
  }, []);

  const handleDownloadCSV = () => {
    if (!result) return;
    const csv = Papa.unparse(result.cleanedRows);
    const stem = result.fileName.replace(/\.[^/.]+$/, '');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stem}_cleaned.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const stem = result.fileName.replace(/\.[^/.]+$/, '');
    const jsonStr = JSON.stringify(result.log, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stem}_log.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      <div className="no-print">
        <Header
          result={result}
          onRunPipeline={() => result && processDataset(result.rawRows, result.fileName)}
          onExportPDF={handlePrintPDF}
          onDownloadCSV={handleDownloadCSV}
          onDownloadJSON={handleDownloadJSON}
          onOpenEmail={() => setIsEmailModalOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="no-print">
          {result && (
            <PipelineSteps
              log={result.log}
              onSelectStepTab={(tabId) => setActiveTab(tabId)}
            />
          )}
        </div>

        {isProcessing ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1F3A5F] border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Running cleaning rules, inferring datatypes, calculating skewness &amp; correlations...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'upload' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <DatasetUpload
                  onLoadDataset={(data, filename) => {
                    processDataset(data, filename);
                    setActiveTab('report');
                  }}
                  currentFilename={result?.fileName}
                />
              </div>
            )}

            {result && activeTab === 'report' && (
              <ReportView result={result} onPrint={handlePrintPDF} />
            )}

            {result && activeTab === 'charts' && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <ChartsView eda={result.eda} rows={result.cleanedRows} />
              </div>
            )}

            {result && activeTab === 'data' && (
              <DataViewer result={result} onDownloadCSV={handleDownloadCSV} />
            )}

            {result && activeTab === 'decisions' && (
              <AuditLogView log={result.log} onDownloadJSON={handleDownloadJSON} />
            )}
          </>
        )}
      </main>

      {result && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          log={result.log}
        />
      )}
    </div>
  );
}

export default App;
