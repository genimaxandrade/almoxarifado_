import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';

export default function Statistics() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  const outputs = (!startDate && !endDate) ? [] : movements.filter(m => {
    if (m.movement_type !== 'saida') return false;
    if (startDate && new Date(m.date) < new Date(startDate)) return false;
    if (endDate && new Date(m.date) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const itemTotals = {};
  outputs.forEach(m => {
    const key = m.item_name || m.item_code;
    itemTotals[key] = (itemTotals[key] || 0) + (m.quantity || 0);
  });
  const ranking = Object.entries(itemTotals).sort(([, a], [, b]) => b - a).slice(0, 20);
  const totalOutputQty = outputs.reduce((sum, m) => sum + (m.quantity || 0), 0);

  return (
    <div>
      <PageHeader icon={BarChart3} title="Estatísticas" description="Ranking dos itens mais consumidos" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard icon={TrendingDown} label="Total de Saídas" value={outputs.length} />
        <StatsCard icon={BarChart3} label="Itens Retirados" value={totalOutputQty} color="text-purple-600" bgColor="bg-purple-100" />
      </div>
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Filtrar por Período</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Ranking de Consumo</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qtd Total Retirada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Selecione um período para ver os dados</TableCell></TableRow>
              ) : ranking.map(([name, total], i) => (
                <TableRow key={name}>
                  <TableCell className="font-bold text-primary">{i + 1}º</TableCell>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="text-right font-mono">{total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}