import React, { useState, useEffect } from 'react';
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
import { api } from '../../lib/axios';
import { studentService } from '../../services/studentService';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const PAGE_SIZE = 20;

interface ParentOption {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface TeacherOption {
  id: string;
  name: string;
  designation?: string;
}

interface ClassOption {
  id: string;
  name: string;
}

export const StudentManagerView: React.FC = () => {
  const { students: contextStudents, addStudent, updateStudent, deleteStudent } = useData();
  const { showToast } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState<Student[]>(contextStudents);

  // Dynamic dropdown data from backend
  const [parentsList, setParentsList] = useState<ParentOption[]>([]);
  const [classesList, setClassesList] = useState<ClassOption[]>([]);

  // Load parents and classes from the database
  const loadDropdownData = async () => {
    try {
      // 1. Parents
      api.get<any>('/sadhr/parents').then((res) => {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (Array.isArray(raw) && raw.length > 0) {
          setParentsList(
            raw.map((p: any) => ({
              id: p.id || p._id,
              name: p.name,
              phone: p.phone,
              email: p.email,
            }))
          );
        }
      }).catch(() => {});

      // 2. Classes
      api.get<any>('/sadhr/classes').then((res) => {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (Array.isArray(raw) && raw.length > 0) {
          const sorted = [...raw].sort((a: any, b: any) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          );
          setClassesList(
            sorted.map((c: any) => ({
              id: c.id || c._id,
              name: c.name,
            }))
          );
        }
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to load dropdown data:', err);
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      try {
        const fetchedStudents: Student[] = [];
        const classId = selectedClass !== 'ALL' ? selectedClass : undefined;
        const status = selectedStatus !== 'ALL' ? selectedStatus : undefined;
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const result = await studentService.getPaginated({
            page,
            limit: 1000,
            classId,
            status,
          });

          fetchedStudents.push(...result.students);
          hasNextPage = result.pagination.hasNextPage;
          page += 1;
        }

        if (!cancelled) {
          setStudents(fetchedStudents);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
        if (!cancelled) {
          setStudents(contextStudents);
        }
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [contextStudents, selectedClass, selectedStatus]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [malayalamName, setMalayalamName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [dob, setDob] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [parentId, setParentId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('2022-06-01');
  const [status, setStatus] = useState<StudentStatus>('ACTIVE');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.malayalamName && s.malayalamName.includes(searchQuery));
    const cleanCls = String(s.class).replace(/^Class\s*/i, '');
    const filterCls = selectedClass.replace(/^Class\s*/i, '');
    const matchesClass = selectedClass === 'ALL' || cleanCls === filterCls;
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
    setAdmissionNo('');
    setGender('MALE');
    setDob('');
    const firstCls = classesList[0]?.name.replace(/^Class\s*/i, '') || '';
    setStudentClass(firstCls);
    setParentId(parentsList[0]?.id || '');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setMalayalamName(student.malayalamName || '');
    setAdmissionNo(student.admissionNo);
    setGender(student.gender);
    setDob(student.dob || '');
    setStudentClass(String(student.class).replace(/^Class\s*/i, ''));
    setParentId(student.parentId || '');
    setAdmissionDate(student.admissionDate || new Date().toISOString().split('T')[0]);
    setStatus(student.status || 'ACTIVE');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!admissionNo.trim()) {
      showToast('Admission number is required.');
      return;
    }
    if (!studentClass) {
      showToast('Please select a class from the database.');
      return;
    }
    if (!parentId) {
      showToast('Please select a parent from the database.');
      return;
    }

    setIsSaving(true);
    try {
      const parentObj = parentsList.find(p => p.id === parentId);
      const parentName = parentObj?.name || '';
      const parentPhone = parentObj?.phone || '';

      if (editingStudent) {
        const updated = await updateStudent(editingStudent.id, {
          name: name.trim(),
          malayalamName: malayalamName.trim(),
          admissionNo: admissionNo.trim(),
          gender,
          dob,
          class: studentClass,
          parentId,
          parentName,
          parentPhone,
          admissionDate,
          status,
        });
        setStudents((prev) => prev.map((student) => student.id === updated.id ? updated : student));
        showToast(`✓ Student ${name} updated successfully!`);
      } else {
        const created = await addStudent({
          name: name.trim(),
          malayalamName: malayalamName.trim(),
          admissionNo: admissionNo.trim(),
          gender,
          dob,
          class: studentClass,
          parentId,
          parentName,
          parentPhone,
          assignedTeacherId: '',
          teacherName: '',
          admissionDate,
          status,
        });
        setStudents((prev) => [created, ...prev.filter((student) => student.id !== created.id)]);
        showToast(`✓ New student ${name} enrolled successfully!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save student", err);
      showToast(err?.message || "Failed to save student");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudentId) return;
    try {
      await deleteStudent(deletingStudentId);
      setStudents((prev) => prev.filter((student) => student.id !== deletingStudentId));
      showToast(`Student removed from system.`);
      setDeletingStudentId(null);
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const handleDownloadAllActiveStudents = async () => {
    setIsDownloading(true);
    try {
      await studentService.downloadAllActiveStudents();
      showToast('Active students PDF downloaded successfully.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to download active students PDF.');
    } finally {
      setIsDownloading(false);
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
            Enroll students, assign classes, link parents, and manage admission records
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            size="md"
            variant="outline"
            onClick={handleDownloadAllActiveStudents}
            isLoading={isDownloading}
            disabled={isDownloading}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download All Active Students
          </Button>
          <Button
            size="md"
            variant="primary"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Enroll New Student
          </Button>
        </div>
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
          <option value="ALL">All Classes</option>
          {classesList.map((c) => {
            const clsVal = c.name.replace(/^Class\s*/i, '') || c.name;
            return (
              <option key={c.id || c.name} value={clsVal}>
                {c.name}
              </option>
            );
          })}
        </Select>

        <Select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="ALL">All Statuses (Active & Inactive)</option>
          <option value="ACTIVE">Active Students</option>
          <option value="INACTIVE">Inactive Students</option>
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
                        {student.malayalamName && (
                          <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                        )}
                        <p className="text-[10px] text-[#667085]">Adm: {student.admissionNo} • {student.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1F2933]">
                    <span className="px-2.5 py-1 rounded-xl bg-[#DDEDE5] text-[#084C3A] text-xs font-black">
                      Class {student.class}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#1F2933]">{student.parentName}</p>
                    <p className="text-[10px] text-[#667085]">{student.parentPhone}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#1F2933]">
                    {student.teacherName}
                  </td>
                  <td className="py-3.5 px-4 text-[#667085]">
                    {formatDate(student.admissionDate)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={student.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">
                      {student.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(student)}
                        className="text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1 text-[#0F6B50]" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeletingStudentId(student.id)}
                        className="text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
                <Badge variant={student.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">{student.status}</Badge>
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
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0F6B50] text-white shadow-xs'
                        : 'bg-[#FAF8F2] text-[#667085] hover:bg-[#DDEDE5] hover:text-[#0F6B50]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
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
              {classesList.map((c) => {
                const clsVal = c.name.replace(/^Class\s*/i, '') || c.name;
                return (
                  <option key={c.id || c.name} value={clsVal}>
                    {c.name}
                  </option>
                );
              })}
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
              <option value="">-- Select Parent / Guardian --</option>
              {parentsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </Select>

            <Input
              label="Admission Date"
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} disabled={isSaving}>
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
        variant="danger"
      />
    </div>
  );
};
