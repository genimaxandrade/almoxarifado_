import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardList, Search, Wrench, RotateCcw, AlertTriangle, Eye } from 'lucide-react';

export function FerramentasPorFuncionario() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [itensEmMao, setItensEmMao] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [search, setSearch] = useState('');
  const [showHistorico, setShowHistorico] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    setMessage('');
    try {
      // Buscar itens atualmente em poder do funcionário
      const { data: emMao, error } = await supabase
        .from('tool_deliveries')
        .select('*')
        .eq('employee_id', func.id)
        .eq('status', 'entregue')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItensEmMao(emMao || []);

      // Buscar histórico completo
      const { data: hist } = await supabase
        .from('tool_deliveries')
        .select('*')
        .eq('employee_id', func.id)
        .order('created_at', { ascending: false });
      setHistorico(hist || []);
    } catch (err) {
      setMessage(`❌ Erro ao carregar: ${err.message}`);
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'ferramenta': return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'epi': return 'bg-orange-900/50 text-orange-300 border-orange-700';
      default: return 'bg-blue-900/50 text-blue-300 border-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Ferramentas por Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className="p-3 rounded-md text-sm bg-red-900 text-red-300 border border-red-700">
              {message}
            </div>
          )}

          {/* Busca de funcionário */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Buscar Funcionário
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

          {/* Resultado do funcionário */}
          {isLoading && (
            <div className="text-center text-gray-400 text-sm py-4">Carregando...</div>
          )}

          {selectedFuncionario && !isLoading && (
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

              {/* Itens em poder */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-yellow-400" />
                  Itens em poder atualmente ({itensEmMao.length})
                </h3>
                {itensEmMao.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-gray-700/30 rounded-md border border-gray-700">
                    Este funcionário não tem ferramentas em poder.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itensEmMao.map(item => (
                      <div key={item.id} className="p-3 bg-gray-700 rounded-md border border-gray-600 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{item.item_name}</p>
                          <p className="text-xs text-gray-400">
                            Código: {item.item_code || '-'} • Qtd: {item.quantity} • Entregue em: {formatDate(item.created_at)}
                          </p>
                          {item.obs && <p className="text-xs text-gray-400 mt-1">Obs: {item.obs}</p>}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs border ${getTypeColor(item.item_type || item.type || 'ferramenta')}`}>
                          {(item.item_type || item.type || '').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHistorico(!showHistorico)}
                  className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showHistorico ? 'Ocultar Histórico' : 'Ver Histórico Completo'} ({historico.length} registros)
                </Button>
                {showHistorico && historico.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                    {historico.map(h => (
                      <div key={h.id} className="p-3 bg-gray-700/50 rounded-md border border-gray-600 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{h.item_name}</p>
                          <p className="text-xs text-gray-400">
                            Qtd: {h.quantity} • {formatDate(h.created_at)}
                            {h.type === 'devolucao' && h.return_date && ` • Devolvido em: ${formatDate(h.return_date)}`}
                          </p>
                          {h.return_obs && <p className="text-xs text-gray-400 mt-1">Obs devolução: {h.return_obs}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs border ${
                            h.type === 'entrega'
                              ? 'bg-green-900/50 text-green-300 border-green-700'
                              : 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
                          }`}>
                            {h.type === 'entrega' ? <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> ENTREGA</span> : <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> DEVOLUÇÃO</span>}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs border ${
                            h.status === 'entregue'
                              ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                              : h.status === 'devolvido'
                              ? 'bg-gray-600/50 text-gray-300 border-gray-500'
                              : 'bg-red-900/50 text-red-300 border-red-700'
                          }`}>
                            {h.status.toUpperCase()}
                          </span>
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
