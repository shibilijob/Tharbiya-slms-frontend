import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useClassStore } from '../../stores';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Logo } from '../../components/common/Logo';
import { useNotifications } from '../../context/NotificationContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  CheckCircle2
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const ReportsCenterView: React.FC = () => {
  const { students, getStudentSummary } = useData();
  const { user } = useAuth();
  const classesList = useClassStore((s) => s.classes);
  const fetchClasses = useClassStore((s) => s.fetchClasses);
  const { showToast } = useNotifications();

  const [reportType, setReportType] = useState('STUDENT_PROGRESS');
  const [selectedClass, setSelectedClass] = useState('');
  const [dateRange, setDateRange] = useState('Half Yearly (2026)');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (!selectedClass && classesList.length > 0) {
      setSelectedClass(classesList[0].name.replace(/^Class\s*/i, '').trim());
    }
  }, [classesList, selectedClass]);

  const selectedClassStudents = students.filter(s => s.class === selectedClass);

  const handleDownload = () => {
    showToast(`âœ“ Generating and downloading ${reportType.replace('_', ' ')} for Class ${selectedClass}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Madrasa Reports Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Generate and export official Progress Report Cards, Attendance Registers, and Quran Milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Preview
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download Report (PDF)
          </Button>
        </div>
      </div>

      {/* Filters & Report Selector */}
      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Report Category"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="STUDENT_PROGRESS">1. Student Progress Report Card</option>
            <option value="ATTENDANCE">2. Monthly Attendance Register</option>
            <option value="ACADEMIC">3. Academic Assessment Marksheet</option>
            <option value="QURAN">4. Quran & Hifz Milestone Report</option>
            <option value="CLASS_PERFORMANCE">5. Class Performance Summary</option>
          </Select>

          <Select
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classesList.map((cls) => {
              const classValue = cls.name.replace(/^Class\s*/i, '').trim();
              return (
                <option key={cls.id} value={classValue}>
                  {cls.name}
                </option>
              );
            })}
          </Select>

          <Select
            label="Exam Term"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="Half Yearly (2026)">Half Yearly Examination 2026 (à´…àµ¼à´¦àµà´§à´µà´¾àµ¼à´·à´¿à´•à´‚)</option>
            <option value="Annual (2026)">Annual Examination 2026 (à´µà´¾àµ¼à´·à´¿à´•à´‚)</option>
          </Select>
        </div>
      </Card>

      {/* Report Table Preview */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E3EAE6]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B50]">
              Darunnajath Mundambra â€¢ Official Marksheet
            </span>
            <h3 className="text-lg font-extrabold text-[#1F2933]">
              Class {selectedClass} Summary â€” {dateRange}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="green">{selectedClassStudents.length} Students Listed</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F2] border-b border-[#E3EAE6] text-[#667085] font-extrabold uppercase text-[10px]">
                <th className="py-3 px-3">Adm No</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Quran Marks (100)</th>
                <th className="py-3 px-3">Academic Marks (100)</th>
                <th className="py-3 px-3">Practical Marks (100)</th>
                <th className="py-3 px-3">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE6]">
              {selectedClassStudents.map(st => {
                const summ = getStudentSummary(st.id);
                return (
                  <tr key={st.id} className="hover:bg-[#FAF8F2]">
                    <td className="py-3 px-3 font-mono font-bold text-[#667085]">{st.admissionNo}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[#1F2933]">{st.name}</p>
                      <p className="font-malayalam text-[10px] text-[#0F6B50]">{st.malayalamName}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-black text-sm text-[#1F2933]">{summ?.quranProgress ?? 'â€”'}</span>
                      <span className="text-[10px] text-[#667085] font-semibold"> / 100</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-black text-sm text-[#1F2933]">{summ?.studiesProgress ?? 'â€”'}</span>
                      <span className="text-[10px] text-[#667085] font-semibold"> / 100</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-black text-sm text-[#9A7B1C]">{summ?.akhlaqScore ?? 'â€”'}</span>
                      <span className="text-[10px] text-[#667085] font-semibold"> / 100</span>
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-700">{summ?.attendancePercentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Print Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Official Report Preview"
        subtitle="Darunnajath Mundambra Certificate & Marksheet"
        maxWidth="2xl"
      >
        <div className="space-y-4 p-4 bg-white border border-[#E3EAE6] rounded-2xl">
          <div className="text-center pb-4 border-b border-[#0F6B50] flex flex-col items-center">
            <Logo size="lg" className="mb-2" />
            <h2 className="text-xl font-black text-[#0F6B50]">DARUNNAJATH MADRASA</h2>
            <p className="text-xs text-[#667085]">Mundambra, Malappuram, Kerala - 676509</p>
            <p className="text-sm font-bold text-[#1F2933] mt-2">
              STUDENT PROGRESS REPORT CARD â€¢ CLASS {selectedClass || '—'}
            </p>
            <p className="text-xs text-[#0F6B50] font-semibold">{dateRange}</p>
          </div>

          <div className="text-xs space-y-1">
            <p><strong>Total Students Evaluated:</strong> {selectedClassStudents.length}</p>
            <p><strong>Sadhr Mudarris:</strong> {user?.name || 'Sadhr Muallim'}</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button size="sm" variant="primary" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
              Print Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


