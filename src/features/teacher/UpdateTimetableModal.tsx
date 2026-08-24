import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { timetableService } from '../../services/timetableService';
import { subjectService } from '../../services/subjectService';
import { MadrasaDay, TimetablePeriod } from '../../data/mockTimetable';
import { SubjectMeta } from '../../data/madrasaCurriculum';
import {
  CalendarDays,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  BookOpen,
  MapPin,
  User,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface UpdateTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass?: string;
  onUpdated?: () => void;
}

const DAYS_LIST: { day: MadrasaDay; label: string; malayalam: string }[] = [
  { day: 'Sunday', label: 'Sunday', malayalam: 'ഞായർ' },
  { day: 'Monday', label: 'Monday', malayalam: 'തിങ്കൾ' },
  { day: 'Tuesday', label: 'Tuesday', malayalam: 'ചൊവ്വ' },
  { day: 'Wednesday', label: 'Wednesday', malayalam: 'ബുധൻ' },
  { day: 'Thursday', label: 'Thursday', malayalam: 'വ്യാഴം' },
  { day: 'Friday', label: 'Friday', malayalam: 'വെള്ളി' },
  { day: 'Saturday', label: 'Saturday', malayalam: 'ശനി' }
];

export const UpdateTimetableModal: React.FC<UpdateTimetableModalProps> = ({
  isOpen,
  onClose,
  initialClass = '5',
  onUpdated
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedDay, setSelectedDay] = useState<MadrasaDay>('Sunday');
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectMeta[]>([]);

  // Period Form State (for adding / editing a period)
  const [isEditingPeriod, setIsEditingPeriod] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [periodNum, setPeriodNum] = useState(1);
  const [startTime, setStartTime] = useState('07:00 AM');
  const [endTime, setEndTime] = useState('07:45 AM');
  const [subjectName, setSubjectName] = useState('Quran');
  const [subjectMalayalam, setSubjectMalayalam] = useState('ഖുർആൻ പാരായണം');
  const [teacherName, setTeacherName] = useState(user?.name || 'Usthad Shihabudheen Saadi');
  const [room, setRoom] = useState('Dars Hall 5');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load subjects and timetable for selected class and day
  useEffect(() => {
    if (isOpen) {
      setSubjectsList(subjectService.getAll());
      const daySchedule = timetableService.getDaySchedule(selectedClass, selectedDay);
      setPeriods(daySchedule);
    }
  }, [isOpen, selectedClass, selectedDay]);

  const handleOpenAddPeriod = () => {
    setEditingPeriodId(null);
    const nextNum = periods.length > 0 ? Math.max(...periods.map(p => p.periodNumber)) + 1 : 1;
    setPeriodNum(nextNum);
    setStartTime('08:30 AM');
    setEndTime('09:15 AM');
    setSubjectName(subjectsList[0]?.name || 'Quran');
    setSubjectMalayalam(subjectsList[0]?.malayalamName || 'ഖുർആൻ പാരായണം');
    setTeacherName(user?.name || 'Usthad Shihabudheen Saadi');
    setRoom(`Dars Hall ${selectedClass.replace('Class ', '')}`);
    setNotes('');
    setIsEditingPeriod(true);
  };

  const handleOpenEditPeriod = (period: TimetablePeriod) => {
    setEditingPeriodId(period.id);
    setPeriodNum(period.periodNumber);
    setStartTime(period.startTime);
    setEndTime(period.endTime);
    setSubjectName(period.subject);
    setSubjectMalayalam(period.subjectMalayalam);
    setTeacherName(period.teacherName);
    setRoom(period.room);
    setNotes(period.notes || '');
    setIsEditingPeriod(true);
  };

  const handleSubjectChange = (name: string) => {
    setSubjectName(name);
    const found = subjectsList.find(s => s.name === name || s.id === name);
    if (found) {
      setSubjectMalayalam(found.malayalamName);
    }
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const periodObj: TimetablePeriod = {
      id: editingPeriodId || `period-${Date.now()}`,
      periodNumber: Number(periodNum),
      startTime,
      endTime,
      subject: subjectName,
      subjectMalayalam,
      teacherName,
      room,
      notes
    };

    const updated = timetableService.updatePeriod(selectedClass, selectedDay, periodObj);
    setPeriods(updated);
    setIsEditingPeriod(false);
    showToast(`✓ Period ${periodNum} (${subjectName}) updated for ${selectedDay}!`);
    if (onUpdated) onUpdated();
  };

  const handleDeletePeriod = (id: string) => {
    const updated = timetableService.deletePeriod(selectedClass, selectedDay, id);
    setPeriods(updated);
    showToast(`Period removed from ${selectedDay} schedule.`);
    if (onUpdated) onUpdated();
  };

  const handleResetSchedule = () => {
    const defaultData = timetableService.resetClassTimetable(selectedClass);
    setPeriods(defaultData[selectedDay] || []);
    showToast(`✓ Class ${selectedClass} timetable reset to Madrasa default.`);
    if (onUpdated) onUpdated();
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast(`✓ All timetable changes for Class ${selectedClass} saved successfully!`);
      if (onUpdated) onUpdated();
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Class Timetable & Routine"
      subtitle="Madrasa Daily Dars & Period Schedule Management"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Controls Bar: Class Selection & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <CalendarDays className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-[#667085] uppercase tracking-wider">Assigned Class</p>
              <h4 className="text-sm font-extrabold text-[#1F2933]">
                {selectedClass.startsWith('Class') ? selectedClass : `Class ${selectedClass}`} Routine
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-1.5 text-xs font-bold"
            >
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="4">Class 4</option>
              <option value="7">Class 7</option>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetSchedule}
              className="text-xs shrink-0"
              title="Reset to default routine"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-[#FAF8F2] p-1.5 rounded-2xl border border-[#E3EAE6]">
          {DAYS_LIST.map(({ day, label, malayalam }) => {
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  setIsEditingPeriod(false);
                }}
                className={`py-2 px-2 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-[#0F6B50] text-white font-black shadow-sm'
                    : 'bg-white text-[#1F2933] font-semibold hover:bg-emerald-50/60'
                }`}
              >
                <p className="text-xs leading-none">{label}</p>
                <p className={`font-malayalam text-[10px] mt-0.5 ${isActive ? 'text-[#DDEDE5]' : 'text-[#667085]'}`}>
                  {malayalam}
                </p>
              </button>
            );
          })}
        </div>

        {/* Period Editor / Period Form */}
        {isEditingPeriod ? (
          <form onSubmit={handleSavePeriod} className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#0F6B50]/30 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F6B50]" />
                <h4 className="text-sm font-extrabold text-[#1F2933]">
                  {editingPeriodId ? `Edit Period ${periodNum}` : `Add New Period (${selectedDay})`}
                </h4>
              </div>
              <Badge variant="green" size="sm">
                {selectedDay} • Class {selectedClass}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Period Number"
                type="number"
                min={1}
                max={8}
                value={periodNum}
                onChange={(e) => setPeriodNum(parseInt(e.target.value) || 1)}
                required
              />
              <Input
                label="Start Time"
                value={startTime}
                placeholder="e.g. 07:00 AM"
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="End Time"
                value={endTime}
                placeholder="e.g. 07:45 AM"
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Subject"
                value={subjectName}
                onChange={(e) => handleSubjectChange(e.target.value)}
              >
                {subjectsList.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.malayalamName})
                  </option>
                ))}
              </Select>

              <Input
                label="Subject Name in Malayalam"
                value={subjectMalayalam}
                onChange={(e) => setSubjectMalayalam(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Instructor / Usthad Name"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
              />

              <Input
                label="Classroom / Room"
                placeholder="e.g. Dars Hall 5"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>

            <Input
              label="Topic / Dars Routine Notes (Optional)"
              placeholder="e.g. Daily Sabaq hearing, Makhraj articulation drills..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E3EAE6]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPeriod(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {editingPeriodId ? 'Save Period' : 'Add Period'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {/* Header of the periods section */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#667085]">
                {selectedDay} Schedule ({periods.length} Periods)
              </h4>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleOpenAddPeriod}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs py-1.5"
              >
                Add Period
              </Button>
            </div>

            {/* List of Periods */}
            {periods.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F2] rounded-2xl border border-dashed border-[#E3EAE6]">
                <Clock className="w-8 h-8 text-[#0F6B50] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-[#1F2933]">No periods scheduled for {selectedDay}</p>
                <p className="text-[11px] text-[#667085] mt-0.5">Click "Add Period" above to create one or reset to standard routine.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {periods.map(period => (
                  <div
                    key={period.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E3EAE6] hover:border-[#0F6B50] shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#DDEDE5] text-[#084C3A] flex flex-col items-center justify-center font-black shrink-0">
                        <span className="text-[9px] uppercase leading-none text-[#0F6B50]">P</span>
                        <span className="text-sm leading-none mt-0.5">{period.periodNumber}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-extrabold text-[#1F2933]">{period.subject}</h5>
                          <span className="font-malayalam text-xs text-[#0F6B50] font-semibold">{period.subjectMalayalam}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#667085] flex-wrap">
                          <span className="flex items-center gap-1 font-bold text-[#0F6B50]">
                            <Clock className="w-3 h-3" /> {period.startTime} - {period.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {period.teacherName}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-800">
                            <MapPin className="w-3 h-3" /> {period.room}
                          </span>
                        </div>
                        {period.notes && (
                          <p className="text-[10px] text-[#667085] italic mt-1 bg-[#FAF8F2] px-2 py-0.5 rounded-md inline-block">
                            📌 {period.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPeriod(period)}
                        className="p-2 rounded-xl text-[#0F6B50] hover:bg-[#DDEDE5] transition-colors"
                        title="Edit Period"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(period.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Period"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span>Schedule applies to <strong>Class {selectedClass}</strong></span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveAll}
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Timetable
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
