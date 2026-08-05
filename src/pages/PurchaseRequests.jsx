import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, AlertTriangle, Pencil, Trash2, CheckCircle, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import { toast } from 'sonner';
import { format, addDays, isPast, parseISO } from 'date-fns';

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-blue-100 text-blue-800',
  comprado: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-600',
};

const statusLabels = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  comprado: 'Comprado',
  cancelado: 'Cancelado',
};

export default function PurchaseRequests() {
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [form, setForm] = useState({});
  const [selected, setSelected] = useState(new Set()); // IDs selecionados
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['purchase_requests'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 500),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-created_date', 500),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  // Auto-populate from low stock items (apenas quando atingir o estoque MÍNIMO, não o de segurança)
  useEffect(() => {
    if (!items.length) return;
    const lowStockItems = items.filter(i => i.quantity <= (i.minimum_stock || 0) && i.minimum_stock > 0);
    const existingItemIds = new Set(requests.filter(r => r.status === 'pendente').map(r => r.item_id));
    lowStockItems.forEach(item => {
      if (!existingItemIds.has(item.id)) {
        const lastPurchase = movements
          .filter(m => m.movement_type === 'entrada' && m.item_id === item.id && m.unit_price)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        base44.entities.PurchaseRequest.create({
          item_id: item.id, item_code: item.code, item_name: item.name,
          item_type: item.type, unit: item.unit, current_quantity: item.quantity,
          minimum_stock: item.minimum_stock,
          requested_quantity: Math.max(1, (item.safety_stock || Math.ceil((item.minimum_stock || 1) * 1.2)) - item.quantity + 1),
          last_unit_price: lastPurchase?.unit_price || item.last_unit_price || null,
          supplier: lastPurchase?.supplier || item.supplier || '',
          status: 'pendente',
          expires_at: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        }).then(() => qc.invalidateQueries({ queryKey: ['purchase_requests'] }));
      }
    });
  }, [items, movements]);

  // Auto-delete expired
  useEffect(() => {
    if (!requests.length) return;
    const expired = requests.filter(r => r.expires_at && isPast(parseISO(r.expires_at)) && r.status === 'pendente');
    expired.forEach(r => {
      base44.entities.PurchaseRequest.delete(r.id).then(() => qc.invalidateQueries({ queryKey: ['purchase_requests'] }));
    });
  }, [requests]);

  // Abastecer estoque quando status = comprado
  const handleStockReplenishment = async (req) => {
    const newQty = (req.current_quantity || 0) + (req.requested_quantity || 0);
    await base44.entities.Item.update(req.item_id, { quantity: newQty, last_unit_price: req.last_unit_price || undefined });
    await base44.entities.StockMovement.create({
      item_id: req.item_id, item_code: req.item_code, item_name: req.item_name,
      movement_type: 'entrada', quantity: req.requested_quantity,
      date: new Date().toISOString(), supplier: req.supplier || '',
      unit_price: req.last_unit_price || null,
      notes: `Entrada automática via Solicitação de Compra`,
    });
    qc.invalidateQueries({ queryKey: ['items'] });
    qc.invalidateQueries({ queryKey: ['movements'] });
    toast.success(`Estoque de "${req.item_name}" atualizado! +${req.requested_quantity} unidades.`);
  };

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PurchaseRequest.update(id, data),
    onSuccess: async (_, { data, originalReq }) => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      setEditItem(null);
      toast.success('Solicitação atualizada!');
      if (data.status === 'comprado' && originalReq?.status !== 'comprado') {
        await handleStockReplenishment({ ...originalReq, ...data });
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.PurchaseRequest.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_requests'] }); setDeleteItem(null); toast.success('Solicitação removida.'); },
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.PurchaseRequest.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_requests'] }); setAddOpen(false); setSelectedItemId(''); setForm({}); toast.success('Solicitação criada!'); },
  });

  // Bulk status update
  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.size === 0) return;
    const toUpdate = activeRequests.filter(r => selected.has(r.id));
    for (const req of toUpdate) {
      await base44.entities.PurchaseRequest.update(req.id, { status: bulkStatus });
      if (bulkStatus === 'comprado' && req.status !== 'comprado') {
        await handleStockReplenishment({ ...req, status: bulkStatus });
      }
    }
    qc.invalidateQueries({ queryKey: ['purchase_requests'] });
    setSelected(new Set());
    setBulkStatus('');
    setBulkOpen(false);
    toast.success(`${toUpdate.length} solicitação(ões) atualizadas!`);
  };

  const handleAddFromStock = () => {
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;
    const lastPurchase = movements
      .filter(m => m.movement_type === 'entrada' && m.item_id === item.id && m.unit_price)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    createMut.mutate({
      item_id: item.id, item_code: item.code, item_name: item.name,
      item_type: item.type, unit: item.unit, current_quantity: item.quantity,
      minimum_stock: item.minimum_stock,
      requested_quantity: form.requested_quantity || 1,
      last_unit_price: form.last_unit_price || lastPurchase?.unit_price || item.last_unit_price || null,
      supplier: form.supplier || lastPurchase?.supplier || item.supplier || '',
      notes: form.notes || '', status: 'pendente',
      expires_at: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    });
  };

  const handleSelectItem = (id) => {
    setSelectedItemId(id);
    const item = items.find(i => i.id === id);
    if (!item) return;
    const lastPurchase = movements
      .filter(m => m.movement_type === 'entrada' && m.item_id === item.id && m.unit_price)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    setForm({
      requested_quantity: Math.max(1, (item.minimum_stock || 1) - item.quantity),
      last_unit_price: lastPurchase?.unit_price || item.last_unit_price || '',
      supplier: lastPurchase?.supplier || item.supplier || '',
      notes: '',
    });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === activeRequests.length) setSelected(new Set());
    else setSelected(new Set(activeRequests.map(r => r.id)));
  };

  const activeRequests = requests.filter(r => r.status !== 'cancelado');
  const pending = requests.filter(r => r.status === 'pendente').length;
  const approved = requests.filter(r => r.status === 'aprovado').length;

  return (
    <div>
      <PageHeader
        icon={ShoppingCart}
        title="Solicitações de Compra"
        description="Itens abaixo do estoque mínimo e solicitações manuais"
        actions={
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button variant="outline" onClick={() => setBulkOpen(true)}>
                <ChevronDown className="w-4 h-4 mr-2" />
                Alterar {selected.size} selecionados
              </Button>
            )}
            <Button onClick={() => { setAddOpen(true); setForm({}); setSelectedItemId(''); }}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Item
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard icon={ShoppingCart} label="Total de Solicitações" value={activeRequests.length} />
        <StatsCard icon={AlertTriangle} label="Pendentes" value={pending} color="text-yellow-600" bgColor="bg-yellow-100" />
        <StatsCard icon={CheckCircle} label="Aprovadas" value={approved} color="text-blue-600" bgColor="bg-blue-100" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === activeRequests.length && activeRequests.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 cursor-pointer"
                  />
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Qtd em Estoque</TableHead>
                <TableHead className="text-center">Qtd Solicitada</TableHead>
                <TableHead className="text-right">Últ. Preço</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : activeRequests.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma solicitação de compra no momento.</p>
                </TableCell></TableRow>
              ) : activeRequests.map(req => (
                <TableRow key={req.id} className={`hover:bg-muted/30 ${selected.has(req.id) ? 'bg-primary/5' : ''}`}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(req.id)}
                      onChange={() => toggleSelect(req.id)}
                      className="rounded border-gray-300 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{req.item_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{req.item_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{req.item_type || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-600 font-bold">{req.current_quantity}</span>
                    <span className="text-muted-foreground text-xs"> / {req.minimum_stock}</span>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{req.requested_quantity} {req.unit}</TableCell>
                  <TableCell className="text-right font-mono">
                    {req.last_unit_price ? `R$ ${Number(req.last_unit_price).toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{req.supplier || '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[req.status]}>{statusLabels[req.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {req.expires_at ? format(parseISO(req.expires_at), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditItem({ ...req })}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem(req)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Solicitação</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Item</Label>
                <p className="font-medium">{editItem.item_name} <span className="text-xs text-muted-foreground">({editItem.item_code})</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Qtd Solicitada</Label>
                  <Input type="number" value={editItem.requested_quantity || ''} onChange={e => setEditItem(p => ({ ...p, requested_quantity: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Último Preço (R$)</Label>
                  <Input type="number" step="0.01" value={editItem.last_unit_price || ''} onChange={e => setEditItem(p => ({ ...p, last_unit_price: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <Input value={editItem.supplier || ''} onChange={e => setEditItem(p => ({ ...p, supplier: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editItem.status} onValueChange={v => setEditItem(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="comprado">Comprado (abastece estoque)</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {editItem.status === 'comprado' && (
                  <p className="text-xs text-green-600 mt-1">✓ Ao salvar, o estoque será atualizado automaticamente.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={editItem.notes || ''} onChange={e => setEditItem(p => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => {
              const originalReq = requests.find(r => r.id === editItem.id);
              updateMut.mutate({ id: editItem.id, data: editItem, originalReq });
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Alterar {selected.size} Solicitações</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Novo Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger><SelectValue placeholder="Selecione o status..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="comprado">Comprado (abastece estoque)</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {bulkStatus === 'comprado' && (
                <p className="text-xs text-green-600">✓ O estoque de todos os itens selecionados será atualizado automaticamente.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkUpdate} disabled={!bulkStatus}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add from Stock Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Solicitação de Compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Selecionar Item do Estoque</Label>
              <Select value={selectedItemId} onValueChange={handleSelectItem}>
                <SelectTrigger><SelectValue placeholder="Escolha um item..." /></SelectTrigger>
                <SelectContent>
                  {items.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedItemId && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Qtd Solicitada</Label>
                    <Input type="number" value={form.requested_quantity || ''} onChange={e => setForm(p => ({ ...p, requested_quantity: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Último Preço (R$)</Label>
                    <Input type="number" step="0.01" value={form.last_unit_price || ''} onChange={e => setForm(p => ({ ...p, last_unit_price: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Fornecedor</Label>
                  <Input value={form.supplier || ''} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddFromStock} disabled={!selectedItemId}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover solicitação?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover a solicitação de "{deleteItem?.item_name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate(deleteItem.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}