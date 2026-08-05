import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/shared/PageHeader';

const COLORS = [
  'hsl(217, 91%, 50%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)',
  'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)', 'hsl(200, 70%, 50%)',
  'hsl(120, 50%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(0, 70%, 55%)', 'hsl(260, 55%, 55%)'
];

export default function Charts() {
  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  const outputs = movements.filter(m => m.movement_type === 'saida');

  const itemTotals = {};
  outputs.forEach(m => {
    const key = m.item_name || m.item_code;
    itemTotals[key] = (itemTotals[key] || 0) + (m.quantity || 0);
  });
  const top10 = Object.entries(itemTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value }));

  const monthlyData = {};
  outputs.forEach(m => {
    const month = format(startOfMonth(new Date(m.date)), 'yyyy-MM');
    monthlyData[month] = (monthlyData[month] || 0) + (m.quantity || 0);
  });
  const lineData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
      saidas: value,
    }));

  return (
    <div>
      <PageHeader icon={PieChartIcon} title="Gráficos" description="Visualização completa dos dados do almoxarifado" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Top 10 Itens Mais Consumidos</CardTitle></CardHeader>
          <CardContent>
            {top10.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados de saída</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={top10} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução Mensal de Saídas</CardTitle></CardHeader>
          <CardContent>
            {lineData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados mensais</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="saidas" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="Saídas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}