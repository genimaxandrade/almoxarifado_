import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, Search, AlertTriangle, User, ChevronDown, Package, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function MaterialOutput() {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState('');
  const [requester, setRequester] = useState('');
  const [notes, setNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ['purchase_requests'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 200),
  });

  const createPurchaseRequestMut = useMutation({
    mutationFn: (data) => base44.entities.PurchaseRequest.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_requests'] });
      toast.warning('🛒 Estoque mínimo atingido! Solicitação de compra gerada automaticamente.');
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 500),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('name', 500),
  });

  const activeEmployees = employees.filter(e => e.active !== false);

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-name', 500),
  });

  const outputMut = useMutation({
    mutationFn: async ({ item, quantity, dest, resp, obs }) => {
      if (!item || quantity <= 0) throw new Error('Dados inválidos');
      if (quantity > item.quantity) throw new Error('Quantidade insuficiente em estoque');

      await base44.entities.StockMovement.create({
        item_id: item.id,
        item_code: item.code,
        item_name: item.name,
        movement_type: 'saida',
        quantity,
        date: new Date().toISOString(),
        destination: dest,
        responsible: resp,
        notes: obs,
      });

      await base44.entities.Item.update(item.id, {
        quantity: item.quantity - quantity,
      });
    },
    onSuccess: (_, vars) => {
      toast.success('Saída registrada com sucesso!');
      const newQty = vars.item.quantity - vars.quantity;
      const item = vars.item;
      const ss = item.safety_stock || Math.ceil((item.minimum_stock || 0) * 1.2);
      const minStock = item.minimum_stock || 0;

      if (newQty <= minStock && minStock > 0) {
        // Estoque mínimo atingido — gerar solicitação de compra para ultrapassar o estoque de segurança
        const alreadyPending = purchaseRequests.find(r => r.item_id === item.id && (r.status === 'pendente' || r.status === 'aprovado'));
        if (!alreadyPending) {
          import('date-fns').then(({ format, addDays }) => {
            const lastPurchase = movements
              .filter(m => m.movement_type === 'entrada' && m.item_id === item.id && m.unit_price)
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            const requestedQty = Math.max(1, ss - newQty + 1);
            createPurchaseRequestMut.mutate({
              item_id: item.id,
              item_code: item.code,
              item_name: item.name,
              item_type: item.type,
              unit: item.unit,
              current_quantity: newQty,
              minimum_stock: item.minimum_stock,
              requested_quantity: requestedQty,
              last_unit_price: lastPurchase?.unit_price || item.last_unit_price || null,
              supplier: lastPurchase?.supplier || item.supplier || '',
              status: 'pendente',
              expires_at: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            });
          });
        }
      } else if (newQty < ss && newQty > minStock) {
        // Estoque de segurança atingido — apenas alerta
        toast.warning(`⚠️ Atenção: "${item.name}" atingiu o estoque de segurança (${newQty} ${item.unit} restantes).`);
      }

      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      setSelectedItem(null); setQty(''); setRequester(''); setNotes(''); setSearch('');
    },
    onError: (err) => {
      toast.error(err?.message || 'Erro ao registrar saída. Tente novamente.');
    },
  });

  const searchResults = search.length >= 2
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const newQtyPreview = selectedItem ? selectedItem.quantity - Number(qty || 0) : null;
  const willHitMin = newQtyPreview !== null && Number(qty) > 0 && newQtyPreview <= (selectedItem?.minimum_stock || 0);
  const willHitSafety = newQtyPreview !== null && Number(qty) > 0 && !willHitMin && newQtyPreview < (selectedItem?.safety_stock || Math.ceil((selectedItem?.minimum_stock || 0) * 1.2));

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Saída de Material</h1>
            <p className="text-sm text-slate-400">Registrar retirada de itens do estoque</p>
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
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white text-sm">{selectedItem.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Código: {selectedItem.code}</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{selectedItem.type}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/80 rounded-lg p-2.5">
                  <p className="text-slate-500">Estoque atual</p>
                  <p className="text-white font-bold text-base mt-0.5">{selectedItem.quantity} <span className="text-xs font-normal text-slate-400">{selectedItem.unit}</span></p>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-2.5">
                  <p className="text-slate-500">Estoque mínimo</p>
                  <p className="text-white font-bold text-base mt-0.5">{selectedItem.minimum_stock || 0} <span className="text-xs font-normal text-slate-400">{selectedItem.unit}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" /> Dados da Saída
          </h2>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Quantidade *</Label>
            <Input
              type="number" min="1" max={selectedItem?.quantity || 0}
              value={qty} onChange={e => setQty(e.target.value)}
              placeholder="0"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Requisitante *</Label>
            {activeEmployees.length > 0 ? (
              <div className="relative">
                <select
                  value={requester}
                  onChange={e => setRequester(e.target.value)}
                  className="w-full h-9 border border-slate-600 rounded-md px-3 pr-8 text-sm bg-slate-800 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecione o requisitante...</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}{emp.registration ? ` (${emp.registration})` : ''}{emp.sector ? ` - ${emp.sector}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            ) : (
              <Input
                value={requester} onChange={e => setRequester(e.target.value)}
                placeholder="Nome de quem está solicitando o material"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Responsável pelo registro</Label>
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-slate-700 bg-slate-800/50 text-sm text-slate-400">
              <User className="w-4 h-4 shrink-0" />
              <span>{currentUser?.full_name || currentUser?.email || 'Carregando...'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Observações</Label>
            <Input
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Opcional"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          {willHitMin && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>⚠️ Estoque ficará abaixo do mínimo — solicitação de compra será gerada automaticamente!</span>
            </div>
          )}
          {willHitSafety && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Atenção: estoque ficará abaixo do nível de segurança após esta saída.</span>
            </div>
          )}

          <Button
            className="w-full bg-orange-600 hover:bg-orange-500 text-white"
            disabled={!selectedItem || !qty || !requester || outputMut.isPending}
            onClick={() => outputMut.mutate({
              item: selectedItem,
              quantity: Number(qty),
              dest: requester,
              resp: currentUser?.full_name || currentUser?.email || '',
              obs: notes,
            })}
          >
            {outputMut.isPending
              ? 'Registrando...'
              : <><CheckCircle2 className="w-4 h-4 mr-2" /> Registrar Saída</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}