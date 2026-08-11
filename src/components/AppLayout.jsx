import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';

export function AppLayout({ children, onLogout, userName }) {
  const [currentPage, setCurrentPage] = useState('estoque');

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    // Aqui você pode adicionar lógica para renderizar diferentes páginas
    console.log('Navegando para:', pageId);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar onNavigate={handleNavigate} currentPage={currentPage} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-white text-xl font-semibold">Bem-vindo, {userName}</h2>
          </div>
          <Button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sair
          </Button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
