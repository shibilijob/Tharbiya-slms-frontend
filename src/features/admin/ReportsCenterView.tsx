import React from 'react';
import { Card } from '../../components/common/Card';
import { FileSpreadsheet, Sparkles } from 'lucide-react';

export const ReportsCenterView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Result
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Student examinations, evaluations & published results
          </p>
        </div>
      </div>

      {/* Centered Coming Soon Card */}
      <Card className="py-20 px-6 sm:px-12 bg-white border border-[#E3EAE6] shadow-sm text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-16 h-16 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <Sparkles className="w-8 h-8 text-[#0F6B50]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1F2933] tracking-tight">
          More Features Coming Soon
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-2 max-w-md mx-auto leading-relaxed">
          The Result publication module is currently under active development. Complete examination results, student marksheets, and grading reports will be accessible here soon.
        </p>
      </Card>
    </div>
  );
};

export const ResultView = ReportsCenterView;
