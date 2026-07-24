import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Zap,
  Check,
  Calendar,
  Layers,
  Settings2,
} from 'lucide-react';
import { Exam, OptionType } from '../types';

interface ExamsManagerProps {
  exams: Exam[];
  activeExam: Exam | null;
  onSelectExam: (examId: string) => void;
  onCreateExam: (newExam: Exam) => void;
  onDeleteExam: (examId: string) => void;
}

export const ExamsManager: React.FC<ExamsManagerProps> = ({
  exams,
  activeExam,
  onSelectExam,
  onCreateExam,
  onDeleteExam,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form State for New Exam
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('SMPN 2 Kemranjen');
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [optionCount, setOptionCount] = useState<number>(5); // 4 or 5
  const [passingScore, setPassingScore] = useState<number>(75);
  const [pointsPerCorrect, setPointsPerCorrect] = useState<number>(5);

  const [answerKey, setAnswerKey] = useState<Record<number, OptionType>>({
    1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'E',
    6: 'A', 7: 'B', 8: 'C', 9: 'E', 10: 'D',
    11: 'B', 12: 'A', 13: 'C', 14: 'D', 15: 'E',
    16: 'A', 17: 'B', 18: 'C', 19: 'D', 20: 'E',
  });

  const optionsList: OptionType[] = optionCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  const handleKeyOptionChange = (qNum: number, option: OptionType) => {
    setAnswerKey((prev) => ({
      ...prev,
      [qNum]: option,
    }));
  };

  const handleAutoFillKey = (pattern: 'random' | 'A' | 'B' | 'C' | 'D' | 'E') => {
    const newKey: Record<number, OptionType> = {};
    for (let i = 1; i <= totalQuestions; i++) {
      if (pattern === 'random') {
        const randIndex = Math.floor(Math.random() * optionsList.length);
        newKey[i] = optionsList[randIndex];
      } else {
        newKey[i] = pattern;
      }
    }
    setAnswerKey(newKey);
  };

  const handleSubmitNewExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    // Ensure answerKey is populated for all questions
    const finalKey: Record<number, OptionType> = {};
    for (let i = 1; i <= totalQuestions; i++) {
      finalKey[i] = answerKey[i] || optionsList[0];
    }

    const newExam: Exam = {
      id: 'exam-' + Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      schoolName: schoolName.trim() || 'Sekolah/Bimbel',
      totalQuestions,
      optionCount,
      answerKey: finalKey,
      passingScore,
      pointsPerCorrect,
      penaltyPerWrong: 0,
      createdAt: new Date().toISOString(),
    };

    onCreateExam(newExam);
    setIsCreating(false);
    // Reset form
    setTitle('');
    setSubject('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            Kelola Ujian & Kunci Jawaban
          </h2>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Atur kunci jawaban & KKM untuk pemindaian LJK otomatis
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Buat Ujian</span>
        </button>
      </div>

      {/* Form: Create New Exam */}
      {isCreating && (
        <form
          onSubmit={handleSubmitNewExam}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Form Buat Ujian Baru
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Judul Ujian / PAS / UTS</label>
              <input
                type="text"
                required
                placeholder="Contoh: UTS Matematika Kelas X"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mata Pelajaran</label>
              <input
                type="text"
                required
                placeholder="Contoh: Matematika / Fisika"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nama Sekolah / Instansi</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Jumlah Soal</label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 Soal</option>
                  <option value={20}>20 Soal</option>
                  <option value={30}>30 Soal</option>
                  <option value={40}>40 Soal</option>
                  <option value={50}>50 Soal</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Jumlah Opsi</label>
                <select
                  value={optionCount}
                  onChange={(e) => setOptionCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={4}>4 Opsi (A - D)</option>
                  <option value={5}>5 Opsi (A - E)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">KKM (Nilai Kelulusan)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Poin Per Soal Benar</label>
              <input
                type="number"
                min={1}
                value={pointsPerCorrect}
                onChange={(e) => setPointsPerCorrect(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Interactive Kunci Jawaban Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 flex items-center gap-1">
                Kunci Jawaban Soal (1-{totalQuestions})
              </label>

              {/* Fast Fill Helpers */}
              <div className="flex items-center space-x-1 text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-500">Isi Cepat:</span>
                <button
                  type="button"
                  onClick={() => handleAutoFillKey('random')}
                  className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-700"
                >
                  <Zap className="w-3 h-3 inline mr-0.5" /> Acak
                </button>
                {optionsList.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAutoFillKey(opt)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] uppercase border border-slate-700 font-bold"
                  >
                    All {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-52 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: totalQuestions }, (_, idx) => {
                  const qNum = idx + 1;
                  const currentSelected = answerKey[qNum] || optionsList[0];

                  return (
                    <div
                      key={qNum}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs"
                    >
                      <span className="font-black text-slate-400 w-6">
                        {qNum < 10 ? '0' + qNum : qNum}.
                      </span>
                      <div className="flex items-center space-x-1">
                        {optionsList.map((opt) => {
                          const isSelected = currentSelected === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleKeyOptionChange(qNum, opt)}
                              className={`w-6 h-6 rounded-full border text-[11px] font-black flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/50'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Simpan & Aktifkan Ujian Ini</span>
          </button>
        </form>
      )}

      {/* List of Existing Exams */}
      <div className="space-y-3">
        {exams.map((exam) => {
          const isActive = activeExam?.id === exam.id;

          return (
            <div
              key={exam.id}
              className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
                isActive
                  ? 'border-blue-500/80 shadow-lg shadow-blue-900/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black uppercase tracking-tight text-white text-base leading-snug">
                      {exam.title}
                    </h3>
                    {isActive && (
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {exam.subject} • {exam.schoolName}
                  </p>
                </div>

                {exams.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteExam(exam.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Hapus Ujian"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                <div className="bg-slate-950 border border-slate-800/80 p-2 rounded-xl text-center">
                  <span className="block font-black text-white">{exam.totalQuestions} Soal</span>
                  <span className="text-[10px] font-bold text-slate-400">{exam.optionCount} Opsi (A-{exam.optionCount === 4 ? 'D' : 'E'})</span>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 p-2 rounded-xl text-center">
                  <span className="block font-black text-emerald-400">KKM {exam.passingScore}</span>
                  <span className="text-[10px] font-bold text-slate-400">Target lulus</span>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 p-2 rounded-xl text-center">
                  <span className="block font-black text-white">{exam.pointsPerCorrect} Poin</span>
                  <span className="text-[10px] font-bold text-slate-400">Per soal</span>
                </div>
              </div>

              {/* Activate Button */}
              {!isActive && (
                <button
                  type="button"
                  onClick={() => onSelectExam(exam.id)}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pilih & Gunakan Ujian Ini</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
