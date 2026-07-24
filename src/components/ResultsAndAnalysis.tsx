import React, { useState } from 'react';
import {
  BarChart3,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ScanResult, Exam, OptionType, ItemAnalysis } from '../types';

interface ResultsAndAnalysisProps {
  results: ScanResult[];
  activeExam: Exam;
  onDeleteResult: (resultId: string) => void;
  onClearAllResults: () => void;
}

export const ResultsAndAnalysis: React.FC<ResultsAndAnalysisProps> = ({
  results,
  activeExam,
  onDeleteResult,
  onClearAllResults,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'analysis'>('students');

  // Filter results for current active exam
  const examResults = results.filter((r) => r.examId === activeExam.id);

  // Search filter
  const filteredResults = examResults.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Class Statistics
  const totalScanned = examResults.length;
  const averageScore =
    totalScanned > 0
      ? Math.round(examResults.reduce((acc, curr) => acc + curr.score, 0) / totalScanned)
      : 0;
  const passedCount = examResults.filter((r) => r.isPassed).length;
  const passPercentage =
    totalScanned > 0 ? Math.round((passedCount / totalScanned) * 100) : 0;

  const highestScore =
    totalScanned > 0 ? Math.max(...examResults.map((r) => r.score)) : 0;
  const lowestScore =
    totalScanned > 0 ? Math.min(...examResults.map((r) => r.score)) : 0;

  // Compute Item Analysis (Analisis Butir Soal)
  const computeItemAnalysis = (): ItemAnalysis[] => {
    const analysis: ItemAnalysis[] = [];
    const optionsList: OptionType[] =
      activeExam.optionCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

    for (let q = 1; q <= activeExam.totalQuestions; q++) {
      const correctOpt = activeExam.answerKey[q] || 'A';
      let correctCount = 0;
      let wrongCount = 0;
      let blankCount = 0;
      let multipleCount = 0;

      const distractors: Record<OptionType, number> = {
        A: 0, B: 0, C: 0, D: 0, E: 0,
      };

      examResults.forEach((res) => {
        const userAns = res.answers[q] || '';
        if (userAns === 'MULTIPLE') {
          multipleCount++;
          wrongCount++;
        } else if (userAns === '') {
          blankCount++;
        } else {
          if (userAns === correctOpt) {
            correctCount++;
          } else {
            wrongCount++;
          }
          if (optionsList.includes(userAns as OptionType)) {
            distractors[userAns as OptionType] = (distractors[userAns as OptionType] || 0) + 1;
          }
        }
      });

      const difficultyPercentage =
        totalScanned > 0 ? Math.round((correctCount / totalScanned) * 100) : 0;

      analysis.push({
        questionNumber: q,
        correctAnswer: correctOpt,
        correctCount,
        wrongCount,
        blankCount,
        multipleCount,
        difficultyPercentage,
        distractors,
      });
    }

    return analysis;
  };

  const itemAnalysisData = computeItemAnalysis();

  // Export CSV Function
  const handleExportCSV = () => {
    if (examResults.length === 0) return;

    let csvContent = 'Peringkat,Nama Siswa,NIS,Kelas,Nilai,Status KKM,Jumlah Benar,Jumlah Salah,Jumlah Kosong,Tanggal Scan\n';

    // Sort by score descending
    const sorted = [...examResults].sort((a, b) => b.score - a.score);

    sorted.forEach((item, index) => {
      const statusStr = item.isPassed ? 'LULUS' : 'TIDAK LULUS';
      csvContent += `${index + 1},"${item.studentName}","${item.studentId}","${item.className}",${item.score},"${statusStr}",${item.totalCorrect},${item.totalWrong},${item.totalBlank},"${item.scanTimestamp}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Nilai_${activeExam.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Hasil & Analisis Soal
          </h2>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            {activeExam.title} ({activeExam.totalQuestions} Soal)
          </p>
        </div>

        {examResults.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={onClearAllResults}
              className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors"
              title="Hapus Semua Hasil Ujian Ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">
            Total Siswa
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-white tabular-nums">{totalScanned}</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">
            Rata-Rata Kelas
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-400 tabular-nums">{averageScore}</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">
            Kelulusan (KKM {activeExam.passingScore})
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-teal-400 tabular-nums">{passPercentage}%</span>
            <Award className="w-5 h-5 text-teal-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block">
            Nilai Min / Max
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-white tabular-nums">
              {lowestScore} / {highestScore}
            </span>
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Toggle */}
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('students')}
          className={`py-2.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'students'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Daftar Siswa ({filteredResults.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analysis')}
          className={`py-2.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeSubTab === 'analysis'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Analisis Butir Soal
        </button>
      </div>

      {/* TAB 1: Student List */}
      {activeSubTab === 'students' && (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {filteredResults.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Belum Ada Data Hasil Pindai</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Silakan buka menu &quot;Pindai LJK&quot; untuk memindai lembar jawaban siswa.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        result.isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs leading-snug">
                        {result.studentName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        NIS: {result.studentId} • {result.className}
                      </p>
                      <div className="flex items-center space-x-2 mt-1 text-[10px]">
                        <span className="text-emerald-400 font-semibold">
                          B: {result.totalCorrect}
                        </span>
                        <span className="text-rose-400 font-semibold">
                          S: {result.totalWrong}
                        </span>
                        <span className="text-slate-500">
                          K: {result.totalBlank}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span
                        className={`text-xl font-black block leading-none ${
                          result.isPassed ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {result.score}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          result.isPassed
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {result.isPassed ? 'LULUS' : 'REMIDIAL'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteResult(result.id)}
                      className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Hapus Data Siswa Ini"
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

      {/* TAB 2: Item Analysis (Analisis Butir Soal) */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-3">
          {totalScanned === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">Butuh Minimal 1 Hasil Pindai</p>
              <p className="text-xs text-slate-400">
                Pindai lembar LJK siswa terlebih dahulu untuk menghasilkan analisis tingkat kesukaran soal.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">
                  Tingkat Kesukaran Soal (Difficulty Index)
                </h3>
                <span className="text-[10px] text-slate-400">
                  Dihitung dari {totalScanned} siswa
                </span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {itemAnalysisData.map((item) => {
                  let difficultyLabel = 'Sedang';
                  let badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                  if (item.difficultyPercentage >= 75) {
                    difficultyLabel = 'Mudah';
                    badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  } else if (item.difficultyPercentage < 40) {
                    difficultyLabel = 'Sukar';
                    badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  }

                  return (
                    <div
                      key={item.questionNumber}
                      className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">
                            Soal #{item.questionNumber}
                          </span>
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            Kunci: ({item.correctAnswer})
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                          {difficultyLabel} ({item.difficultyPercentage}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.difficultyPercentage >= 75
                              ? 'bg-emerald-500'
                              : item.difficultyPercentage >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.difficultyPercentage}%` }}
                        />
                      </div>

                      {/* Breakdown Count */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>
                          Benar: <strong className="text-emerald-400">{item.correctCount}</strong>
                        </span>
                        <span>
                          Salah: <strong className="text-rose-400">{item.wrongCount}</strong>
                        </span>
                        <span>
                          Kosong: <strong className="text-slate-300">{item.blankCount}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
