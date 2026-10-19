import React from 'react';
import { CheckCircle2, ChevronRight, FileSearch, Sparkles, Table2, ShieldCheck, MailCheck } from 'lucide-react';
import { CleaningLog } from '../types/pipeline';

interface PipelineStepsProps {
  log: CleaningLog | null;
  onSelectStepTab: (tabId: string) => void;
}

export const PipelineSteps: React.FC<PipelineStepsProps> = ({ log, onSelectStepTab }) => {
  if (!log) return null;

  const steps = [
    {
      name: '1. Ingestion',
      desc: `${log.rows_before} rows loaded`,
      icon: Table2,
      tab: 'data',
      status: 'complete',
    },
    {
      name: '2. Cleaning Log',
      desc: `${log.duplicates_removed} dupes, ${Object.keys(log.missing_filled).length} cols imputed`,
      icon: ShieldCheck,
      tab: 'decisions',
      status: 'complete',
    },
    {
      name: '3. EDA Statistics',
      desc: `${log.columns_after} cols analyzed`,
      icon: FileSearch,
      tab: 'charts',
      status: 'complete',
    },
    {
      name: '4. Executive Report',
      desc: '7 sections compiled',
      icon: Sparkles,
      tab: 'report',
      status: 'complete',
    },
    {
      name: '5. Ready to Export',
      desc: 'CSV / PDF / Email',
      icon: MailCheck,
      tab: 'report',
      status: 'complete',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.name}
                onClick={() => onSelectStepTab(step.tab)}
                className="group flex flex-col p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                    {step.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
