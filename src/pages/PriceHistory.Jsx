import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';

export default function PriceHistory() {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  const purchases = movements.filter(m => m.movement_type === 'entrada' && m.unit_price);
  const filtered = search
    ? purchases.filter(m => m.item_name?.toLowerCase().includes(search.toLowerCase()) || m.item_code?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const chartData = selectedItem
    ? purchases
        .filter(m => m.item_name === selectedItem)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(m => ({ date: format(new Date(m.date), 'dd/MM/yy'), preco: m.unit_price }))
    : [];

  const uniqueItems = [...new Set(purchases.map(m => m.item_name))];

  return (
    <div>
      <PageHeader icon={DollarSign} title="Histórico de Preços" description="Acompanhe a variação de custos ao longo do tempo" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Compras Realizadas</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Pesquisar item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Data</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Pesquise um item para ver o histórico</TableCell></TableRow>
                    ) : filtered.map(m => (
                      <TableRow key={m.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedItem(m.item_name)}>
                        <TableCell className="text-sm">{format(new Date(m.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium text-sm">{m.item_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.invoice_number || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.supplier || '—'}</TableCell>
                        <TableCell className="text-right text-sm">{m.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">R$ {m.unit_price?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Itens com Histórico</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {uniqueItems.map(name => (
                  <button key={name} onClick={() => setSelectedItem(name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedItem === name ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}>
                    {name}
                  </button>
                ))}
                {uniqueItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma compra registrada</p>}
              </div>
            </CardContent>
          </Card>
          {selectedItem && chartData.length > 1 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Evolução de Preço</CardTitle>
                <Badge variant="outline" className="w-fit">{selectedItem}</Badge>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`R$ ${v.toFixed(2)}`, 'Preço']} />
                    <Line type="monotone" dataKey="preco" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}