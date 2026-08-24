import { AkhlaqCategory, SubjectName, AchievementCategory } from '../types';

export interface SubjectMeta {
  id: SubjectName;
  name: string;
  malayalamName: string;
  arabicName: string;
  icon: string;
  color: string;
  description: string;
}

export const MADRASA_SUBJECTS: SubjectMeta[] = [
  {
    id: 'Quran',
    name: 'Quran Tilawat',
    malayalamName: 'ഖുർആൻ പാരായണം',
    arabicName: 'تلاوة القرآن',
    icon: 'BookOpen',
    color: '#0F6B50',
    description: 'Proper pronunciation, rhythmic reading, and daily reading mastery'
  },
  {
    id: 'Hifz',
    name: 'Hifzul Quran',
    malayalamName: 'ഹിഫ്ള്',
    arabicName: 'حفظ القرآن',
    icon: 'BookmarkCheck',
    color: '#084C3A',
    description: 'Surah memorization, daily Sabaq lessons, and Sabaqi revision cycles'
  },
  {
    id: 'Tajweed',
    name: 'Tajweed Rules',
    malayalamName: 'തജ്‌വീദ്',
    arabicName: 'التجويد',
    icon: 'Mic',
    color: '#3B8772',
    description: 'Makharidj, Sifaat, Noon/Meem Sakinah and Madd articulation rules'
  },
  {
    id: 'Arabic',
    name: 'Arabic Language',
    malayalamName: 'അറബി ഭാഷ',
    arabicName: 'اللغة العربية',
    icon: 'Languages',
    color: '#1B735C',
    description: 'Vocabulary, grammar (Nahw/Sarf basics), comprehension and writing'
  },
  {
    id: 'Islamic Studies',
    name: 'Islamic Studies & Thareekh',
    malayalamName: 'ഇസ്‌ലാമിക് സ്റ്റഡീസ് & താരീഖ്',
    arabicName: 'التاريخ الإسلامي',
    icon: 'GraduationCap',
    color: '#248268',
    description: 'Seerah of Prophet (PBUH), companions, Islamic history and values'
  },
  {
    id: 'Fiqh',
    name: 'Fiqh & Ahkam',
    malayalamName: 'ഫിഖ്ഹ് (കർമ്മശാസ്ത്രം)',
    arabicName: 'الفقه الإسلامي',
    icon: 'Scale',
    color: '#165B47',
    description: 'Taharah, Salah, Sawm, Zakah and everyday Islamic jurisprudence'
  },
  {
    id: 'Akhlaq',
    name: 'Akhlaq & Adab',
    malayalamName: 'അഖ്‌ലാഖ് & ആദാബ്',
    arabicName: 'الأخلاق والآداب',
    icon: 'HeartHandshake',
    color: '#C9A227',
    description: 'Character building, respect for parents & teachers, manners and discipline'
  }
];

export interface AkhlaqCategoryMeta {
  id: string;
  title: string;
  titleMalayalam: string;
  description: string;
  maxScore?: number;
  icon?: string;
}

export const AKHLAQ_CATEGORIES: AkhlaqCategoryMeta[] = [
  {
    id: 'Discipline',
    title: 'Discipline',
    titleMalayalam: 'അച്ചടക്കം',
    description: 'Punctuality, classroom order, and adherence to Madrasa rules',
    maxScore: 5,
    icon: 'ShieldCheck'
  },
  {
    id: 'Respect',
    title: 'Respect to Teachers & Elders',
    titleMalayalam: 'ബഹുമാനം',
    description: 'Humble attitude, respectful speech, and honouring teachers & elders',
    maxScore: 5,
    icon: 'Heart'
  },
  {
    id: 'Cleanliness',
    title: 'Cleanliness & Taharah',
    titleMalayalam: 'ശുചിത്വം',
    description: 'Physical cleanliness, neat uniform, ablution adherence, book care',
    maxScore: 5,
    icon: 'Sparkles'
  },
  {
    id: 'Cooperation',
    title: 'Cooperation & Kindness',
    titleMalayalam: 'സഹകരണം',
    description: 'Helping fellow students, sharing, and avoiding disputes',
    maxScore: 5,
    icon: 'Users'
  },
  {
    id: 'Responsibility',
    title: 'Sense of Responsibility',
    titleMalayalam: 'ഉത്തരവാദിത്തം',
    description: 'Completing home revision, taking care of belongings and duties',
    maxScore: 5,
    icon: 'CheckCircle2'
  },
  {
    id: 'Participation',
    title: 'Classroom Participation',
    titleMalayalam: 'പങ്കാളിത്തം',
    description: 'Attentiveness, answering questions, eagerness to learn and improve',
    maxScore: 5,
    icon: 'Award'
  }
];

export interface AchievementBadgeMeta {
  category: AchievementCategory;
  defaultTitle: string;
  defaultMalayalam: string;
  iconName: string;
  color: string;
  description: string;
}

export const ACHIEVEMENT_BADGES: AchievementBadgeMeta[] = [
  {
    category: 'Weekly Hifz Completion',
    defaultTitle: 'Weekly Hifz Completion',
    defaultMalayalam: 'വാരാദ്യ ഹിഫ്ള് പൂർത്തീകരണം',
    iconName: 'BookmarkCheck',
    color: '#084C3A',
    description: 'Successfully completed the weekly designated Hifz target with accurate recitation and zero mistakes'
  },
  {
    category: 'Monthly Practical Score Topper',
    defaultTitle: 'Monthly Practical Score Topper',
    defaultMalayalam: 'പ്രതിമാസ പ്രാക്ടിക്കൽ സ്കോർ ടോപ്പർ',
    iconName: 'Sparkles',
    color: '#C9A227',
    description: 'Secured the highest practical evaluation score in daily Adab, prayer discipline, and Islamic conduct'
  },
  {
    category: 'Monthly Attendance Topper',
    defaultTitle: 'Monthly Attendance Topper',
    defaultMalayalam: 'പ്രതിമാസ ഹാജർ ടോപ്പർ',
    iconName: 'CalendarCheck',
    color: '#0F6B50',
    description: 'Maintained 100% punctuality and outstanding attendance throughout the entire month'
  }
];

export interface ExamTermMeta {
  id: 'Half Yearly' | 'Annual';
  title: string;
  titleMalayalam: string;
  description: string;
}

export const EXAM_TERMS: ExamTermMeta[] = [
  {
    id: 'Half Yearly',
    title: 'Half Yearly Examination',
    titleMalayalam: 'അർദ്ധവാർഷിക പരീക്ഷ',
    description: 'Mid-year comprehensive academic evaluation'
  },
  {
    id: 'Annual',
    title: 'Annual Examination',
    titleMalayalam: 'വാർഷിക പരീക്ഷ',
    description: 'Final academic year comprehensive evaluation'
  }
];
