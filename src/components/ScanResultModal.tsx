import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Trash2,
  User,
  Hash,
  Award,
  Sparkles,
  Edit2,
  Check,
} from 'lucide-react';
import { ScanResult, Exam, OptionType, DetectedAnswerStatus } from '../types';

interface ScanResultModalProps {
  scanResult: ScanResult;
  exam: Exam;
  onSave: (updatedResult: ScanResult) => void;
  onDiscard: () => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  scanResult,
  exam,
  onSave,
  onDiscard,
}) => {
  const [studentName, setStudentName] = useState<string>(scanResult.studentName);
  const [studentId, setStudentId] = useState<string>(scanResult.studentId);
  const [className, setClassName] = useState<string>(scanResult.className);
  const [answers, setAnswers] = useState<Record<number, DetectedAnswerStatus>>(
    scanResult.answers
  );

  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false);

  // Recalculate grading live if teacher updates any bubble answer manually
  const recalculateGrading = (newAnswers: Record<number, DetectedAnswerStatus>) => {
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalBlank = 0;
    let totalMultiple = 0;

    for (let i = 1; i <= exam.totalQuestions; i++) {
      const userAns = newAnswers[i] || '';
      const correctAns = exam.answerKey[i] || '';

      if (userAns === 'MULTIPLE') {
        totalMultiple++;
        totalWrong++;
      } else if (userAns === '') {
        totalBlank++;
      } else if (correctAns && userAns === correctAns) {
        totalCorrect++;
      } else {
        totalWrong++;
      }
    }

    const rawScore =
      totalCorrect * exam.pointsPerCorrect - totalWrong * Math.abs(exam.penaltyPerWrong);
    const maxScore = exam.totalQuestions * exam.pointsPerCorrect;
    const normalizedScore = Math.max(0, Math.round((rawScore / maxScore) * 100));
    const isPassed = normalizedScore >= exam.passingScore;

    return {
      totalCorrect,
      totalWrong,
      totalBlank,
      totalMultiple,
      score: normalizedScore,
      isPassed,
    };
  };

  const handleAnswerChange = (questionNum: number, newOption: DetectedAnswerStatus) => {
    const updatedAnswers = {
      ...answers,
      [questionNum]: newOption,
    };
    setAnswers(updatedAnswers);
  };

  const handleSaveResult = () => {
    const recalculated = recalculateGrading(answers);

    const updatedResult: ScanResult = {
      ...scanResult,
      studentName: studentName.trim() || 'Siswa',
      studentId: studentId.trim() || '1029384',
      className: className.trim() || 'XII MIPA',
      answers,
      ...recalculated,
    };

    onSave(updatedResult);
  };

  const computedStats = recalculateGrading(answers);
  const optionsList: OptionType[] =
    exam.optionCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Banner */}
        <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-black text-xs uppercase tracking-widest">Hasil Pemindaian LJK</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{exam.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                computedStats.isPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {computedStats.isPassed ? 'LULUS (KKM)' : 'TIDAK LULUS'}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Main Score Hero Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 block">
                NILAI AKHIR ESTIMATE
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span
                  className={`text-4xl font-black tabular-nums ${
                    computedStats.isPassed ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {computedStats.score}
                </span>
                <span className="text-sm font-bold text-slate-500">/ 100</span>
              </div>
            </div>

            {/* Micro Breakdown Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                <span className="block font-black text-emerald-400 tabular-nums">{computedStats.totalCorrect}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Benar</span>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl">
                <span className="block font-black text-rose-400 tabular-nums">{computedStats.totalWrong}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Salah</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-xl">
                <span className="block font-black text-slate-300 tabular-nums">{computedStats.totalBlank}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Kosong</span>
              </div>
            </div>
          </div>

          {/* Student Info Card (Editable) */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> IDENTITAS SISWA
              </span>
              <button
                type="button"
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-bold uppercase tracking-wider"
              >
                <Edit2 className="w-3 h-3" /> {isEditingInfo ? 'Selesai' : 'Ubah Data'}
              </button>
            </div>

            {isEditingInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">NIS / ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Kelas</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-200 pt-0.5 gap-2">
                <div>
                  <p className="font-extrabold text-white text-sm">{studentName}</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    NIS: {studentId} • Kelas: {className}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  Akurasi: {scanResult.confidence || 95}%
                </span>
              </div>
            )}
          </div>

          {/* Answer Matrix Grid & Manual Adjustment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 flex items-center gap-1.5">
                RINCIAN JAWABAN (1-{exam.totalQuestions})
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">
                Klik opsi untuk koreksi manual
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-60 overflow-y-auto space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: exam.totalQuestions }, (_, idx) => {
                  const qNum = idx + 1;
                  const studentAns = answers[qNum] || '';
                  const correctAns = exam.answerKey[qNum] || '';
                  const isCorrect = studentAns === correctAns;
                  const isBlank = studentAns === '';
                  const isMultiple = studentAns === 'MULTIPLE';

                  return (
                    <div
                      key={qNum}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                        isCorrect
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isBlank
                          ? 'bg-slate-900/40 border-slate-800'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 font-black text-slate-400 text-right">
                          {qNum}.
                        </span>
                        <div className="flex items-center space-x-1">
                          {optionsList.map((opt) => {
                            const isSelected = studentAns === opt;
                            const isKey = correctAns === opt;

                            let btnClass = 'bg-slate-800 text-slate-400 border-slate-700';
                            if (isSelected && isCorrect) {
                              btnClass =
                                'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-sm shadow-emerald-500/50';
                            } else if (isSelected && !isCorrect) {
                              btnClass =
                                'bg-rose-500 text-white font-black border-rose-400';
                            } else if (!isSelected && isKey) {
                              btnClass =
                                'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswerChange(qNum, opt)}
                                className={`w-6 h-6 rounded-full border text-[11px] flex items-center justify-center transition-all ${btnClass}`}
                                title={`Pilih Opsi ${opt}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Indicator Icon */}
                      <div className="text-[10px] font-bold">
                        {isCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3 stroke-[3]" /> Benar
                          </span>
                        ) : isBlank ? (
                          <span className="text-slate-500">Kosong</span>
                        ) : isMultiple ? (
                          <span className="text-purple-400">Ganda</span>
                        ) : (
                          <span className="text-rose-400">Kunci: {correctAns}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDiscard}
            className="px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Abaikan</span>
          </button>

          <button
            type="button"
            onClick={handleSaveResult}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Simpan & Lanjut</span>
          </button>
        </div>
      </div>
    </div>
  );
};
