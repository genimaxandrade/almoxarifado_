import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Search, Package, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Replenishment() {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState('');
  const [invoice, setInvoice] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-name', 500),
  });

  const replenishMut = useMutation({
    mutationFn: async () => {
      const quantity = Number(qty);
      const price = unitPrice ? Number(unitPrice) : undefined;

      await base44.entities.StockMovement.create({
        item_id: selectedItem.id,
        item_code: selectedItem.code,
        item_name: selectedItem.name,
        movement_type: 'entrada',
        quantity,
        date: new Date().toISOString(),
        invoice_number: invoice,
        purchase_order: purchaseOrder,
        supplier,
        unit_price: price,
        notes,
      });

      const updateData = { quantity: selectedItem.quantity + quantity };
      if (price) updateData.last_unit_price = price;
      if (supplier) updateData.supplier = supplier;
      await base44.entities.Item.update(selectedItem.id, updateData);
    },
    onSuccess: () => {
      toast.success('Entrada registrada com sucesso!');
      qc.invalidateQueries({ queryKey: ['items'] });
      setSelectedItem(null); setQty(''); setInvoice(''); setPurchaseOrder('');
      setSupplier(''); setUnitPrice(''); setNotes(''); setSearch('');
    },
  });

  const searchResults = search.length >= 2
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reposição de Estoque</h1>
            <p className="text-sm text-slate-400">Registrar entrada de mercadorias</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" /> Buscar Item
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Digite o código ou nome do item..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedItem(null); }}
              className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>

          {searchResults.length > 0 && !selectedItem && (
            <div className="border border-slate-700 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-700/50">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setSearch(item.name); }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-sm text-white">{item.name}</span>
                    <span className="text-xs text-slate-500 ml-2">({item.code})</span>
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">{item.quantity} {item.unit}</Badge>
                </button>
              ))}
            </div>
          )}

          {selectedItem && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white text-sm">{selectedItem.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Código: {selectedItem.code}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{selectedItem.type}</Badge>
              </div>
              <div className="bg-slate-800/80 rounded-lg p-2.5 text-xs">
                <p className="text-slate-500">Estoque atual</p>
                <p className="text-white font-bold text-base mt-0.5">{selectedItem.quantity} <span className="text-xs font-normal text-slate-400">{selectedItem.unit}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" /> Dados da Entrada
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Quantidade *</Label>
              <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Valor Unitário (R$)</Label>
              <Input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
                placeholder="Opcional"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
          </div>

          {[
            { label: 'Nota Fiscal *', value: invoice, onChange: setInvoice, placeholder: 'Nº da NF' },
            { label: 'Pedido de Compra *', value: purchaseOrder, onChange: setPurchaseOrder, placeholder: 'Nº do pedido' },
            { label: 'Fornecedor', value: supplier, onChange: setSupplier, placeholder: '' },
            { label: 'Observações', value: notes, onChange: setNotes, placeholder: 'Opcional' },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-slate-300">{label}</Label>
              <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />
            </div>
          ))}

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
            disabled={!selectedItem || !qty || !invoice || !purchaseOrder || replenishMut.isPending}
            onClick={() => replenishMut.mutate()}
          >
            {replenishMut.isPending
              ? 'Registrando...'
              : <><CheckCircle2 className="w-4 h-4 mr-2" /> Registrar Entrada</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}