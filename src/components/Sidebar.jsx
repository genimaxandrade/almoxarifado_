import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  LogOut,
  Package,
  ArrowDown,
  ArrowUp,
  ShoppingCart,
  Bell,
  Calendar,
  FileBarChart,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Tag,
  Database,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';

const menuStructure = [
  {
    section: 'ESTOQUE',
    items: [
      { id: 'controle', label: 'Controle de Estoque', icon: Package, description: 'Gerenciar itens do estoque' },
      { id: 'saida', label: 'Saída de Material', icon: ArrowDown, description: 'Registrar retirada de itens' },
      { id: 'reposicao', label: 'Reposição de Estoque', icon: ArrowUp, description: 'Atualizar quantidades' },
      { id: 'solicitacoes', label: 'Solicitações de Compra', icon: ShoppingCart, description: 'Criar pedidos de compra' },
      { id: 'alertas', label: 'Alertas', icon: Bell, description: 'Notificações do sistema' },
    ],
  },
  {
    section: 'FERRAMENTAS',
    items: [
      { id: 'entrega_ferramentas', label: 'Entrega de Ferramentas', icon: Wrench, description: 'Registrar entrega a funcionário' },
      { id: 'ferramentas_por_funcionario', label: 'Ferramentas por Funcionário', icon: ClipboardList, description: 'Ver o que cada um tem' },
      { id: 'devolucao_ferramentas', label: 'Devolução de Ferramentas', icon: RotateCcw, description: 'Registrar devoluções' },
    ],
  },
  {
    section: 'RELATÓRIOS',
    items: [
      { id: 'historico_diario', label: 'Histórico Diário', icon: Calendar, description: 'Movimentações do dia' },
      { id: 'relatorio_mensal', label: 'Relatório Mensal', icon: FileBarChart, description: 'Consolidação mensal' },
      { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3, description: 'Métricas e indicadores' },
      { id: 'historico_precos', label: 'Histórico de Preços', icon: TrendingUp, description: 'Variação de custos' },
      { id: 'graficos', label: 'Gráficos', icon: PieChart, description: 'Visualização de dados' },
    ],
  },
  {
    section: 'CONFIGURAÇÕES',
    items: [
      { id: 'funcionarios', label: 'Funcionários', icon: Users, description: 'CRUD de usuários', adminOnly: true },
      { id: 'permissoes', label: 'Permissões', icon: ShieldAlert, description: 'Gerenciar permissões', adminOnly: true },
      { id: 'etiquetas', label: 'Etiquetas', icon: Tag, description: 'Geração de códigos' },
      { id: 'backup', label: 'Backup', icon: Database, description: 'Exportação/importação' },
      { id: 'ajuda', label: 'Ajuda', icon: HelpCircle, description: 'Documentação e suporte' },
    ],
  },
];

export function Sidebar({ currentPage, onNavigate, userRole = 'user', userName, onLogout }) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (windowWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleNavigation = (itemId, isAdminOnly) => {
    if (isAdminOnly && userRole !== 'admin') {
      alert('Você não tem permissão para acessar esta funcionalidade.');
      return;
    }
    onNavigate(itemId);
    if (windowWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header da Sidebar */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isOpen && (
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <Package className="w-6 h-6" />
            <span>Almoxarifado</span>
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title={isOpen ? 'Recolher menu' : 'Expandir menu'}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {menuStructure.map((section) => (
          <div key={section.section}>
            {isOpen && (
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                {section.section}
              </h2>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const isAdminOnly = item.adminOnly;
                const isDisabled = isAdminOnly && userRole !== 'admin';

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigation(item.id, isAdminOnly)}
                      disabled={isDisabled}
                      title={isOpen ? undefined : item.label}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left relative group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : isDisabled
                          ? 'text-gray-600 cursor-not-allowed opacity-50'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && (
                        <>
                          <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-6 h-6 flex items-center justify-center px-1.5">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isOpen && !isActive && !isDisabled && (
                        <span className="hidden group-hover:block fixed bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded shadow-lg border border-gray-700 z-50 ml-2 whitespace-nowrap">
                          {item.description}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer com usuário e logout */}
      {isOpen && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Botão Mobile */}
      {windowWidth < 1024 && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg shadow-lg"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out z-40 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile */}
      {isMobileMenuOpen && (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-gray-800 border-r border-gray-700 z-40 lg:hidden shadow-2xl">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}
