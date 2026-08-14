import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, CheckCircle, Clock, XCircle, RefreshCw, Trash2, FileDown, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_FLOW = {
  'pendente': { label: 'Pendente', icon: Clock, color: 'bg-yellow-900 text-yellow-300' },
  'aprovada': { label: 'Aprovada', icon: CheckCircle, color: 'bg-blue-900 text-blue-300' },
  'em_processo': { label: 'Em Processo', icon: RefreshCw, color: 'bg-purple-900 text-purple-300' },
  'concluida': { label: 'Concluída', icon: CheckCircle, color: 'bg-green-900 text-green-300' },
  'cancelada': { label: 'Cancelada', icon: XCircle, color: 'bg-red-900 text-red-300' },
  'expirada': { label: 'Expirada', icon: XCircle, color: 'bg-gray-600 text-gray-400' },
};

const NEXT_STATUS = {
  'pendente': 'aprovada',
  'aprovada': 'em_processo',
  'em_processo': 'concluida',
};

const PRIORITY_LABELS = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
  emergencial: 'Emergencial',
};

export function SolicitacoesCompra({ userEmail, userName }) {
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [newFornecedor, setNewFornecedor] = useState('');
  const [pendingItems, setPendingItems] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      checkExpired();
    }, 60000); // Check a cada minuto
    return () => clearInterval(interval);
  }, []);

  const checkExpired = async () => {
    const now = new Date().toISOString();
    const expired = requests.filter(r => r.status === 'pendente' && r.expires_at && new Date(r.expires_at) < new Date(now));
    if (expired.length > 0) {
      for (const req of expired) {
        await supabase
          .from('purchase_requests')
          .update({ status: 'expirada' })
          .eq('id', req.id);
      }
      await loadRequests();
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Marcar expiradas
      const now = new Date();
      const updated = (data || []).map(r => {
        if (r.status === 'pendente' && r.expires_at && new Date(r.expires_at) < now) {
          return { ...r, status: 'expirada' };
        }
        // Garantir que item_names é um array
        let items = r.item_names;
        try {
          if (typeof items === 'string') items = JSON.parse(items || '[]');
        } catch {
          items = [];
        }
        if (!Array.isArray(items) || items.length === 0) {
          // Solicitação antiga (1 item): converter para array
          items = [{
            name: r.item_name,
            quantity: r.requested_quantity || r.quantity,
            fornecedor: r.fornecedor,
            priority: r.priority || 'normal',
          }];
        }
        return { ...r, item_names: items };
      });
      setRequests(updated);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAddPendingItem = () => {
    if (!newItemName.trim()) {
      setMessage('❌ Informe o nome do item.');
      return;
    }
    const qty = parseInt(newQuantity);
    if (!qty || qty < 1) {
      setMessage('❌ Informe a quantidade (mínimo 1).');
      return;
    }
    setPendingItems(prev => [...prev, {
      name: newItemName.trim(),
      quantity: qty,
      priority: newPriority,
      fornecedor: newFornecedor.trim() || null,
    }]);
    setNewItemName('');
    setNewQuantity('');
    setNewPriority('normal');
    setNewFornecedor('');
    setMessage('');
  };

  const handleRemovePendingItem = (index) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateRegistro = async () => {
    // Pega o maior número existente e soma 1
    const { data } = await supabase
      .from('purchase_requests')
      .select('registro')
      .order('created_at', { ascending: false })
      .limit(200);
    let max = 0;
    (data || []).forEach(r => {
      const m = (r.registro || '').match(/^SC-(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1]));
    });
    return 'SC-' + String(max + 1).padStart(4, '0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (pendingItems.length === 0) {
      setMessage('❌ Adicione pelo menos 1 item à solicitação antes de criar.');
      setIsLoading(false);
      return;
    }

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

      // Usar a maior prioridade entre os itens
      const priorityOrder = { emergencial: 5, urgente: 4, alta: 3, normal: 2, baixa: 1 };
      const topPriority = pendingItems.reduce((best, it) =>
        (priorityOrder[it.priority] || 2) > (priorityOrder[best] || 2) ? it.priority : best,
        'normal'
      );

      const registro = await handleGenerateRegistro();

      const { error } = await supabase
        .from('purchase_requests')
        .insert([{
          item_name: pendingItems.map(it => it.name).join(', '),
          requested_quantity: pendingItems.reduce((sum, it) => sum + it.quantity, 0),
          priority: topPriority,
          fornecedor: pendingItems.find(it => it.fornecedor)?.fornecedor || null,
          status: 'pendente',
          registro,
          item_names: pendingItems,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;

      setMessage(`✅ Solicitação criada com sucesso! Registro: ${registro}`);
      setPendingItems([]);
      await loadRequests();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: newStatus })
        .eq('id', requestId);
      if (error) throw error;
      await loadRequests();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const handleCancel = async (requestId) => {
    const reason = prompt('Justificativa do cancelamento:');
    if (reason === null) return;

    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'cancelada', cancel_reason: reason })
        .eq('id', requestId);
      if (error) throw error;
      await loadRequests();
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    }
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleExportPDF = (req) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('SOLICITAÇÃO DE COMPRA', pageWidth / 2, 13, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Registro: ${req.registro || 'N/A'}`, pageWidth / 2, 21, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Emitida em: ${new Date(req.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, pageWidth / 2, 27, { align: 'center' });

    // Informações gerais
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const statusInfo = STATUS_FLOW[req.status] || STATUS_FLOW['pendente'];
    let y = 40;
    doc.setFont(undefined, 'bold');
    doc.text('Informações Gerais', 14, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    const infoLines = [
      `Status: ${statusInfo.label}`,
      `Prioridade geral: ${PRIORITY_LABELS[req.priority] || req.priority}`,
      req.fornecedor ? `Fornecedor principal: ${req.fornecedor}` : null,
      `Total de itens: ${(req.item_names || []).length}`,
      `Quantidade total de unidades: ${(req.item_names || []).reduce((s, it) => s + (parseInt(it.quantity) || 0), 0)}`,
      req.expires_at ? `Expira em: ${new Date(req.expires_at).toLocaleDateString('pt-BR')}` : null,
      req.cancel_reason ? `Motivo do cancelamento: ${req.cancel_reason}` : null,
    ].filter(Boolean);
    infoLines.forEach(line => {
      doc.text(line, 14, y);
      y += 5;
    });

    // Tabela de itens
    y += 4;
    doc.setFont(undefined, 'bold');
    doc.text('Itens Solicitados', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Quantidade', 'Prioridade', 'Fornecedor']],
      body: (req.item_names || []).map(it => [
        it.name,
        it.quantity,
        PRIORITY_LABELS[it.priority] || it.priority,
        it.fornecedor || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Rodapé com assinaturas
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    const signY = finalY + 20;
    doc.line(20, signY, 80, signY);
    doc.line(pageWidth - 80, signY, pageWidth - 20, signY);
    doc.setFontSize(9);
    doc.text('Solicitante (Almoxarifado)', 50, signY + 5, { align: 'center' });
    doc.text('Aprovação (Gerência)', pageWidth - 50, signY + 5, { align: 'center' });

    doc.save(`Solicitacao_${req.registro || 'Compra'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
  };

  const filteredRequests = requests.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const inRegistro = (r.registro || '').toLowerCase().includes(s);
    const inName = (r.item_name || '').toLowerCase().includes(s);
    const inItems = (r.item_names || []).some(it => (it.name || '').toLowerCase().includes(s));
    return inRegistro || inName || inItems;
  });

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Nova Solicitação de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-300 mb-1 block">Nome do Item *</label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Parafuso M6"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Quantidade *</label>
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Fornecedor</label>
                <Input
                  value={newFornecedor}
                  onChange={(e) => setNewFornecedor(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Prioridade do Item</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                >
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                  <option value="emergencial">Emergencial</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddPendingItem}
                  variant="outline"
                  className="w-full bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item à Lista
                </Button>
              </div>
            </div>

            {/* Lista de itens pendentes */}
            {pendingItems.length > 0 && (
              <div className="border border-gray-600 rounded-md overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200">
                  Itens desta solicitação ({pendingItems.length})
                </div>
                <div className="divide-y divide-gray-700 max-h-48 overflow-y-auto">
                  {pendingItems.map((it, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-gray-800 text-sm">
                      <div className="flex-1 text-gray-200">
                        <span className="font-medium">{it.name}</span>
                        <span className="text-gray-400 ml-3">Qtd: {it.quantity}</span>
                        {it.fornecedor && <span className="text-gray-400 ml-3">Forn.: {it.fornecedor}</span>}
                        <span className={`ml-3 px-1.5 py-0.5 rounded text-xs ${
                          it.priority === 'emergencial' ? 'bg-red-900 text-red-200' :
                          it.priority === 'urgente' ? 'bg-red-900 text-red-300' :
                          it.priority === 'alta' ? 'bg-orange-900 text-orange-300' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {PRIORITY_LABELS[it.priority]}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingItem(i)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex-1" disabled={isLoading}>
                {isLoading ? 'Processando...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Solicitação com {pendingItems.length} item(ns)
                  </>
                )}
              </Button>
            </div>
            <p className="text-gray-500 text-xs">⏰ Solicitações expiram automaticamente após 30 dias sem alteração de status.</p>
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('✅')
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : 'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center justify-between flex-wrap gap-3">
            <span>Solicitações Ativas</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="🔍 Buscar por registro ou item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 pl-10 w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-center py-4 text-gray-500">Carregando...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {requests.length === 0 ? 'Nenhuma solicitação de compra.' : 'Nenhuma solicitação encontrada com esse termo.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const statusInfo = STATUS_FLOW[req.status] || STATUS_FLOW['pendente'];
                const daysRemaining = getDaysRemaining(req.expires_at);
                const nextStatus = NEXT_STATUS[req.status];
                const itemCount = (req.item_names || []).length;
                const totalQty = (req.item_names || []).reduce((s, it) => s + (parseInt(it.quantity) || 0), 0);

                return (
                  <div key={req.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold tracking-wide">
                          {req.registro || 'S/REG'}
                        </span>
                        <span className="text-white font-medium">{req.item_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {req.priority !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            req.priority === 'emergencial' ? 'bg-red-900 text-red-200 ring-1 ring-red-500' :
                            req.priority === 'urgente' ? 'bg-red-900 text-red-300' :
                            req.priority === 'alta' ? 'bg-orange-900 text-orange-300' :
                            'bg-gray-600 text-gray-400'
                          }`}>
                            {PRIORITY_LABELS[req.priority]}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleExportPDF(req)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <FileDown className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        {nextStatus && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(req.id, nextStatus)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            → {STATUS_FLOW[nextStatus]?.label}
                          </Button>
                        )}
                        {['pendente', 'aprovada', 'em_processo'].includes(req.status) && (
                          <Button
                            size="sm"
                            onClick={() => handleCancel(req.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs flex flex-wrap gap-x-4 gap-y-1">
                      <span>Itens: {itemCount} ({totalQty} unidades no total)</span>
                      {req.fornecedor && <span>Fornecedor: {req.fornecedor}</span>}
                      <span>Criada em: {new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
                      {daysRemaining !== null && req.status === 'pendente' && (
                        <span className={daysRemaining <= 7 ? 'text-yellow-400' : ''}>
                          Expira em: {daysRemaining} dias
                        </span>
                      )}
                    </div>
                    {itemCount > 1 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        {(req.item_names || []).map((it, i) => (
                          <div key={i} className="text-gray-400 text-xs py-0.5">
                            • {it.name} — Qtd: {it.quantity}
                            {it.priority !== 'normal' && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                it.priority === 'emergencial' ? 'bg-red-900 text-red-200' :
                                it.priority === 'urgente' ? 'bg-red-900 text-red-300' :
                                it.priority === 'alta' ? 'bg-orange-900 text-orange-300' :
                                'bg-gray-600 text-gray-400'
                              }`}>
                                {PRIORITY_LABELS[it.priority]}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {req.cancel_reason && (
                      <p className="text-red-400 text-xs mt-2">Motivo: {req.cancel_reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
