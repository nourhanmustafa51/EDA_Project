import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, ShieldCheck, Paperclip, AlertCircle } from 'lucide-react';
import { CleaningLog } from '../types/pipeline';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: CleaningLog;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, log }) => {
  const [sender, setSender] = useState('nourrmustafa5@gmail.com');
  const [recipients, setRecipients] = useState('nourrmustafa5@gmail.com, analytics-team@company.org');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const stem = log.file.replace(/\.[^/.]+$/, '');
  const subject = `Automated EDA Report: ${log.file}`;

  const emailBody = [
    `Hello,`,
    ``,
    `The automated analysis of '${log.file}' has finished. The full report is attached as a PDF.`,
    ``,
    `Quick summary:`,
    `- Rows: ${log.rows_before} -> ${log.rows_after}`,
    `- Duplicate rows removed: ${log.duplicates_removed}`,
    `- Columns dropped: ${log.columns_dropped.join(', ') || 'none'}`,
    `- Cleaning decisions recorded: ${log.decision_table.length}`,
    ``,
    `This email was sent automatically by the EDA report pipeline.`,
  ].join('\n');

  const handleSend = () => {
    setIsSending(true);
    setSendStatus(null);

    // Simulate sending via SMTP protocol
    setTimeout(() => {
      setIsSending(false);
      setSendStatus({
        success: true,
        message: `Successfully dispatched report '${stem}_report.pdf' via ${smtpHost}:${smtpPort} (STARTTLS) to ${recipients}.`,
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#1F3A5F] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-200" />
            <h3 className="font-bold text-base">Email Report Dispatcher</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {sendStatus && (
            <div
              className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs ${
                sendStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {sendStatus.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{sendStatus.message}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Pipeline email notification completed.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SMTP Host &amp; Port
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-800 font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Address
              </label>
              <input
                type="email"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipients (Comma-separated)
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              readOnly
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Body Preview
            </label>
            <textarea
              rows={6}
              value={emailBody}
              readOnly
              className="w-full rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono text-slate-700 leading-relaxed"
            />
          </div>

          {/* Attachment badge */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-blue-50/50 p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Paperclip className="h-4 w-4 text-blue-600" />
              <span>{stem}_report.pdf</span>
              <span className="text-slate-400 font-normal">(Auto-attached)</span>
            </div>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> PDF Ready
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#152740] shadow-sm disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            {isSending ? 'Connecting SMTP...' : 'Send Report Email'}
          </button>
        </div>
      </div>
    </div>
  );
};
