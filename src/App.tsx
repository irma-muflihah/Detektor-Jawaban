import React, { useState, useEffect } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { ScannerModule } from './components/ScannerModule';
import { ScanResultModal } from './components/ScanResultModal';
import { ExamsManager } from './components/ExamsManager';
import { ResultsAndAnalysis } from './components/ResultsAndAnalysis';
import { PrintableLjkGenerator } from './components/PrintableLjkGenerator';
import { Exam, ScanResult } from './types';
import { INITIAL_EXAMS, INITIAL_SCAN_RESULTS } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scan');

  // Load saved exams from localStorage or default mock
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = localStorage.getItem('eljeka_exams');
      return saved ? JSON.parse(saved) : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  });

  const [activeExamId, setActiveExamId] = useState<string>(() => {
    return exams[0]?.id || 'exam-01';
  });

  // Load saved scan results from localStorage or default mock
  const [scanResults, setScanResults] = useState<ScanResult[]>(() => {
    try {
      const saved = localStorage.getItem('eljeka_results');
      return saved ? JSON.parse(saved) : INITIAL_SCAN_RESULTS;
    } catch {
      return INITIAL_SCAN_RESULTS;
    }
  });

  // Active Scan Result Modal state
  const [pendingScanResult, setPendingScanResult] = useState<ScanResult | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('eljeka_exams', JSON.stringify(exams));
    } catch (err) {
      console.warn('Failed to save exams to localStorage', err);
    }
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem('eljeka_results', JSON.stringify(scanResults));
    } catch (err) {
      console.warn('Failed to save scan results to localStorage', err);
    }
  }, [scanResults]);

  const activeExam = exams.find((e) => e.id === activeExamId) || exams[0];

  // Handle Scan Completed
  const handleScanComplete = (result: ScanResult) => {
    setPendingScanResult(result);
  };

  // Save Scan Result from Modal
  const handleSaveScanResult = (savedResult: ScanResult) => {
    setScanResults((prev) => [savedResult, ...prev]);
    setPendingScanResult(null);
  };

  // Discard Pending Scan
  const handleDiscardScanResult = () => {
    setPendingScanResult(null);
  };

  // Create New Exam
  const handleCreateExam = (newExam: Exam) => {
    setExams((prev) => [newExam, ...prev]);
    setActiveExamId(newExam.id);
  };

  // Delete Exam
  const handleDeleteExam = (examId: string) => {
    if (exams.length <= 1) return;
    setExams((prev) => prev.filter((e) => e.id !== examId));
    if (activeExamId === examId) {
      const remaining = exams.filter((e) => e.id !== examId);
      setActiveExamId(remaining[0]?.id || '');
    }
  };

  // Delete Individual Result
  const handleDeleteResult = (resultId: string) => {
    setScanResults((prev) => prev.filter((r) => r.id !== resultId));
  };

  // Clear All Results for Active Exam
  const handleClearAllResults = () => {
    if (window.confirm(`Hapus semua hasil pindai untuk "${activeExam?.title}"?`)) {
      setScanResults((prev) => prev.filter((r) => r.examId !== activeExamId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top App Header */}
      <HeaderNavbar
        activeExam={activeExam}
        exams={exams}
        onSelectExam={(id) => setActiveExamId(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4">
        {activeTab === 'scan' && (
          <ScannerModule
            activeExam={activeExam}
            onScanComplete={handleScanComplete}
          />
        )}

        {activeTab === 'exams' && (
          <ExamsManager
            exams={exams}
            activeExam={activeExam}
            onSelectExam={(id) => setActiveExamId(id)}
            onCreateExam={handleCreateExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {activeTab === 'results' && (
          <ResultsAndAnalysis
            results={scanResults}
            activeExam={activeExam}
            onDeleteResult={handleDeleteResult}
            onClearAllResults={handleClearAllResults}
          />
        )}

        {activeTab === 'print' && (
          <PrintableLjkGenerator activeExam={activeExam} />
        )}

        {/* Developer Attribution Footer */}
        <footer className="mt-8 mb-4 text-center text-[11px] text-slate-500 font-medium no-print">
          <p>
            <strong className="text-slate-400">Detektor Jawaban OMR</strong> • Dikembangkan oleh{' '}
            <span className="text-blue-400 font-bold">Irma Muflihah, S.Pd.</span> (Guru Matematika SMPN 2 Kemranjen)
          </p>
        </footer>
      </main>

      {/* Modal / Drawer for Scanned Result Inspection & Correction */}
      {pendingScanResult && activeExam && (
        <ScanResultModal
          scanResult={pendingScanResult}
          exam={activeExam}
          onSave={handleSaveScanResult}
          onDiscard={handleDiscardScanResult}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        scannedCount={
          scanResults.filter((r) => r.examId === activeExam?.id).length
        }
      />
    </div>
  );
}
