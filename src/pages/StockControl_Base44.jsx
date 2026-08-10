import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Pencil, Trash2, Eye, Upload, Download, ShoppingCart } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import ItemFormDialog from '@/components/stock/ItemFormDialog';
import ItemDetailDialog from '@/components/stock/ItemDetailDialog';
import ImportDialog from '@/components/stock/ImportDialog';
import { AlertTriangle, Boxes, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const typeColors = {
  'EPI': 'bg-blue-100 text-blue-800',
  'Equipamento': 'bg-purple-100 text-purple-800',
  'Material de Consumo': 'bg-green-100 text-green-800',
  'Medicamento': 'bg-red-100 text-red-800'
};

export default function StockControl() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ctx = useOutletContext() || {};
  const canEdit = ctx.canEdit !== false; // default true for admins

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-created_date', 500)
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000)
  });

  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ['purchase_requests'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 500)
  });

  const createRequestMut = useMutation({
    mutationFn: (data) => base44.entities.PurchaseRequest.create(data),
    onSuccess: () => {qc.invalidateQueries({ queryKey: ['purchase_requests'] });toast.success('Solicitação de compra criada!');navigate('/solicitacoes-compra');}
  });

  const handleRequestPurchase = (item) => {
    const alreadyPending = purchaseRequests.find((r) => r.item_id === item.id && r.status === 'pendente');
    if (alreadyPending) {toast.info('Já existe uma solicitação pendente para este item.');navigate('/solicitacoes-compra');return;}
    const lastPurchase = movements.
    filter((m) => m.movement_type === 'entrada' && m.item_id === item.id && m.unit_price).
    sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    import('date-fns').then(({ format, addDays }) => {
      createRequestMut.mutate({
        item_id: item.id,
        item_code: item.code,
        item_name: item.name,
        item_type: item.type,
        unit: item.unit,
        current_quantity: item.quantity,
        minimum_stock: item.minimum_stock,
        requested_quantity: Math.max(1, (item.minimum_stock || 1) - item.quantity),
        last_unit_price: lastPurchase?.unit_price || item.last_unit_price || null,
        supplier: lastPurchase?.supplier || item.supplier || '',
        status: 'pendente',
        expires_at: format(addDays(new Date(), 30), 'yyyy-MM-dd')
      });
    });
  };

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Item.create(data),
    onSuccess: () => {qc.invalidateQueries({ queryKey: ['items'] });setFormOpen(false);}
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Item.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      setFormOpen(false);
      setEditItem(null);
    }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Item.delete(id),
    onSuccess: () => {qc.invalidateQueries({ queryKey: ['items'] });setDeleteItem(null);}
  });

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || i.type === typeFilter;
    const matchLocation = !locationFilter || (i.location || '').toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchType && matchLocation;
  });

  const lowStock = items.filter((i) => i.quantity <= (i.minimum_stock || 0)).length;
  const safetyStockAlert = items.filter((i) => {
    const ss = i.safety_stock || Math.ceil((i.minimum_stock || 0) * 1.2);
    return i.quantity <= ss && i.quantity > (i.minimum_stock || 0);
  }).length;

  const handleSave = (data) => {
    if (editItem) {
      updateMut.mutate({ id: editItem.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const handleExportExcel = () => {
    import('xlsx').then(({ default: XLSX }) => {
      const data = items.map((i) => ({
        'Código': i.code,
        'Nome': i.name,
        'Tipo': i.type,
        'Unidade': i.unit,
        'Quantidade': i.quantity,
        'Estoque Mínimo': i.minimum_stock,
        'Localização': i.location || '',
        'Fornecedor': i.supplier || '',
        'CA': i.ca_number || '',
        'Validade': i.expiry_date || '',
        'Descrição': i.description || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
      XLSX.writeFile(wb, `estoque_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${items.length} itens exportados com sucesso!`);
    });
  };

  const handleImport = async (rows) => {
    setIsImporting(true);
    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      const exists = items.find((i) => i.code === row.code);
      if (exists) {skipped++;continue;}
      await base44.entities.Item.create(row);
      created++;
    }
    qc.invalidateQueries({ queryKey: ['items'] });
    setIsImporting(false);
    setImportOpen(false);
    if (skipped > 0) {
      toast.success(`${created} item(s) importado(s). ${skipped} ignorado(s) (código já existe).`);
    } else {
      toast.success(`${created} item(s) importado(s) com sucesso!`);
    }
  };

  return (
    <div>
      <PageHeader
        icon={Package}
        title="Controle de Estoque"
        description="Gerencie todos os itens do almoxarifado"
        actions={
        <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Exportar / Importar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" /> Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" /> Importar Excel
              </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit &&
          <Button onClick={() => {setEditItem(null);setFormOpen(true);}}>
                <Plus className="w-4 h-4 mr-2" />Novo Item
              </Button>
          }
          </div>
        } />
      

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard icon={Boxes} label="Total de Itens" value={items.length} />
        <StatsCard icon={ShieldCheck} label="Tipos Cadastrados" value={[...new Set(items.map((i) => i.type))].length} color="text-green-600" bgColor="bg-green-100" />
        <StatsCard icon={AlertTriangle} label="Estoque Baixo" value={lowStock} color="text-red-600" bgColor="bg-red-100" />
        {safetyStockAlert > 0 &&
        <div className="col-span-1 sm:col-span-3">
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span><strong>{safetyStockAlert} item(s)</strong> atingiram o estoque de segurança — verifique a aba Alertas.</span>
            </div>
          </div>
        }
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por código ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9" />
            
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="EPI">EPI</SelectItem>
              <SelectItem value="Equipamento">Equipamento</SelectItem>
              <SelectItem value="Material de Consumo">Material de Consumo</SelectItem>
              <SelectItem value="Medicamento">Medicamento</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filtrar por localização..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full sm:w-52"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-center">Est. Seg.</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ?
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Carregando...</TableCell></TableRow> :
              filtered.length === 0 ?
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum item encontrado</TableCell></TableRow> :
              filtered.map((item) => {
                const ss = item.safety_stock || Math.ceil((item.minimum_stock || 0) * 1.2);
                const atSafety = item.quantity <= ss && item.quantity > (item.minimum_stock || 0);
                const atMinimum = item.quantity <= (item.minimum_stock || 0);
                return (
                  <TableRow key={item.id} className={atMinimum ? 'bg-red-500/10 hover:bg-red-500/20' : atSafety ? 'bg-yellow-500/20 hover:bg-yellow-500/30' : 'hover:bg-muted/30'}>
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={typeColors[item.type]}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={atMinimum ? 'text-red-400 font-bold' : atSafety ? 'text-yellow-400 font-semibold' : ''}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-[#33ff00]">{ss}</span>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.location || '—'}</TableCell>
                    <TableCell className="text-right opacity-100">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailItem(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit &&
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setEditItem(item);setFormOpen(true);}}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        }
                        {canEdit &&
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteItem(item)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        }
                        {canEdit &&
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600" title="Solicitar compra" onClick={() => handleRequestPurchase(item)}>
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        }
                      </div>
                    </TableCell>
                  </TableRow>);

              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editItem} onSave={handleSave} />
      <ItemDetailDialog open={!!detailItem} onOpenChange={() => setDetailItem(null)} item={detailItem} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} isImporting={isImporting} />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteItem?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate(deleteItem.id)} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

}