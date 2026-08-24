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
import { Student, Gender, StudentStatus } from '../../types';
import {
  Users,
  Search,
  Eye,
  Plus,
  UserPlus,
  GraduationCap,
  Sparkles,
  Phone,
  User,
  Calendar,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const StudentRosterView: React.FC = () => {
  const { students, getStudentSummary, addStudent } = useData();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add Student Form Fields
  const [name, setName] = useState('');
  const [malayalamName, setMalayalamName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dob, setDob] = useState('2015-05-14');
  const [studentClass, setStudentClass] = useState('5');
  const [parentType, setParentType] = useState<'EXISTING' | 'NEW'>('NEW');
  const [parentId, setParentId] = useState('');
  const [customParentName, setCustomParentName] = useState('');
  const [customParentPhone, setCustomParentPhone] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');

  // Extract unique parents from current students registry
  const existingParents = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string }>();
    students.forEach(s => {
      if (s.parentId && s.parentName && !map.has(s.parentId)) {
        map.set(s.parentId, { id: s.parentId, name: s.parentName, phone: s.parentPhone || '' });
      }
    });
    return Array.from(map.values());
  }, [students]);

  // Filter students assigned to teacher (Classes 5 and 6)
  const teacherStudents = students.filter(s => s.class === '5' || s.class === '6');

  const filteredStudents = teacherStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.malayalamName && s.malayalamName.includes(searchQuery));
    const matchesClass = selectedClass === 'ALL' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleOpenAdd = () => {
    setName('');
    setMalayalamName('');
    setAdmissionNo(`DN-2026-${Math.floor(100 + Math.random() * 900)}`);
    setGender('MALE');
    setDob('2015-05-14');
    setStudentClass('5');
    setParentType(existingParents.length > 0 ? 'EXISTING' : 'NEW');
    setParentId(existingParents[0]?.id || '');
    setCustomParentName('');
    setCustomParentPhone('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setBloodGroup('O+');
    setAddress('Mundambra, Kerala');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      let finalParentName = '';
      let finalParentPhone = '';
      let finalParentId = parentId;

      if (parentType === 'NEW' && customParentName.trim()) {
        finalParentName = customParentName.trim();
        finalParentPhone = customParentPhone.trim() || '+91 98470 00000';
        finalParentId = `parent-custom-${Date.now()}`;
      } else {
        const parentObj = existingParents.find(p => p.id === parentId) || existingParents[0];
        finalParentName = parentObj?.name || 'Parent';
        finalParentPhone = parentObj?.phone || '+91 98470 00000';
        finalParentId = parentObj?.id || `parent-${Date.now()}`;
      }

      const teacherName = user?.name || 'Usthad Shihabudheen Saadi';
      const teacherId = user?.id || 'teacher-1';

      await addStudent({
        name: name.trim(),
        malayalamName: malayalamName.trim() || undefined,
        admissionNo: admissionNo.trim(),
        gender,
        dob,
        class: studentClass,
        parentId: finalParentId,
        parentName: finalParentName,
        parentPhone: finalParentPhone,
        assignedTeacherId: teacherId,
        teacherName: teacherName,
        admissionDate,
        status: 'ACTIVE' as StudentStatus,
        bloodGroup,
        address
      });

      showToast(`✓ New student ${name} enrolled in Class ${studentClass} successfully!`);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add student', err);
    } finally {
      setIsSaving(false);
    }
  };

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
              Assigned Students
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Displaying students enrolled in your assigned classes (Class 5 & 6)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="green" size="lg">
            {filteredStudents.length} Students Active
          </Badge>
          <Button
            size="md"
            variant="primary"
            onClick={handleOpenAdd}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-sm shadow-[#0F6B50]/20"
          >
            Add Student
          </Button>
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

        <div className="w-full sm:w-48">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="ALL">All Assigned Classes (Class 5 & 6)</option>
            <option value="5">Class 5</option>
            <option value="6">Class 6</option>
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
          <div className="mt-4">
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Enroll Student Now
            </Button>
          </div>
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
                      <span className="font-black text-[#0F6B50]">{summary?.attendancePercentage || 94}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-[#1F2933]">{summary?.quranProgress || 90}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-md">
                        {summary?.overallProgress || 86}%
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
                    <p className="font-extrabold text-[#1F2933] mt-0.5">{summary?.quranProgress || 90}%</p>
                  </div>
                  <div className="bg-[#FAF8F2] p-2 rounded-xl">
                    <p className="text-[9px] text-[#667085] font-bold uppercase">Attendance</p>
                    <p className="font-extrabold text-[#0F6B50] mt-0.5">{summary?.attendancePercentage || 94}%</p>
                  </div>
                  <div className="bg-[#DDEDE5] p-2 rounded-xl">
                    <p className="text-[9px] text-[#084C3A] font-bold uppercase">Overall</p>
                    <p className="font-black text-[#084C3A] mt-0.5">{summary?.overallProgress || 86}%</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs"
                  onClick={() => setActiveStudent(student)}
                >
                  View & Edit Student Dossier
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

      {/* Add / Enroll Student Modal for Muallim */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll Student to Classroom"
        subtitle="Add a new student to your assigned Madrasa class roster"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Student Full Name (English)"
              placeholder="e.g. Muhammad Rayan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Student Name (Malayalam)"
              placeholder="e.g. മുഹമ്മദ് റയ്യാൻ"
              value={malayalamName}
              onChange={(e) => setMalayalamName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Admission Number"
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              required
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="MALE">Male (Boy)</option>
              <option value="FEMALE">Female (Girl)</option>
            </Select>
            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Class"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
            >
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="7">Class 7</option>
            </Select>

            <Select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              <option value="O+">O+</option>
              <option value="A+">A+</option>
              <option value="B+">B+</option>
              <option value="AB+">AB+</option>
              <option value="O-">O-</option>
              <option value="A-">A-</option>
              <option value="B-">B-</option>
              <option value="AB-">AB-</option>
            </Select>
          </div>

          {/* Parent / Guardian Selection */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F2933]">Parent / Guardian Information</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setParentType('EXISTING')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    parentType === 'EXISTING'
                      ? 'bg-[#0F6B50] text-white shadow-xs'
                      : 'bg-white text-[#667085] hover:bg-gray-100'
                  }`}
                >
                  Existing Parent
                </button>
                <button
                  type="button"
                  onClick={() => setParentType('NEW')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    parentType === 'NEW'
                      ? 'bg-[#0F6B50] text-white shadow-xs'
                      : 'bg-white text-[#667085] hover:bg-gray-100'
                  }`}
                >
                  + New Parent
                </button>
              </div>
            </div>

            {parentType === 'EXISTING' ? (
              <Select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                {existingParents.length === 0 && (
                  <option value="">No parents registered yet</option>
                )}
                {existingParents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </Select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Parent / Guardian Name"
                  placeholder="e.g. Abdul Rahman"
                  value={customParentName}
                  onChange={(e) => setCustomParentName(e.target.value)}
                  required={parentType === 'NEW'}
                />
                <Input
                  label="Parent Contact Phone"
                  placeholder="e.g. +91 98470 12345"
                  value={customParentPhone}
                  onChange={(e) => setCustomParentPhone(e.target.value)}
                  required={parentType === 'NEW'}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Admission Date"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              required
            />
            <Input
              label="Residential Address (Optional)"
              placeholder="e.g. Mundambra, Malappuram"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="p-3 bg-[#DDEDE5]/50 rounded-xl flex items-center gap-2 text-xs text-[#084C3A]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F6B50]" />
            <span>Assigned Usthad: <strong>{user?.name || 'Usthad Shihabudheen Saadi'}</strong></span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

