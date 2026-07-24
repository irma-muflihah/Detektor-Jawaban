export type OptionType = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Exam {
  id: string;
  title: string;
  subject: string;
  schoolName: string;
  totalQuestions: number; // 10, 20, 30, 40, 50
  optionCount: number; // 4 (A-D) or 5 (A-E)
  answerKey: Record<number, OptionType>; // e.g. { 1: 'A', 2: 'C', ... }
  passingScore: number; // e.g. 75
  pointsPerCorrect: number; // e.g. 2.5 or 1
  penaltyPerWrong: number; // e.g. 0 or -0.5
  createdAt: string;
}

export type DetectedAnswerStatus = OptionType | '' | 'MULTIPLE';

export interface ScanResult {
  id: string;
  examId: string;
  studentName: string;
  studentId: string; // NIS / Nomor Ujian
  className: string;
  examDate: string;
  answers: Record<number, DetectedAnswerStatus>;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalMultiple: number;
  score: number;
  maxScore: number;
  isPassed: boolean;
  scanTimestamp: string;
  imagePreviewUrl?: string;
  confidence?: number;
  notes?: string;
}

export interface ItemAnalysis {
  questionNumber: number;
  correctAnswer: OptionType;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  multipleCount: number;
  difficultyPercentage: number; // 0 - 100%
  distractors: Record<OptionType, number>;
}

export interface LjkTemplateConfig {
  schoolName: string;
  examTitle: string;
  subject: string;
  totalQuestions: number;
  optionCount: number; // 4 or 5
  studentIdLength: number; // default 10
}
