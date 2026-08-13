import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw, Search, RotateCcw as ReturnIcon } from 'lucide-react';

export function DevolucaoFerramentas({ userEmail }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [itensEmMao, setItensEmMao] = useState([]);
  const [search, setSearch] = useState('');
  const [returnObs, setReturnObs] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    setFuncionarios(data || []);
  };

  const filteredFuncionarios = funcionarios.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.matricula?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectFuncionario = async (func) => {
    setIsLoading(true);
    setSelectedFuncionario(func);
    setSearch(func.name);
    setMessage('');
    try {
      const { data, error } = await supabase
        .from('tool_deliveries')
        .select('*')
        .eq('employee_id', func.id)
        .eq('status', 'entregue')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItensEmMao(data || []);
    } catch (err) {
      setMessage(`❌ Erro ao carregar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevolucao = async (item) => {
    setIsLoading(true);
    setMessage('');
    try {
      const now = new Date().toISOString();

      // 1. Devolver ao estoque
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('quantity')
        .eq('id', item.item_id)
        .single();
      if (itemError) throw itemError;

      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: (itemData.quantity || 0) + item.quantity })
        .eq('id', item.item_id);
      if (updateError) throw updateError;

      // 2. Marcar a entrega como devolvida
      const { error: devError } = await supabase
        .from('tool_deliveries')
        .update({
          status: 'devolvido',
          type: 'devolucao',
          return_date: now,
          return_obs: returnObs || null,
        })
        .eq('id', item.id);
      if (devError) throw devError;

      // 3. Registrar movimentação no histórico
      await supabase
        .from('stock_movements')
        .insert([{
          item_id: item.item_id,
          item_code: item.item_code,
          item_name: item.item_name,
          type: 'entrada',
          quantity: item.quantity,
          reason: `DEVOLUÇÃO pelo funcionário: ${selectedFuncionario.name}${selectedFuncionario.matricula ? ` (Matrícula: ${selectedFuncionario.matricula})` : ''}${returnObs ? ` - Obs: ${returnObs}` : ''}`,
          area_uso: selectedFuncionario.department || null,
        }]);

      setMessage(`✅ ${item.item_name} devolvido ao estoque com sucesso!`);
      setReturnObs('');
      await handleSelectFuncionario(selectedFuncionario);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Devolução de Ferramentas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('✅')
                ? 'bg-green-900 text-green-300 border border-green-700'
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Busca de funcionário */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              1. Buscar Funcionário
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="🔍 Buscar por nome ou matrícula..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value === '') {
                    setSelectedFuncionario(null);
                    setItensEmMao([]);
                  }
                }}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 pl-10"
              />
            </div>
            {search && !selectedFuncionario && filteredFuncionarios.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto bg-gray-700 rounded-md border border-gray-600">
                {filteredFuncionarios.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFuncionario(f)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 border-b border-gray-600 last:border-0 flex justify-between"
                  >
                    <span>{f.name}</span>
                    <span className="text-gray-400">
                      {f.matricula ? `Mat. ${f.matricula}` : f.department || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resultado */}
          {selectedFuncionario && (
            <>
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-md">
                <p className="text-white font-semibold">{selectedFuncionario.name}</p>
                {selectedFuncionario.matricula && (
                  <p className="text-sm text-blue-300">Matrícula: {selectedFuncionario.matricula}</p>
                )}
                {selectedFuncionario.department && (
                  <p className="text-sm text-blue-300">Setor: {selectedFuncionario.department}</p>
                )}
              </div>

              {/* Itens em poder para devolver */}
              <div>
                <h3 className="text-white font-semibold mb-3">
                  2. Itens em poder para devolução ({itensEmMao.length})
                </h3>
                {isLoading && (
                  <div className="text-center text-gray-400 text-sm py-4">Carregando...</div>
                )}
                {!isLoading && itensEmMao.length === 0 && (
                  <div className="text-center py-6 text-gray-400 bg-gray-700/30 rounded-md border border-gray-700">
                    Este funcionário não tem ferramentas em poder.
                  </div>
                )}
                {!isLoading && itensEmMao.length > 0 && (
                  <div className="space-y-2">
                    {itensEmMao.map(item => (
                      <div key={item.id} className="p-4 bg-gray-700 rounded-md border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-medium">{item.item_name}</p>
                            <p className="text-xs text-gray-400">
                              Código: {item.item_code || '-'} • Qtd: {item.quantity} • Entregue em: {formatDate(item.created_at)}
                            </p>
                            {item.obs && <p className="text-xs text-gray-400 mt-1">Obs da entrega: {item.obs}</p>}
                          </div>
                          <span className="px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300 border border-blue-700">
                            ENTREGUE
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">Observação da devolução (opcional)</label>
                            <Input
                              placeholder="Ex: Item em bom estado / Com defeito..."
                              value={returnObs}
                              onChange={(e) => setReturnObs(e.target.value)}
                              className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleDevolucao(item)}
                            disabled={isLoading}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
                          >
                            <ReturnIcon className="w-4 h-4 mr-2" />
                            Devolver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
