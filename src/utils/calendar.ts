export interface CalendarDayCell {
  key: string;
  dayNum: number | null;
  dateKey: string;
  weekday: number | null;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

export const getCurrentMonthKey = (now = new Date()) =>
  `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

export const parseMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
};

export const getLocalDateFromKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getMonthLabel = (monthKey: string) => {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const getCalendarMonthCells = (monthKey: string): CalendarDayCell[] => {
  if (!monthKey) return [];

  const { year, month } = parseMonthKey(monthKey);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlankCount = firstDay.getDay();

  const leadingBlanks = Array.from({ length: leadingBlankCount }, (_, index) => ({
    key: `blank-${monthKey}-${index}`,
    dayNum: null,
    dateKey: '',
    weekday: null,
  }));

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNum = index + 1;
    const dateKey = `${monthKey}-${pad2(dayNum)}`;
    const date = new Date(year, month - 1, dayNum);

    return {
      key: dateKey,
      dayNum,
      dateKey,
      weekday: date.getDay(),
    };
  });

  return [...leadingBlanks, ...days];
};
