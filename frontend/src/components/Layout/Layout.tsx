import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay для мобилок */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar - фиксированный на всю высоту и на всю высоту страницы */}
        <div className={`
          fixed lg:sticky lg:top-0 lg:h-screen
          z-50
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300
          h-full
        `}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        
        {/* Основной контент */}
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <Header>
            <button 
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </Header>
          
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
          
          <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex flex-col lg:flex-row items-center justify-between text-sm text-gray-600 gap-2">
              <div className="text-center lg:text-left">
                <span className="font-medium">Док-План</span> • Система планирования ремонтов судов
              </div>
              <div className="text-center lg:text-right">
                Версия 1.0.0 • © {new Date().getFullYear()}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}