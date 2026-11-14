import React, { useState, useMemo } from 'react';
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
  Plus,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { useClassStore } from '../../stores';
import { Link, useSearchParams } from 'react-router-dom';
import { muallimService } from '../../services/muallimService';
import { mapBackendStudentToFrontend } from '../../services/studentService';
import { sortStudentsByRollNumber } from '../../utils/studentSorting';
import { classService, ClassAccessItem } from '../../services/classService';

export const StudentRosterView: React.FC = () => {
  const { students, updateStudentRollNumber } = useData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClassId = searchParams.get('classId') || searchParams.get('class') || '';
  const isSadhr = user?.role === 'SADHR_MUALLIM';

  const [storedClassId, setStoredClassId] = useState<string>(() => {
    if (typeof window !== 'undefined' && user?.role === 'SADHR_MUALLIM') {
      return sessionStorage.getItem('tharbiyah_sadhr_selected_class_id') || '';
    }
    return '';
  });

  const effectiveClassId = isSadhr ? (queryClassId || storedClassId) : '';

  // Synchronize sessionStorage and URL params for Sadhr Muallim
  React.useEffect(() => {
    if (!isSadhr) return;
    if (queryClassId) {
      sessionStorage.setItem('tharbiyah_sadhr_selected_class_id', queryClassId);
      setStoredClassId(queryClassId);
    } else if (storedClassId && !queryClassId) {
      setSearchParams({ classId: storedClassId }, { replace: true });
    }
  }, [isSadhr, queryClassId, storedClassId, setSearchParams]);

  const [classAccessList, setClassAccessList] = useState<ClassAccessItem[]>([]);
  const [classAccessLoaded, setClassAccessLoaded] = useState(!isSadhr);
  const [selectedClassStudents, setSelectedClassStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Roll Number Modal state
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [rollInput, setRollInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSavingRoll, setIsSavingRoll] = useState(false);

  const teacherAssignedClasses = useClassStore((s) => s.teacherAssignedClasses);
  const fetchAssignedClassesForTeacher = useClassStore((s) => s.fetchAssignedClassesForTeacher);

  React.useEffect(() => {
    if (user) {
      fetchAssignedClassesForTeacher(user);
    }
  }, [user, fetchAssignedClassesForTeacher]);

  // Load class access list for Sadhr to resolve class name / ObjectId
  React.useEffect(() => {
    if (!isSadhr) return;
    let active = true;
    setClassAccessLoaded(false);
    classService.getClassAccessList().then((items) => {
      if (!active) return;
      setClassAccessList(items);
      setClassAccessLoaded(true);
    }).catch((err) => {
      console.error('Failed to load class access list:', err);
      if (active) setClassAccessLoaded(true);
    });
    return () => { active = false; };
  }, [isSadhr]);

  const selectedClassAccess = useMemo(() => {
    if (!isSadhr || !effectiveClassId) return null;
    return classAccessList.find(
      (item) =>
        item.id === effectiveClassId ||
        item.name.replace(/^Class\s*/i, '').trim() === effectiveClassId.replace(/^Class\s*/i, '').trim()
    ) || null;
  }, [isSadhr, effectiveClassId, classAccessList]);

  const displayClassName = useMemo(() => {
    if (selectedClassAccess) {
      return selectedClassAccess.name.replace(/^Class\s*/i, '').trim();
    }
    if (effectiveClassId) {
      return effectiveClassId.replace(/^Class\s*/i, '').trim();
    }
    return '';
  }, [selectedClassAccess, effectiveClassId]);

  // Fetch class students for Sadhr Muallim
  React.useEffect(() => {
    if (!isSadhr) return;
    if (!effectiveClassId) {
      setSelectedClassStudents([]);
      setIsLoadingStudents(false);
      setRosterError(null);
      return;
    }

    let active = true;
    setIsLoadingStudents(true);
    setRosterError(null);

    const targetClassId = selectedClassAccess?.id || effectiveClassId;
    muallimService.getClassRoster(targetClassId).then((response: any) => {
      if (!active) return;
      const rows = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response) ? response : (Array.isArray(response?.data?.data) ? response.data.data : []));
      const className = displayClassName || (selectedClassAccess?.name ? selectedClassAccess.name.replace(/^Class\s*/i, '').trim() : '');
      const mapped = rows.map((row: any) => mapBackendStudentToFrontend(row, className));
      setSelectedClassStudents(mapped);
      setIsLoadingStudents(false);
    }).catch((error: any) => {
      console.error('Failed to load selected class roster:', error);
      if (active) {
        setSelectedClassStudents([]);
        setRosterError(error?.response?.data?.message || 'This class roster could not be loaded or you are not authorized to view it.');
        setIsLoadingStudents(false);
      }
    });

    return () => { active = false; };
  }, [isSadhr, effectiveClassId, selectedClassAccess, displayClassName]);

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
  const teacherStudents = isSadhr
    ? selectedClassStudents
    : students.filter((s) => {
        const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
        return teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id);
      });

  const filteredStudents = teacherStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.malayalamName && s.malayalamName.includes(searchQuery));
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    const fClass = selectedClass.replace(/^Class\s*/i, '').trim();
    const matchesClass = isSadhr || selectedClass === 'ALL' || sClass === fClass;
    return matchesSearch && matchesClass;
  });

  // Students sorted with assigned roll numbers first (ascending), followed by nulls
  const sortedStudents = useMemo(() => {
    return sortStudentsByRollNumber(filteredStudents);
  }, [filteredStudents]);

  const handleOpenRollModal = (student: Student) => {
    setModalStudent(student);
    setRollInput(student.rollNumber !== null && student.rollNumber !== undefined ? String(student.rollNumber) : '');
    setModalError(null);
  };

  const handleSaveRollNumber = async () => {
    if (!modalStudent) return;
    const trimmed = rollInput.trim();
    if (!trimmed) {
      setModalError('Please enter a roll number or click Clear Roll Number');
      return;
    }

    const num = Number(trimmed);
    if (!Number.isInteger(num) || num < 1) {
      setModalError('Roll Number must be a positive whole number');
      return;
    }

    // Check duplicate in same class
    const studentClass = String(modalStudent.class).replace(/^Class\s*/i, '').trim();
    const duplicate = teacherStudents.find((s) => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return s.id !== modalStudent.id && sClass === studentClass && s.rollNumber === num;
    });
    if (duplicate) {
      setModalError(`Roll Number ${num} is already assigned to another student in this class`);
      return;
    }

    setIsSavingRoll(true);
    setModalError(null);

    try {
      const updated = await updateStudentRollNumber(modalStudent.id, num);
      setSelectedClassStudents((prev) =>
        prev.map((s) => (s.id === modalStudent.id ? (updated ? { ...s, ...updated, rollNumber: num } : { ...s, rollNumber: num }) : s))
      );
      showToast(`Roll Number ${num} assigned to ${modalStudent.name}`);
      setModalStudent(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update roll number';
      setModalError(msg);
    } finally {
      setIsSavingRoll(false);
    }
  };

  const handleClearRollNumber = async () => {
    if (!modalStudent) return;
    setIsSavingRoll(true);
    setModalError(null);

    try {
      const updated = await updateStudentRollNumber(modalStudent.id, null);
      setSelectedClassStudents((prev) =>
        prev.map((s) => (s.id === modalStudent.id ? (updated ? { ...s, ...updated, rollNumber: null } : { ...s, rollNumber: null }) : s))
      );
      showToast(`Roll Number cleared for ${modalStudent.name}`);
      setModalStudent(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to clear roll number';
      setModalError(msg);
    } finally {
      setIsSavingRoll(false);
    }
  };

  if (isSadhr && !effectiveClassId) {
    return (
      <Card className="p-8 sm:p-12 text-center bg-white border border-[#E3EAE6] rounded-3xl max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">Choose a class</h1>
        <p className="mt-2 text-sm text-[#667085] max-w-md mx-auto leading-relaxed">
          Please select a class from Class Management or the Sadhr Office to view and manage its students and roll numbers.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/admin/classes"
            className="px-5 py-2.5 rounded-xl bg-[#0F6B50] hover:bg-[#084C3A] text-white text-xs font-bold transition-all shadow-sm"
          >
            Go to Class Management
          </Link>
          <Link
            to="/admin/dashboard"
            className="px-5 py-2.5 rounded-xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] text-[#1F2933] text-xs font-bold transition-all"
          >
            Sadhr Office Dashboard
          </Link>
        </div>
      </Card>
    );
  }

  if (isSadhr && (isLoadingStudents || (!classAccessLoaded && effectiveClassId))) {
    return (
      <Card className="p-12 text-center bg-white border border-[#E3EAE6] rounded-3xl">
        <div className="animate-spin w-8 h-8 border-4 border-[#0F6B50] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-bold text-[#1F2933]">
          Loading {displayClassName ? `Class ${displayClassName}` : 'Class'} Students...
        </p>
        <p className="text-xs text-[#667085] mt-1">Retrieving student records and roll numbers</p>
      </Card>
    );
  }

  if (isSadhr && rosterError) {
    return (
      <Card className="p-8 sm:p-12 text-center bg-white border border-[#E3EAE6] rounded-3xl max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-extrabold text-[#1F2933]">Class unavailable</h1>
        <p className="mt-2 text-sm text-[#667085] max-w-md mx-auto">
          {rosterError || 'This class roster could not be loaded or you are not authorized to view it.'}
        </p>
        <Link
          to="/admin/classes"
          className="mt-6 inline-flex px-5 py-2.5 rounded-xl bg-[#0F6B50] hover:bg-[#084C3A] text-white text-xs font-bold transition-all"
        >
          Back to Class Management
        </Link>
      </Card>
    );
  }

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
              My Students
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            {isSadhr
              ? `Displaying students enrolled in selected class ${displayClassName ? `Class ${displayClassName}` : ''}`
              : `Displaying students enrolled in your assigned classes (${teacherClasses.map((c) => `Class ${c}`).join(' & ')})`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="green" size="lg">
            {sortedStudents.length} Students
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

        {!isSadhr && (
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
        )}
      </div>

      {/* Empty State when no students match */}
      {sortedStudents.length === 0 && (
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
      {sortedStudents.length > 0 && (
        <div className="hidden lg:block bg-white rounded-2xl border border-[#E3EAE6] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F2] border-b border-[#E3EAE6] text-[11px] font-extrabold uppercase tracking-wider text-[#667085]">
                <th className="py-3.5 px-4 w-28">Roll Number</th>
                <th className="py-3.5 px-4 w-36">Register Number</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4 w-32">Status</th>
                <th className="py-3.5 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE6] text-xs">
              {sortedStudents.map(student => {
                const hasRoll = typeof student.rollNumber === 'number' && student.rollNumber > 0;
                return (
                  <tr key={student.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                    {/* 1. Roll Number */}
                    <td className="py-3.5 px-4 font-bold">
                      {hasRoll ? (
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-lg bg-[#DDEDE5] text-[#084C3A] font-extrabold text-xs">
                          {student.rollNumber}
                        </span>
                      ) : (
                        <span className="text-[#98A2B3] italic">—</span>
                      )}
                    </td>

                    {/* 2. Register Number */}
                    <td className="py-3.5 px-4 font-semibold text-[#475467]">
                      {student.admissionNo}
                    </td>

                    {/* 3. Student Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} gender={student.gender} size="md" />
                        <div>
                          <p className="font-bold text-[#1F2933] text-sm">{student.name}</p>
                          {student.malayalamName && (
                            <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">
                              {student.malayalamName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={student.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">
                        {student.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* 5. Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {hasRoll ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRollModal(student)}
                          className="text-xs border-[#0F6B50] text-[#0F6B50] hover:bg-[#DDEDE5]/50"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Roll No
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenRollModal(student)}
                          className="text-xs bg-[#0F6B50] hover:bg-[#0D5A43] text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Roll No
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile / Tablet Cards View (< lg) */}
      {sortedStudents.length > 0 && (
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedStudents.map(student => {
            const hasRoll = typeof student.rollNumber === 'number' && student.rollNumber > 0;
            return (
              <Card key={student.id} className="p-4 hover:border-[#0F6B50] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.name} gender={student.gender} size="lg" />
                    <div>
                      <h4 className="text-sm font-bold text-[#1F2933]">{student.name}</h4>
                      {student.malayalamName && (
                        <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                      )}
                      <p className="text-[11px] text-[#667085] mt-0.5">
                        Adm: <span className="font-semibold text-[#1F2933]">{student.admissionNo}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={student.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">
                    {student.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E3EAE6]">
                  <div className="flex items-center gap-1.5 text-xs text-[#667085]">
                    <span className="font-medium">Roll No:</span>
                    {hasRoll ? (
                      <span className="font-extrabold text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-md">
                        #{student.rollNumber}
                      </span>
                    ) : (
                      <span className="text-[#98A2B3] italic">None</span>
                    )}
                  </div>

                  <div>
                    {hasRoll ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRollModal(student)}
                        className="text-xs border-[#0F6B50] text-[#0F6B50] hover:bg-[#DDEDE5]/50"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Roll No
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenRollModal(student)}
                        className="text-xs bg-[#0F6B50] hover:bg-[#0D5A43] text-white"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Roll No
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Roll Number Add/Edit Modal */}
      {modalStudent && (
        <Modal
          isOpen={!!modalStudent}
          onClose={() => {
            if (!isSavingRoll) setModalStudent(null);
          }}
          title={modalStudent.rollNumber ? 'Edit Roll Number' : 'Add Roll Number'}
          subtitle={`Manage student roll number`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Student Info Card (Read Only) */}
            <div className="p-3.5 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6] space-y-1">
              <p className="text-[11px] text-[#667085] font-bold uppercase tracking-wider">Student Details</p>
              <p className="text-sm font-extrabold text-[#1F2933]">{modalStudent.name}</p>
              <div className="flex items-center gap-4 text-xs text-[#667085] pt-1">
                <span>Class: <strong className="text-[#1F2933]">Class {modalStudent.class}</strong></span>
                <span>Register No: <strong className="text-[#1F2933]">{modalStudent.admissionNo}</strong></span>
              </div>
            </div>

            {/* Input field */}
            <div>
              <label className="block text-xs font-bold text-[#344054] mb-1.5">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 1, 2, 3..."
                value={rollInput}
                onChange={(e) => {
                  setRollInput(e.target.value);
                  setModalError(null);
                }}
                disabled={isSavingRoll}
                autoFocus
              />
              <p className="text-[11px] text-[#667085] mt-1">
                Must be a positive whole number unique to Class {modalStudent.class}.
              </p>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
              <div>
                {modalStudent.rollNumber !== null && modalStudent.rollNumber !== undefined && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSavingRoll}
                    onClick={handleClearRollNumber}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Clear Roll Number
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSavingRoll}
                  onClick={() => setModalStudent(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSavingRoll}
                  onClick={handleSaveRollNumber}
                  className="text-xs bg-[#0F6B50] hover:bg-[#0D5A43] text-white"
                >
                  {isSavingRoll ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
