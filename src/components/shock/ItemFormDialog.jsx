import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const itemTypes = ['EPI', 'Equipamento', 'Material de Consumo', 'Medicamento'];

const emptyForm = {
  code: '', name: '', type: '', unit: '', quantity: 0, minimum_stock: 0,
  location: '', expiry_date: '', ca_number: '', description: '', supplier: ''
};

function calcSafetyStock(minimum_stock) {
  return Math.ceil((Number(minimum_stock) || 0) * 1.2);
}

export default function ItemFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = !!item;

  useEffect(() => {
    if (item) {
      setForm({ ...emptyForm, ...item });
    } else {
      setForm(emptyForm);
    }
  }, [item, open]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const minimum_stock = Number(form.minimum_stock) || 0;
    onSave({
      ...form,
      quantity: Number(form.quantity) || 0,
      minimum_stock,
      safety_stock: calcSafetyStock(minimum_stock),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Item' : 'Novo Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input value={form.code} onChange={e => handleChange('code', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => handleChange('type', v)} required>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {itemTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Unidade *</Label>
              <Input value={form.unit} onChange={e => handleChange('unit', e.target.value)} placeholder="un, cx, pct" required />
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min="0" value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque Mín.</Label>
              <Input type="number" min="0" value={form.minimum_stock} onChange={e => handleChange('minimum_stock', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque de Segurança</Label>
              <Input
                type="number"
                value={calcSafetyStock(form.minimum_stock)}
                readOnly
                className="bg-muted/50 text-muted-foreground"
                title="Calculado automaticamente: estoque mínimo + 20%"
              />
              <p className="text-[10px] text-muted-foreground">Automático: mínimo + 20%</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Localização</Label>
              <Input value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="Prateleira, setor..." />
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Input value={form.supplier} onChange={e => handleChange('supplier', e.target.value)} />
            </div>
          </div>
          {(form.type === 'EPI' || form.type === 'Medicamento') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input type="date" value={form.expiry_date} onChange={e => handleChange('expiry_date', e.target.value)} />
              </div>
              {form.type === 'EPI' && (
                <div className="space-y-1.5">
                  <Label>Nº CA</Label>
                  <Input value={form.ca_number} onChange={e => handleChange('ca_number', e.target.value)} />
                </div>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{isEdit ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}