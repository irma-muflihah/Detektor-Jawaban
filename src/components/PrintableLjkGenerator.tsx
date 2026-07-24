import React, { useState } from 'react';
import { Printer, Download, Sparkles, FileText, Check } from 'lucide-react';
import { Exam, OptionType } from '../types';

interface PrintableLjkGeneratorProps {
  activeExam: Exam;
}

export const PrintableLjkGenerator: React.FC<PrintableLjkGeneratorProps> = ({
  activeExam,
}) => {
  const [schoolName, setSchoolName] = useState<string>(activeExam.schoolName || 'SMPN 2 Kemranjen');
  const [examTitle, setExamTitle] = useState<string>(activeExam.title || 'Lembar Jawaban Komputer');
  const [subject, setSubject] = useState<string>(activeExam.subject || 'Mata Pelajaran');
  const [totalQuestions, setTotalQuestions] = useState<number>(activeExam.totalQuestions || 20);
  const [optionCount, setOptionCount] = useState<number>(activeExam.optionCount || 5);

  const handlePrint = () => {
    window.print();
  };

  const optionsList: OptionType[] =
    optionCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  const questionsPerCol = 10;
  const totalCols = Math.ceil(totalQuestions / questionsPerCol);

  return (
    <div className="space-y-4 pb-20">
      {/* Printable CSS style overlay */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ljk-sheet, #printable-ljk-sheet * {
            visibility: visible;
          }
          #printable-ljk-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          #bottom-navigation-bar, #header-navbar, .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Control Customizer Card (Hidden on Print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-400" />
              Cetak Template Lembar LJK
            </h2>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Generate & cetak lembar jawaban fisik untuk dibagikan ke siswa
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>

        {/* Customization Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nama Sekolah / Instansi</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Judul Ujian</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mata Pelajaran</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* PAPER LJK PRINTABLE SHEET CONTAINER */}
      <div
        id="printable-ljk-sheet"
        className="bg-white text-slate-900 border-2 border-slate-900 p-6 rounded-2xl shadow-2xl max-w-2xl mx-auto font-sans relative overflow-hidden"
      >
        {/* Corner Alignment Calibration Markers (OMR Fiducials) */}
        <div className="absolute top-4 left-4 w-6 h-6 bg-black"></div>
        <div className="absolute top-4 right-4 w-6 h-6 bg-black"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-black"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 bg-black"></div>

        {/* Header Title */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 mt-2">
          <h1 className="text-xl font-black uppercase tracking-wide">
            {schoolName}
          </h1>
          <h2 className="text-base font-bold text-slate-800 uppercase mt-0.5">
            LEMBAR JAWABAN KOMPUTER (LJK)
          </h2>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            UJIAN: {examTitle.toUpperCase()} • MAPEL: {subject.toUpperCase()}
          </p>
        </div>

        {/* Student Info Filling Area */}
        <div className="border border-slate-800 p-3 rounded-lg mb-4 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-slate-800 mb-1">PETUNJUK PENGISIAN:</p>
              <ol className="list-decimal list-inside text-[11px] text-slate-700 space-y-0.5">
                <li>Gunakan pensil 2B untuk menghitamkan bulatan.</li>
                <li>Hitamkan dengan penuh pada satu opsi jawaban.</li>
                <li>Hapus sampai bersih jika ingin mengganti jawaban.</li>
              </ol>
            </div>

            <div className="border-l border-slate-300 pl-4 space-y-1 text-xs">
              <p>
                <strong>NAMA SISWA:</strong> ______________________
              </p>
              <p>
                <strong>NO. UJIAN/NIS:</strong> __________________
              </p>
              <p>
                <strong>KELAS / RUANG:</strong> _________________
              </p>
              <p>
                <strong>TANGGAL UJIAN:</strong> _________________
              </p>
            </div>
          </div>
        </div>

        {/* Multiple Choice Bubble Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4 border-t border-b border-slate-300 py-4">
          {Array.from({ length: totalCols }, (_, colIndex) => {
            const startQ = colIndex * questionsPerCol + 1;
            const endQ = Math.min((colIndex + 1) * questionsPerCol, totalQuestions);

            return (
              <div key={colIndex} className="space-y-2">
                <div className="bg-slate-200 text-slate-900 font-bold text-xs p-1.5 text-center border border-slate-400 rounded">
                  SOAL {startQ} S/D {endQ}
                </div>

                <div className="space-y-2.5">
                  {Array.from({ length: endQ - startQ + 1 }, (_, qIdx) => {
                    const qNum = startQ + qIdx;

                    return (
                      <div
                        key={qNum}
                        className="flex items-center justify-between text-xs px-1"
                      >
                        <span className="font-bold text-slate-800 w-6">
                          {qNum < 10 ? '0' + qNum : qNum}.
                        </span>

                        <div className="flex items-center space-x-3">
                          {optionsList.map((opt) => (
                            <div key={opt} className="flex items-center space-x-1">
                              <div className="w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-800">
                                {opt}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2">
          <span>Detektor Jawaban OMR Scanner v2.5 • Irma Muflihah, S.Pd. (SMPN 2 Kemranjen)</span>
          <span>Dapat Dipindai Menggunakan Smartphone Camera</span>
        </div>
      </div>
    </div>
  );
};
