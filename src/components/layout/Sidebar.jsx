import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package, ArrowDownRight, ArrowUpRight, BarChart3,
  DollarSign, Tag, PieChart, AlertTriangle, HardDrive, HelpCircle,
  ChevronLeft, ChevronRight, Warehouse, Users, ClipboardList, FileBarChart, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const menuGroups = [
  {
    label: 'Estoque',
    items: [
      { path: '/', label: 'Controle de Estoque', icon: Package },
      { path: '/saida', label: 'Saída de Material', icon: ArrowDownRight },
      { path: '/reposicao', label: 'Reposição de Estoque', icon: ArrowUpRight },
      { path: '/solicitacoes-compra', label: 'Solicitações de Compra', icon: ShoppingCart },
      { path: '/alertas', label: 'Alertas', icon: AlertTriangle, badge: true },
    ]
  },
  {
    label: 'Relatórios',
    items: [
      { path: '/historico-diario', label: 'Histórico Diário', icon: ClipboardList },
      { path: '/relatorio-mensal', label: 'Relatório Mensal', icon: FileBarChart },
      { path: '/estatisticas', label: 'Estatísticas', icon: BarChart3 },
      { path: '/historico-precos', label: 'Histórico de Preços', icon: DollarSign },
      { path: '/graficos', label: 'Gráficos', icon: PieChart },
    ]
  },
  {
    label: 'Configurações',
    items: [
      { path: '/funcionarios', label: 'Funcionários', icon: Users },
      { path: '/etiquetas', label: 'Etiquetas', icon: Tag },
      { path: '/backup', label: 'Backup', icon: HardDrive },
      { path: '/ajuda', label: 'Ajuda', icon: HelpCircle },
    ]
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-name', 500),
    refetchInterval: 60000,
  });

  const alertCount = items.filter(i => i.quantity <= (i.minimum_stock || 0) && i.minimum_stock > 0).length;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground z-40 transition-all duration-300 flex flex-col border-r border-sidebar-border",
      collapsed ? "w-[68px]" : "w-[260px]"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
          <Warehouse className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="tracking-tight text-white truncate font-bold text-sm">Almoxarifados.Obras</h1>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">Gestão de Almoxarifados</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/30">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const count = item.badge ? alertCount : 0;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {count > 0 && (
                      <span className={cn(
                        "rounded-full text-[10px] font-bold bg-red-500 text-white flex items-center justify-center shrink-0",
                        collapsed ? "absolute top-1.5 right-1.5 w-4 h-4" : "w-5 h-5"
                      )}>
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Recolher menu</span></>
          }
        </button>
      </div>
    </aside>
  );
}