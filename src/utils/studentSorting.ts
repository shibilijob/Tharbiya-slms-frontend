/**
 * Utility to sort students by Roll Number ascending.
 * 
 * Rules:
 * - Students with an assigned positive roll number appear FIRST (1, 2, 3...).
 * - Students WITHOUT a roll number appear AFTER students with roll numbers,
 *   retaining their default order (e.g. alphabetical by name).
 */
export function sortStudentsByRollNumber<T extends { rollNumber?: number | null; name?: string; studentName?: string }>(
  students: T[]
): T[] {
  return [...students].sort((a, b) => {
    const aHas = typeof a.rollNumber === 'number' && a.rollNumber > 0;
    const bHas = typeof b.rollNumber === 'number' && b.rollNumber > 0;

    if (aHas && bHas) {
      return (a.rollNumber as number) - (b.rollNumber as number);
    }
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;

    const nameA = a.name || a.studentName || '';
    const nameB = b.name || b.studentName || '';
    return nameA.localeCompare(nameB);
  });
}
