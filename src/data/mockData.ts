import { Exam, ScanResult } from '../types';

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-01',
    title: 'Penilaian Tengah Semester (PTS)',
    subject: 'Umum / Semua Mapel',
    schoolName: 'SMPN 2 Kemranjen',
    totalQuestions: 20,
    optionCount: 5,
    answerKey: {
      1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'E',
      6: 'A', 7: 'B', 8: 'C', 9: 'E', 10: 'D',
      11: 'B', 12: 'A', 13: 'C', 14: 'D', 15: 'E',
      16: 'A', 17: 'B', 18: 'C', 19: 'D', 20: 'E'
    },
    passingScore: 75,
    pointsPerCorrect: 5,
    penaltyPerWrong: 0,
    createdAt: '2026-07-20T08:00:00.000Z'
  },
  {
    id: 'exam-02',
    title: 'Try Out Ujian Sekolah Bahasa Indonesia',
    subject: 'Bahasa Indonesia',
    schoolName: 'SMPN 2 Kemranjen',
    totalQuestions: 10,
    optionCount: 4,
    answerKey: {
      1: 'B', 2: 'A', 3: 'D', 4: 'C', 5: 'A',
      6: 'C', 7: 'B', 8: 'D', 9: 'A', 10: 'C'
    },
    passingScore: 70,
    pointsPerCorrect: 10,
    penaltyPerWrong: 0,
    createdAt: '2026-07-22T09:30:00.000Z'
  }
];

export const INITIAL_SCAN_RESULTS: ScanResult[] = [
  {
    id: 'scan-01',
    examId: 'exam-01',
    studentName: 'Ahmad Rizky Pratama',
    studentId: '1029384751',
    className: 'XII MIPA 1',
    examDate: '2026-07-24',
    answers: {
      1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'E',
      6: 'A', 7: 'B', 8: 'C', 9: 'E', 10: 'D',
      11: 'B', 12: 'A', 13: 'C', 14: 'D', 15: 'E',
      16: 'A', 17: 'B', 18: 'C', 19: 'A', 20: 'E' // 19 wrong
    },
    totalCorrect: 19,
    totalWrong: 1,
    totalBlank: 0,
    totalMultiple: 0,
    score: 95,
    maxScore: 100,
    isPassed: true,
    scanTimestamp: '2026-07-24T09:15:00.000Z',
    confidence: 98,
    notes: 'Kualitas pengisian sangat jelas.'
  },
  {
    id: 'scan-02',
    examId: 'exam-01',
    studentName: 'Siti Nurhaliza',
    studentId: '1029384752',
    className: 'XII MIPA 1',
    examDate: '2026-07-24',
    answers: {
      1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'A', // 5 wrong
      6: 'A', 7: 'C', 8: 'C', 9: 'E', 10: 'D', // 7 wrong
      11: 'B', 12: 'A', 13: 'C', 14: 'B', 15: 'E', // 14 wrong
      16: 'A', 17: 'B', 18: 'C', 19: 'D', 20: '' // 20 blank
    },
    totalCorrect: 16,
    totalWrong: 3,
    totalBlank: 1,
    totalMultiple: 0,
    score: 80,
    maxScore: 100,
    isPassed: true,
    scanTimestamp: '2026-07-24T09:20:00.000Z',
    confidence: 96,
    notes: 'Soal nomor 20 tidak diisi.'
  },
  {
    id: 'scan-03',
    examId: 'exam-01',
    studentName: 'Budi Santoso',
    studentId: '1029384753',
    className: 'XII MIPA 1',
    examDate: '2026-07-24',
    answers: {
      1: 'A', 2: 'B', 3: 'B', 4: 'C', 5: 'E',
      6: 'C', 7: 'B', 8: 'A', 9: 'E', 10: 'D',
      11: 'D', 12: 'A', 13: 'C', 14: 'A', 15: 'E',
      16: 'B', 17: 'B', 18: 'C', 19: 'D', 20: 'A'
    },
    totalCorrect: 12,
    totalWrong: 8,
    totalBlank: 0,
    totalMultiple: 0,
    score: 60,
    maxScore: 100,
    isPassed: false,
    scanTimestamp: '2026-07-24T09:25:00.000Z',
    confidence: 94,
    notes: 'Nilai di bawah KKM (75).'
  }
];

// Sample SVG base64 or generated sample canvas for testing LJK scans without paper
export const SAMPLE_LJK_DESCRIPTIONS = [
  {
    id: 'sample-1',
    title: 'LJK Siswa A (Lengkap & Jelas)',
    studentName: 'Ahmad Rizky Pratama',
    studentId: '1029384751',
    className: 'XII MIPA 1'
  },
  {
    id: 'sample-2',
    title: 'LJK Siswa B (Ada Soal Kosong)',
    studentName: 'Siti Nurhaliza',
    studentId: '1029384752',
    className: 'XII MIPA 1'
  }
];
