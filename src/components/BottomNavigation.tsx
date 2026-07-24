import React from 'react';
import { Camera, FileCheck, BarChart3, Printer } from 'lucide-react';

export type TabType = 'scan' | 'exams' | 'results' | 'print';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  scannedCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  scannedCount,
}) => {
  const tabs = [
    {
      id: 'scan' as TabType,
      label: 'Pindai LJK',
      icon: Camera,
      highlight: true,
    },
    {
      id: 'exams' as TabType,
      label: 'Kelola Ujian',
      icon: FileCheck,
    },
    {
      id: 'results' as TabType,
      label: 'Hasil & Analisis',
      icon: BarChart3,
      badge: scannedCount > 0 ? scannedCount : undefined,
    },
    {
      id: 'print' as TabType,
      label: 'Cetak LJK',
      icon: Printer,
    },
  ];

  return (
    <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 text-slate-300 shadow-2xl">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-semibold'
              }`}
            >
              {/* Highlight bar for active tab */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-blue-400' : ''
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider mt-1 leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
