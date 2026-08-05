import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DailyHistory() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements-all'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  const dayMovements = movements.filter(m => {
    if (m.movement_type !== 'saida') return false;
    return m.date?.slice(0, 10) === selectedDate;
  });

  const totalQty = dayMovements.reduce((acc, m) => acc + (m.quantity || 0), 0);

  const formattedDate = (() => {
    try {
      return format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return selectedDate;
    }
  })();

  const handleDownload = () => {
    const header = 'Item;Código;Quantidade;Requisitante;Responsável;Hora;Observações';
    const rows = dayMovements.map(m => [
      m.item_name || '',
      m.item_code || '',
      m.quantity || 0,
      m.destination || '',
      m.responsible || '',
      m.date ? new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      m.notes || '',
    ].join(';'));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-diario-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader icon={ClipboardList} title="Histórico Diário" description="Saídas de material por dia" />

      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-48" />
        </div>
        <button
          onClick={() => setSelectedDate(today)}
          className="text-xs text-primary hover:underline pb-2"
        >
          Hoje
        </button>
        {dayMovements.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleDownload} className="mb-0.5">
            <Download className="w-4 h-4 mr-1" /> Baixar CSV
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de saídas</p>
            <p className="text-2xl font-bold">{dayMovements.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Itens retirados</p>
            <p className="text-2xl font-bold">{totalQty}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm capitalize">{formattedDate}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : dayMovements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhuma saída registrada neste dia.
            </div>
          ) : (
            <div className="divide-y">
              {dayMovements.map(m => (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{m.item_name}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                      <span>Código: {m.item_code}</span>
                      {m.destination && <span>Requisitante: {m.destination}</span>}
                      {m.responsible && <span>Responsável: {m.responsible}</span>}
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground mt-0.5">Obs: {m.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="destructive" className="text-xs">-{m.quantity}</Badge>
                    <span className="text-[10px] text-muted-foreground">{m.date ? new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}