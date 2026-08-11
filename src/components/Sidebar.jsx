import React, { useState } from 'react';
import { Menu, X, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    section: 'ESTOQUE',
    items: [
      { id: 'controle', label: 'Controle de Estoque', icon: '📦' },
      { id: 'saida', label: 'Saída de Material', icon: '⬇️', active: true },
      { id: 'reposicao', label: 'Reposição de Estoque', icon: '⬆️' },
      { id: 'solicitacoes', label: 'Solicitações de Compra', icon: '🛒' },
      { id: 'alertas', label: 'Alertas', icon: '⚠️', badge: 1 },
    ],
  },
  {
    section: 'RELATÓRIOS',
    items: [
      { id: 'historico', label: 'Histórico Diário', icon: '📅' },
      { id: 'mensal', label: 'Relatório Mensal', icon: '📊' },
      { id: 'estatisticas', label: 'Estatísticas', icon: '📈' },
      { id: 'precos', label: 'Histórico de Preços', icon: '💰' },
      { id: 'graficos', label: 'Gráficos', icon: '📉' },
    ],
  },
  {
    section: 'CONFIGURAÇÕES',
    items: [
      { id: 'funcionarios', label: 'Funcionários', icon: '👥' },
      { id: 'etiquetas', label: 'Etiquetas', icon: '🏷️' },
    ],
  },
];

export function Sidebar({ onNavigate, currentPage }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botão Toggle (Mobile) */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-0'
        } lg:w-64 lg:relative lg:z-auto`}
      >
        <div className="p-6">
          <h1 className="text-white font-bold text-lg mb-8">
            {isOpen ? '📦 Almoxarifado' : ''}
          </h1>

          {/* Menu Sections */}
          {menuItems.map((section) => (
            <div key={section.section} className="mb-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {isOpen ? section.section : ''}
              </h2>

              <nav className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      // Fechar sidebar em mobile após clicar
                      if (window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {isOpen && (
                      <>
                        <span className="flex-1 text-left text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Content Area Spacer (Desktop) */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
