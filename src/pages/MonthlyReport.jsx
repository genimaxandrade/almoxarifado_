import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileBarChart, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';

export default function MonthlyReport() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements-all'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  const [hasSearched, setHasSearched] = useState(false);

  const monthMovements = useMemo(() => {
    if (!hasSearched) return [];
    return movements.filter(m => m.movement_type === 'saida' && m.date?.slice(0, 7) === selectedMonth);
  }, [movements, selectedMonth, hasSearched]);

  const byItem = useMemo(() => {
    const map = {};
    monthMovements.forEach(m => {
      if (!map[m.item_code]) {
        map[m.item_code] = { code: m.item_code, name: m.item_name, total: 0, count: 0 };
      }
      map[m.item_code].total += m.quantity || 0;
      map[m.item_code].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [monthMovements]);

  const byRequester = useMemo(() => {
    const map = {};
    monthMovements.forEach(m => {
      const key = m.destination || 'Não informado';
      if (!map[key]) map[key] = { name: key, total: 0, count: 0 };
      map[key].total += m.quantity || 0;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [monthMovements]);

  const totalQty = monthMovements.reduce((acc, m) => acc + (m.quantity || 0), 0);

  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }

  return (
    <div>
      <PageHeader icon={FileBarChart} title="Relatório Mensal" description="Análise de saídas por mês" />

      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedMonth}
          onChange={e => { setSelectedMonth(e.target.value); setHasSearched(false); }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <button
          onClick={() => setHasSearched(true)}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Buscar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total de saídas</p>
          <p className="text-2xl font-bold">{monthMovements.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Itens retirados</p>
          <p className="text-2xl font-bold">{totalQty}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Itens distintos</p>
          <p className="text-2xl font-bold">{byItem.length}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : !hasSearched ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <FileBarChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Selecione o mês e clique em <strong>Buscar</strong> para ver o relatório.</p>
        </CardContent></Card>
      ) : monthMovements.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma saída registrada neste mês.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top itens */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Itens Mais Retirados</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {byItem.slice(0, 15).map((item, i) => (
                  <div key={item.code} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code} · {item.count} saída{item.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">{item.total} un</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por requisitante */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Por Requisitante</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {byRequester.map(r => (
                  <div key={r.name} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.count} retirada{r.count !== 1 ? 's' : ''}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2">{r.total} un</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}