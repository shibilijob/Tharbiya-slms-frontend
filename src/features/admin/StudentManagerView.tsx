import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog';
import { Student, Gender, StudentStatus } from '../../types';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';

const PAGE_SIZE = 20;

export const StudentManagerView: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent } = useData();
  const { showToast } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic parents and teachers lists
  const existingParents = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string }>();
    students.forEach(s => {
      if (s.parentId && s.parentName && !map.has(s.parentId)) {
        map.set(s.parentId, { id: s.parentId, name: s.parentName, phone: s.parentPhone || '' });
      }
    });
    return Array.from(map.values());
  }, [students]);

  const existingTeachers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    students.forEach(s => {
      if (s.assignedTeacherId && s.teacherName && !map.has(s.assignedTeacherId)) {
        map.set(s.assignedTeacherId, { id: s.assignedTeacherId, name: s.teacherName });
      }
    });
    return Array.from(map.values());
  }, [students]);

  // Form fields
  const [name, setName] = useState('');
  const [malayalamName, setMalayalamName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dob, setDob] = useState('2015-05-14');
  const [studentClass, setStudentClass] = useState('5');
  const [parentId, setParentId] = useState('');
  const [assignedTeacherId, setAssignedTeacherId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('2022-06-01');
  const [status, setStatus] = useState<StudentStatus>('ACTIVE');
  const [bloodGroup, setBloodGroup] = useState('O+');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.malayalamName && s.malayalamName.includes(searchQuery));
    const matchesClass = selectedClass === 'ALL' || s.class === selectedClass;
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalStudents);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleClassChange = (val: string) => {
    setSelectedClass(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    setMalayalamName('');
    setAdmissionNo(`DN-2026-${Math.floor(100 + Math.random() * 900)}`);
    setGender('MALE');
    setDob('2015-05-14');
    setStudentClass('5');
    setParentId(existingParents[0]?.id || `parent-${Date.now()}`);
    setAssignedTeacherId(existingTeachers[0]?.id || 'teacher-1');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setStatus('ACTIVE');
    setBloodGroup('O+');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setMalayalamName(student.malayalamName || '');
    setAdmissionNo(student.admissionNo);
    setGender(student.gender);
    setDob(student.dob);
    setStudentClass(student.class);
    setParentId(student.parentId);
    setAssignedTeacherId(student.assignedTeacherId);
    setAdmissionDate(student.admissionDate);
    setStatus(student.status);
    setBloodGroup(student.bloodGroup || 'O+');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const parentObj = existingParents.find(p => p.id === parentId);
      const teacherObj = existingTeachers.find(t => t.id === assignedTeacherId);

      const parentName = parentObj?.name || 'Parent';
      const parentPhone = parentObj?.phone || '+91 98470 00000';
      const teacherName = teacherObj?.name || 'Usthad Shihabudheen Saadi';

      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name,
          malayalamName,
          admissionNo,
          gender,
          dob,
          class: studentClass,
          parentId: parentId || `parent-${Date.now()}`,
          parentName,
          parentPhone,
          assignedTeacherId: assignedTeacherId || 'teacher-1',
          teacherName,
          admissionDate,
          status,
          bloodGroup
        });
        showToast(`✓ Student ${name} updated successfully!`);
      } else {
        await addStudent({
          name,
          malayalamName,
          admissionNo,
          gender,
          dob,
          class: studentClass,
          parentId: parentId || `parent-${Date.now()}`,
          parentName,
          parentPhone,
          assignedTeacherId: assignedTeacherId || 'teacher-1',
          teacherName,
          admissionDate,
          status,
          bloodGroup
        });
        showToast(`✓ New student ${name} enrolled successfully!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save student", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudentId) return;
    try {
      await deleteStudent(deletingStudentId);
      showToast(`Student removed from system.`);
      setDeletingStudentId(null);
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Student Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Enroll students, assign teachers, link parents, and manage admission records
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Enroll New Student
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search by student name or admission no..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />

        <Select
          value={selectedClass}
          onChange={(e) => handleClassChange(e.target.value)}
        >
          <option value="ALL">All Classes (1 - 7)</option>
          <option value="1">Class 1</option>
          <option value="2">Class 2</option>
          <option value="3">Class 3</option>
          <option value="4">Class 4</option>
          <option value="5">Class 5</option>
          <option value="6">Class 6</option>
          <option value="7">Class 7</option>
        </Select>

        <Select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-[#E3EAE6] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF8F2] border-b border-[#E3EAE6] text-[11px] font-extrabold uppercase tracking-wider text-[#667085]">
              <th className="py-3.5 px-4">Student</th>
              <th className="py-3.5 px-4">Class</th>
              <th className="py-3.5 px-4">Guardian / Contact</th>
              <th className="py-3.5 px-4">Class Teacher</th>
              <th className="py-3.5 px-4">Adm Date</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3EAE6] text-xs">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#667085]">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedStudents.map(student => (
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
                    <p className="font-bold text-[#1F2933]">{student.parentName}</p>
                    <p className="text-[10px] text-[#667085]">{student.parentPhone}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#1F2933]">
                    {student.teacherName}
                  </td>
                  <td className="py-3.5 px-4 text-[#667085]">
                    {formatDate(student.admissionDate)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="p-1.5 rounded-lg text-[#0F6B50] hover:bg-[#DDEDE5] transition-colors"
                      title="Edit Student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingStudentId(student.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginatedStudents.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[#667085] bg-white rounded-2xl border border-[#E3EAE6]">
            No students found matching your criteria.
          </div>
        ) : (
          paginatedStudents.map(student => (
            <Card key={student.id} className="p-4 hover:border-[#0F6B50] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={student.name} gender={student.gender} size="lg" />
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2933]">{student.name}</h4>
                    <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                    <p className="text-[10px] text-[#667085]">Class {student.class} • Adm: {student.admissionNo}</p>
                  </div>
                </div>
                <Badge variant="green" size="sm">{student.status}</Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E3EAE6] text-xs space-y-1">
                <p><strong className="text-[#667085]">Parent:</strong> {student.parentName} ({student.parentPhone})</p>
                <p><strong className="text-[#667085]">Teacher:</strong> {student.teacherName}</p>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-[#FAF8F2]">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(student)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeletingStudentId(student.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalStudents > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#667085]">
            Showing <span className="font-bold text-[#1F2933]">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-[#1F2933]">{endIndex}</span> of{' '}
            <span className="font-bold text-[#1F2933]">{totalStudents}</span> students
            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FAF8F2] border border-[#E3EAE6] text-[10px] font-semibold text-[#0F6B50]">
              Limit: 20 / page
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-[#0F6B50] text-white shadow-sm'
                          : 'text-[#667085] hover:bg-[#FAF8F2] hover:text-[#1F2933] border border-transparent hover:border-[#E3EAE6]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="text-xs text-[#667085] px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : "Enroll New Student"}
        subtitle="Darunnajath Mundambra Student Registry"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Class"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
            >
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
            </Select>

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StudentStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assign Parent / Guardian"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              {existingParents.length === 0 ? (
                <option value="">Default Parent</option>
              ) : (
                existingParents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone})
                  </option>
                ))
              )}
            </Select>

            <Select
              label="Assign Class Usthad / Mentor"
              value={assignedTeacherId}
              onChange={(e) => setAssignedTeacherId(e.target.value)}
            >
              {existingTeachers.length === 0 ? (
                <option value="teacher-1">Usthad Shihabudheen Saadi</option>
              ) : (
                existingTeachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Admission Date"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              required
            />
            <Input
              label="Blood Group"
              placeholder="e.g. O+, B+, A+"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingStudent ? "Save Changes" : "Enroll Student"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingStudentId}
        onClose={() => setDeletingStudentId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Record"
        message="Are you sure you want to remove this student record from Darunnajath registry? This action cannot be undone."
        confirmText="Delete Student"
        isDestructive
      />
    </div>
  );
};
