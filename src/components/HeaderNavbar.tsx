import React from 'react';
import { Camera, Sparkles, BookOpen } from 'lucide-react';
import { Exam } from '../types';

interface HeaderNavbarProps {
  activeExam: Exam | null;
  exams: Exam[];
  onSelectExam: (examId: string) => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeExam,
  exams,
  onSelectExam,
}) => {
  return (
    <header id="header-navbar" className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-800 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30">
            D
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-lg tracking-tighter uppercase text-white leading-none">
                DETEKTOR <span className="text-blue-500 font-extrabold">JAWABAN</span>
              </h1>
              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-blue-500/30">
                <Sparkles className="w-2.5 h-2.5" /> OMR AI
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
              Irma Muflihah, S.Pd. • SMPN 2 Kemranjen
            </p>
          </div>
        </div>

        {/* Selected Exam Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Ujian:</span>
          </div>

          <select
            id="exam-selector-dropdown"
            value={activeExam?.id || ''}
            onChange={(e) => onSelectExam(e.target.value)}
            className="bg-slate-800 text-slate-100 text-xs font-bold uppercase tracking-tight px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[170px] sm:max-w-[220px] truncate"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.totalQuestions} Soal)
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
