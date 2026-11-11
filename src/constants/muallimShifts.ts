export const MUALLIM_SHIFTS = [
  {
    id: 'SHIFT_1',
    name: 'Shift 1',
    time: '6:00 AM – 7:15 AM',
    label: 'Shift 1 (6:00 AM – 7:15 AM)',
    shortLabel: 'Shift 1 (6:00 AM - 7:15 AM)',
  },
  {
    id: 'SHIFT_2',
    name: 'Shift 2',
    time: '7:30 AM – 9:30 AM',
    label: 'Shift 2 (7:30 AM – 9:30 AM)',
    shortLabel: 'Shift 2 (7:30 AM - 9:30 AM)',
  },
  {
    id: 'SHIFT_3',
    name: 'Shift 3',
    time: '6:30 PM – 9:30 PM',
    label: 'Shift 3 (6:30 PM – 9:30 PM)',
    shortLabel: 'Shift 3 (6:30 PM - 9:30 PM)',
  },
] as const;

export type MuallimShiftId = 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3';

export const MUALLIM_ATTENDANCE_STATUSES = [
  { id: 'PRESENT', label: 'Present', code: 'P', color: '#0F6B50', bg: '#DDEDE5', badgeClass: 'bg-[#DDEDE5] text-[#084C3A] border-[#0F6B50]/30' },
  { id: 'CL', label: 'CL', description: 'Casual Leave', code: 'CL', color: '#2563EB', bg: '#DBEAFE', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'HPL', label: 'HPL', description: 'Half Pay Leave', code: 'HPL', color: '#D97706', bg: '#FEF3C7', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'LLP', label: 'LLP', description: 'Leave Without Pay', code: 'LLP', color: '#DC2626', bg: '#FEE2E2', badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'HOLIDAY', label: 'Holiday', description: 'Institutional Holiday', code: 'H', color: '#7C3AED', bg: '#EDE9FE', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
] as const;

export type MuallimAttendanceStatusType = 'PRESENT' | 'CL' | 'HPL' | 'LLP' | 'HOLIDAY';

export const STATUS_OPTIONS: Array<{ value: MuallimAttendanceStatusType | ''; label: string }> = [
  { value: '', label: 'Not Recorded' },
  { value: 'PRESENT', label: 'Present' },
  { value: 'CL', label: 'CL (Casual Leave)' },
  { value: 'HPL', label: 'HPL (Half Pay Leave)' },
  { value: 'LLP', label: 'LLP (Leave Without Pay)' },
  { value: 'HOLIDAY', label: 'Holiday' },
];

