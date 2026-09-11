import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Student } from '../../types';
import {
  Users,
  Search,
  Eye,
  GraduationCap,
  Sparkles,
  Phone,
  User,
  Calendar,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { useClassStore } from '../../stores';

export const StudentRosterView: React.FC = () => {
  const { students, getStudentSummary } = useData();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  const teacherAssignedClasses = useClassStore((s) => s.teacherAssignedClasses);
  const fetchAssignedClassesForTeacher = useClassStore((s) => s.fetchAssignedClassesForTeacher);

  React.useEffect(() => {
    if (user) {
      fetchAssignedClassesForTeacher(user);
    }
  }, [user, fetchAssignedClassesForTeacher]);

  // Dynamic assigned classes for this Muallim
  const teacherUser = user as any;
  const teacherClasses = React.useMemo(() => {
    if (teacherAssignedClasses.length > 0) return teacherAssignedClasses;

    let rawList: any[] = [];
    if (Array.isArray(teacherUser?.assignedClasses)) {
      rawList = teacherUser.assignedClasses;
    } else if (typeof teacherUser?.assignedClasses === 'string') {
      try {
        const parsed = JSON.parse(teacherUser.assignedClasses);
        rawList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rawList = [teacherUser.assignedClasses];
      }
    } else if (teacherUser?.assignedClass) {
      rawList = Array.isArray(teacherUser.assignedClass) ? teacherUser.assignedClass : [teacherUser.assignedClass];
    }

    const cleaned = rawList
      .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
      .filter(Boolean);

    if (cleaned.length > 0) return cleaned;

    const fromStudents = students
      .filter(s => s.assignedTeacherId === user?.id || (user?.name && s.teacherName === user.name))
      .map(s => String(s.class).replace(/^Class\s*/i, '').trim());
    const unique = Array.from(new Set(fromStudents)).filter(Boolean);
    return unique.length > 0 ? unique : ['4'];
  }, [teacherAssignedClasses, teacherUser, students, user]);

  // Filter students assigned to teacher's assigned classes
  const teacherStudents = students.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    return teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id);
  });

  const filteredStudents = teacherStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.malayalamName && s.malayalamName.includes(searchQuery));
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    const fClass = selectedClass.replace(/^Class\s*/i, '').trim();
    const matchesClass = selectedClass === 'ALL' || sClass === fClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Student Roster & Profiles
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Displaying students enrolled in your assigned classes ({teacherClasses.map(c => `Class ${c}`).join(' & ')})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="green" size="lg">
            {filteredStudents.length} Students Active
          </Badge>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by student name, admission no or Malayalam name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="ALL">All Assigned Classes ({teacherClasses.map(c => `Class ${c}`).join(' & ')})</option>
            {teacherClasses.map(c => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Empty State when no students match */}
      {filteredStudents.length === 0 && (
        <Card className="p-10 text-center bg-white border border-[#E3EAE6]">
          <div className="w-14 h-14 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#1F2933]">No Students Found</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No student matches "${searchQuery}". Try a different name or admission number.`
              : 'There are no students listed in this class yet.'}
          </p>
        </Card>
      )}

      {/* Desktop Table View (lg and above) */}
      {filteredStudents.length > 0 && (
        <div className="hidden lg:block bg-white rounded-2xl border border-[#E3EAE6] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F2] border-b border-[#E3EAE6] text-[11px] font-extrabold uppercase tracking-wider text-[#667085]">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4">Quran Progress</th>
                <th className="py-3.5 px-4">Overall Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE6] text-xs">
              {filteredStudents.map(student => {
                const summary = getStudentSummary(student.id);
                return (
                  <tr key={student.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} gender={student.gender} size="md" />
                        <div>
                          <p className="font-bold text-[#1F2933] text-sm">{student.name}</p>
                          <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                          <p className="text-[10px] text-[#667085]">Adm: {student.admissionNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1F2933]">
                      Class {student.class}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-[#0F6B50]">{summary?.attendancePercentage ?? 0}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-[#1F2933]">{summary?.quranProgress ?? 0}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-md">
                        {summary?.overallProgress ?? 0}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="green" size="sm">Active</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveStudent(student)}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Dossier
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile / Tablet Cards View (< lg) */}
      {filteredStudents.length > 0 && (
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredStudents.map(student => {
            const summary = getStudentSummary(student.id);
            return (
              <Card key={student.id} className="p-4 hover:border-[#0F6B50] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.name} gender={student.gender} size="lg" />
                    <div>
                      <h4 className="text-sm font-bold text-[#1F2933]">{student.name}</h4>
                      <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                      <p className="text-[10px] text-[#667085] mt-0.5">
                        Class {student.class} • Adm: {student.admissionNo}
                      </p>
                    </div>
                  </div>
                  <Badge variant="green" size="sm">Active</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E3EAE6] text-center text-xs">
                  <div className="bg-[#FAF8F2] p-2 rounded-xl">
                    <p className="text-[9px] text-[#667085] font-bold uppercase">Quran</p>
                    <p className="font-extrabold text-[#1F2933] mt-0.5">{summary?.quranProgress ?? 0}%</p>
                  </div>
                  <div className="bg-[#FAF8F2] p-2 rounded-xl">
                    <p className="text-[9px] text-[#667085] font-bold uppercase">Attendance</p>
                    <p className="font-extrabold text-[#0F6B50] mt-0.5">{summary?.attendancePercentage ?? 0}%</p>
                  </div>
                  <div className="bg-[#DDEDE5] p-2 rounded-xl">
                    <p className="text-[9px] text-[#084C3A] font-bold uppercase">Overall</p>
                    <p className="font-black text-[#084C3A] mt-0.5">{summary?.overallProgress ?? 0}%</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs"
                  onClick={() => setActiveStudent(student)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View Student Dossier
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Student Dossier Modal */}
      {activeStudent && (
        <Modal
          isOpen={!!activeStudent}
          onClose={() => setActiveStudent(null)}
          title={`Student Growth Dossier: ${activeStudent.name}`}
          subtitle={`Class ${activeStudent.class} • Admission No: ${activeStudent.admissionNo}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6]">
              <Avatar name={activeStudent.name} gender={activeStudent.gender} size="lg" ring />
              <div className="flex-1">
                <h4 className="text-base font-extrabold text-[#1F2933]">{activeStudent.name}</h4>
                <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{activeStudent.malayalamName}</p>
                <p className="text-xs text-[#667085] mt-1">Parent: {activeStudent.parentName} ({activeStudent.parentPhone})</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-[#DDEDE5] rounded-xl">
                <p className="text-[10px] text-[#084C3A] font-bold">Overall Progress</p>
                <p className="text-xl font-black text-[#084C3A] mt-0.5">{getStudentSummary(activeStudent.id)?.overallProgress}%</p>
              </div>
              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#E3EAE6]">
                <p className="text-[10px] text-[#667085] font-bold">Quran</p>
                <p className="text-xl font-black text-[#1F2933] mt-0.5">{getStudentSummary(activeStudent.id)?.quranProgress}%</p>
              </div>
              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#E3EAE6]">
                <p className="text-[10px] text-[#667085] font-bold">Studies</p>
                <p className="text-xl font-black text-[#1F2933] mt-0.5">{getStudentSummary(activeStudent.id)?.studiesProgress}%</p>
              </div>
              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#E3EAE6]">
                <p className="text-[10px] text-[#667085] font-bold">Attendance</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{getStudentSummary(activeStudent.id)?.attendancePercentage}%</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
              <Button variant="outline" size="sm" onClick={() => setActiveStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

