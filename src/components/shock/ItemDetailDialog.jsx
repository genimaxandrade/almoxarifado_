import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const typeColors = {
  'EPI': 'bg-blue-100 text-blue-800',
  'Equipamento': 'bg-purple-100 text-purple-800',
  'Material de Consumo': 'bg-green-100 text-green-800',
  'Medicamento': 'bg-red-100 text-red-800',
};

export default function ItemDetailDialog({ open, onOpenChange, item }) {
  if (!item) return null;

  const fields = [
    { label: 'Código', value: item.code },
    { label: 'Nome', value: item.name },
    { label: 'Unidade', value: item.unit },
    { label: 'Quantidade em Estoque', value: item.quantity },
    { label: 'Estoque Mínimo', value: item.minimum_stock },
    { label: 'Localização', value: item.location || '—' },
    { label: 'Fornecedor', value: item.supplier || '—' },
    { label: 'Último Preço Unit.', value: item.last_unit_price ? `R$ ${item.last_unit_price.toFixed(2)}` : '—' },
    ...(item.type === 'EPI' ? [{ label: 'Nº CA', value: item.ca_number || '—' }] : []),
    ...(item.expiry_date ? [{ label: 'Validade', value: format(new Date(item.expiry_date), 'dd/MM/yyyy') }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Item
            <Badge className={typeColors[item.type] || 'bg-muted text-muted-foreground'}>{item.type}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {fields.map(f => (
            <div key={f.label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{f.label}</span>
              <span className="text-sm font-medium text-foreground">{f.value}</span>
            </div>
          ))}
          {item.description && (
            <div className="pt-2">
              <span className="text-sm text-muted-foreground">Descrição</span>
              <p className="text-sm mt-1 text-foreground">{item.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}