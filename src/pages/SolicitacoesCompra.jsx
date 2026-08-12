import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

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

export function SolicitacoesCompra() {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('normal');
  const [fornecedor, setFornecedor] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [cancelReason, setCancelReason] = useState('');

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
        return r;
      });
      setRequests(updated);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

      const { error } = await supabase
        .from('purchase_requests')
        .insert([{
          item_name: itemName,
          requested_quantity: parseInt(quantity),
          priority: priority,
          fornecedor: fornecedor || null,
          status: 'pendente',
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;

      setMessage('✅ Solicitação criada! Expira automaticamente em 30 dias.');
      setItemName('');
      setQuantity('');
      setPriority('normal');
      setFornecedor('');
      await loadRequests();
      setTimeout(() => setMessage(''), 3000);
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
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Parafuso M6"
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Quantidade *</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                  min="1"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Fornecedor</label>
                <Input
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                >
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full" disabled={isLoading}>
                  {isLoading ? 'Processando...' : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Solicitação
                    </>
                  )}
                </Button>
              </div>
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
          <CardTitle className="text-white text-sm">Solicitações Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-center py-4 text-gray-500">Carregando...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhuma solicitação de compra.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const statusInfo = STATUS_FLOW[req.status] || STATUS_FLOW['pendente'];
                const daysRemaining = getDaysRemaining(req.expires_at);
                const nextStatus = NEXT_STATUS[req.status];

                return (
                  <div key={req.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{req.item_name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {req.priority !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            req.priority === 'urgente' ? 'bg-red-900 text-red-300' :
                            req.priority === 'alta' ? 'bg-orange-900 text-orange-300' :
                            'bg-gray-600 text-gray-400'
                          }`}>
                            {req.priority}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs flex gap-4">
                        <span>Qtd: {req.requested_quantity}</span>
                        {req.fornecedor && <span>Fornecedor: {req.fornecedor}</span>}
                        <span>Criada em: {new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
                        {daysRemaining !== null && req.status === 'pendente' && (
                          <span className={daysRemaining <= 7 ? 'text-yellow-400' : ''}>
                            Expira em: {daysRemaining} dias
                          </span>
                        )}
                      </div>
                      {req.cancel_reason && (
                        <p className="text-red-400 text-xs mt-1">Motivo: {req.cancel_reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
