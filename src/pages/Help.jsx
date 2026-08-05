import React, { useState } from 'react';
import { HelpCircle, Package, ArrowDownRight, ArrowUpRight, ShoppingCart, AlertTriangle, ClipboardList, FileBarChart, BarChart3, DollarSign, PieChart, Users, Tag, HardDrive, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';

const steps = [
  {
    icon: Package,
    title: 'Controle de Estoque',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    steps: [
      'Acesse "Controle de Estoque" no menu lateral.',
      'Clique em "Novo Item" para cadastrar um produto.',
      'Preencha o código, nome, tipo, unidade, quantidade atual e estoque mínimo.',
      'O estoque de segurança é calculado automaticamente (mínimo × 1,2).',
      'Itens em laranja estão no estoque de segurança; em vermelho, abaixo do mínimo.',
      'Use o ícone de carrinho (🛒) para gerar uma solicitação de compra manual.',
      'Use "Exportar / Importar" para gerenciar itens em massa via Excel.',
    ],
  },
  {
    icon: ArrowDownRight,
    title: 'Saída de Material',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    steps: [
      'Acesse "Saída de Material" no menu lateral.',
      'Pesquise o item pelo nome ou código na barra de busca.',
      'Clique no item encontrado para selecioná-lo.',
      'Informe a quantidade retirada, o solicitante e observações (opcional).',
      'Clique em "Registrar Saída" para confirmar.',
      'O estoque é atualizado automaticamente.',
      'Se o estoque cair abaixo do nível de segurança, uma solicitação de compra é gerada automaticamente.',
    ],
  },
  {
    icon: ArrowUpRight,
    title: 'Reposição de Estoque',
    color: 'text-green-600',
    bg: 'bg-green-50',
    steps: [
      'Acesse "Reposição de Estoque" no menu lateral.',
      'Selecione o item que deseja repor.',
      'Informe a quantidade recebida, fornecedor, nota fiscal e valor unitário.',
      'Clique em "Registrar Entrada" para confirmar.',
      'O estoque é atualizado e o histórico de preços é registrado automaticamente.',
    ],
  },
  {
    icon: ShoppingCart,
    title: 'Solicitações de Compra',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    steps: [
      'Acesse "Solicitações de Compra" no menu lateral.',
      'Visualize todas as solicitações pendentes, aprovadas, compradas ou canceladas.',
      'Clique em "Aprovar", "Marcar como Comprado" ou "Cancelar" conforme o andamento.',
      'Ao marcar como "Comprado", o estoque é reposto automaticamente.',
      'Use o botão "Nova Solicitação" para criar uma solicitação manual.',
      'Solicitações expiram automaticamente após 30 dias.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Alertas',
    color: 'text-red-600',
    bg: 'bg-red-50',
    steps: [
      'Acesse "Alertas" no menu lateral.',
      'Visualize itens com estoque abaixo do mínimo ou com validade próxima.',
      'Use os alertas para priorizar reposições urgentes.',
    ],
  },
  {
    icon: ClipboardList,
    title: 'Histórico Diário',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    steps: [
      'Acesse "Histórico Diário" no menu lateral.',
      'Selecione uma data para ver todas as saídas registradas naquele dia.',
      'Visualize o total de itens retirados e por quem foram solicitados.',
      'Exporte os dados do dia em CSV se necessário.',
    ],
  },
  {
    icon: FileBarChart,
    title: 'Relatório Mensal',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    steps: [
      'Acesse "Relatório Mensal" no menu lateral.',
      'Selecione o mês desejado e clique em "Gerar Relatório".',
      'Visualize o total de saídas, itens mais retirados e solicitantes mais ativos.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Estatísticas',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    steps: [
      'Acesse "Estatísticas" no menu lateral.',
      'Defina um período (data início e data fim).',
      'Veja o ranking dos itens mais consumidos no período selecionado.',
    ],
  },
  {
    icon: DollarSign,
    title: 'Histórico de Preços',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    steps: [
      'Acesse "Histórico de Preços" no menu lateral.',
      'Pesquise um item pelo nome para ver todas as compras registradas.',
      'Clique em um item na lista lateral para ver o gráfico de evolução de preço.',
    ],
  },
  {
    icon: PieChart,
    title: 'Gráficos',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    steps: [
      'Acesse "Gráficos" no menu lateral.',
      'Visualize o top 10 de itens mais consumidos em barras.',
      'Veja a distribuição do estoque por tipo (pizza).',
      'Acompanhe a evolução mensal de saídas ao longo do tempo.',
    ],
  },
  {
    icon: Users,
    title: 'Funcionários',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    steps: [
      'Acesse "Funcionários" no menu lateral.',
      'Cadastre os colaboradores com matrícula, nome, cargo e setor.',
      'Funcionários ativos aparecem como opção ao registrar saídas de material.',
      'Desative um funcionário para removê-lo das listas sem excluí-lo.',
    ],
  },
  {
    icon: Tag,
    title: 'Etiquetas',
    color: 'text-lime-600',
    bg: 'bg-lime-50',
    steps: [
      'Acesse "Etiquetas" no menu lateral.',
      'Pesquise e selecione os itens que deseja etiquetar.',
      'Clique em "Imprimir Etiquetas" para gerar a impressão diretamente pelo navegador.',
    ],
  },
  {
    icon: HardDrive,
    title: 'Backup',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    steps: [
      'Acesse "Backup" no menu lateral.',
      'Clique em "Exportar Backup" para baixar todos os dados do sistema em JSON.',
      'Guarde o arquivo em local seguro para recuperação em caso de necessidade.',
    ],
  },
];

function StepCard({ item }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setOpen(!open)}
      >
        <CardHeader className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </div>
            {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
      </button>
      {open && (
        <CardContent className="pt-0 pb-5 px-5">
          <ol className="space-y-2">
            {item.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground">
                <span className={`shrink-0 w-5 h-5 rounded-full ${item.bg} ${item.color} flex items-center justify-center text-xs font-bold mt-0.5`}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      )}
    </Card>
  );
}

export default function Help() {
  return (
    <div>
      <PageHeader
        icon={HelpCircle}
        title="Ajuda"
        description="Passo a passo para usar todas as funcionalidades do sistema"
      />
      <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground">
        Clique em cada módulo abaixo para expandir o guia de uso.
      </div>
      <div className="space-y-3">
        {steps.map((item) => (
          <StepCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
}