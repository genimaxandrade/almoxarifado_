import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { Tag, Printer, Search, Users, Package, X } from 'lucide-react';

const PREFIX_FUNCIONARIO = 'FUNC:';
const PREFIX_MATERIAL = 'MAT:';

export function EtiquetasQrCode() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('funcionarios');
  const [search, setSearch] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [etiquetasProntas, setEtiquetasProntas] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [resFunc, resMat] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('items').select('*').order('name'),
    ]);
    setFuncionarios(resFunc.data || []);
    setMateriais(resMat.data || []);
  };

  const toggleSelecionar = (tipo, id) => {
    const chave = `${tipo}:${id}`;
    setSelecionados(prev =>
      prev.includes(chave) ? prev.filter(c => c !== chave) : [...prev, chave]
    );
  };

  const gerarEtiquetas = () => {
    const etiquetas = [];

    if (abaAtiva === 'funcionarios') {
      const funcsSelecionados = funcionarios.filter(f => selecionados.includes(`funcionarios:${f.id}`));
      funcsSelecionados.forEach(f => {
        etiquetas.push({
          tipo: 'funcionario',
          codigo: f.matricula || f.name.replace(/\s+/g, '_').toUpperCase(),
          texto: `${f.name}${f.matricula ? ` (Matrícula: ${f.matricula})` : ''}`,
          qrValue: `${PREFIX_FUNCIONARIO}${f.matricula || f.name.replace(/\s+/g, '_').toUpperCase()}`,
        });
      });
    } else {
      const matsSelecionados = materiais.filter(m => selecionados.includes(`materiais:${m.id}`));
      matsSelecionados.forEach(m => {
        etiquetas.push({
          tipo: 'material',
          codigo: m.code,
          texto: `${m.code} - ${m.name}`,
          qrValue: `${PREFIX_MATERIAL}${m.code}`,
        });
      });
    }

    if (etiquetas.length === 0) {
      setMessage('⚠️ Selecione pelo menos um item para gerar etiquetas.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setEtiquetasProntas(etiquetas);
    setSelecionados([]);
  };

  const selecionarTodos = () => {
    const ids = filtrados.map(item => `${abaAtiva}:${item.id}`);
    setSelecionados(ids);
  };

  const desmarcarTodos = () => setSelecionados([]);

  const filtrados = abaAtiva === 'funcionarios'
    ? funcionarios.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.matricula?.toLowerCase().includes(search.toLowerCase())
      )
    : materiais.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase())
      );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Etiquetas para impressão - visível apenas na impressão */}
      {etiquetasProntas.length > 0 && (
        <div className="print:block hidden">
          <div className="bg-white p-8">
            <div className="grid grid-cols-3 gap-6">
              {etiquetasProntas.map((et, i) => (
                <div key={i} className="border-2 border-black p-4 flex flex-col items-center justify-center min-h-40">
                  <QRCodeSVG
                    value={et.qrValue}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                  <p className="text-xs font-bold mt-2 text-center break-all">
                    {et.tipo === 'funcionario' ? 'FUNCIONÁRIO' : 'MATERIAL'}
                  </p>
                  <p className="text-[10px] text-center mt-1 break-words max-w-32">
                    {et.texto}
                  </p>
                  <p className="text-[9px] font-mono mt-1">{et.qrValue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interface Normal */}
      <div className="print:hidden">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Etiquetas QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <div className="p-3 rounded-md text-sm bg-red-900 text-red-300 border border-red-700">
                {message}
              </div>
            )}

            {/* Abas */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => { setAbaAtiva('funcionarios'); setSearch(''); }}
                className={`flex-1 ${abaAtiva === 'funcionarios' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              >
                <Users className="w-4 h-4 mr-2" />
                Funcionários
              </Button>
              <Button
                type="button"
                onClick={() => { setAbaAtiva('materiais'); setSearch(''); }}
                className={`flex-1 ${abaAtiva === 'materiais' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              >
                <Package className="w-4 h-4 mr-2" />
                Materiais
              </Button>
            </div>

            {/* Busca + Seleção em massa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder={`🔍 Buscar ${abaAtiva === 'funcionarios' ? 'por nome ou matrícula...' : 'por nome ou código...'}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={selecionarTodos}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm"
              >
                ✔️ Selecionar Todos ({filtrados.length})
              </Button>
              <Button
                type="button"
                onClick={desmarcarTodos}
                variant="outline"
                className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 text-sm"
              >
                ✖ Desmarcar Todos
              </Button>
            </div>

            {/* Seleção múltipla */}
            <div className="max-h-96 overflow-y-auto space-y-1">
              {filtrados.map(item => {
                const chave = `${abaAtiva}:${item.id}`;
                const selecionado = selecionados.includes(chave);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelecionar(abaAtiva, item.id)}
                    className={`w-full px-3 py-2.5 text-left text-sm rounded-md border flex items-center justify-between ${
                      selecionado
                        ? 'bg-blue-900/50 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    <span>
                      {abaAtiva === 'funcionarios'
                        ? `${item.name}${item.matricula ? ` (Mat. ${item.matricula})` : ''} - ${item.department || 'Sem setor'}`
                        : `${item.code} - ${item.name} (Qtd: ${item.quantity})`
                      }
                    </span>
                    <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                      selecionado ? 'bg-blue-500 border-blue-400 text-white' : 'border-gray-500 text-gray-500'
                    }`}>
                      {selecionado ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
              {filtrados.length === 0 && (
                <div className="text-center py-6 text-gray-400">Nenhum item encontrado.</div>
              )}
            </div>

            <p className="text-sm text-blue-300">
              {selecionados.length > 0
                ? `${selecionados.length} item(ns) selecionado(s)`
                : 'Nenhum item selecionado. Use "Selecionar Todos" para marcar tudo de uma vez.'
              }
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={gerarEtiquetas}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Tag className="w-4 h-4 mr-2" />
                Gerar Etiquetas
              </Button>
              {selecionados.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setSelecionados([])}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Prévia das etiquetas */}
            {etiquetasProntas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-semibold">
                  Etiquetas geradas ({etiquetasProntas.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {etiquetasProntas.map((et, i) => (
                    <div key={i} className="bg-gray-700 border border-gray-600 rounded-md p-3 flex flex-col items-center">
                      <QRCodeSVG
                        value={et.qrValue}
                        size={90}
                        level="M"
                        includeMargin={false}
                        fgColor="#ffffff"
                        bgColor="transparent"
                      />
                      <p className="text-xs text-gray-300 mt-2 text-center break-all font-mono">
                        {et.qrValue}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 text-center break-words">
                        {et.texto}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handlePrint}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Etiquetas
                </Button>
              </div>
            )}

            {/* Instruções */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-md">
              <p className="text-sm text-gray-300 font-semibold mb-2">ℹ️ Como usar as etiquetas:</p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc ml-4">
                <li>Etiquetas de funcionários começam com <span className="font-mono text-yellow-400">FUNC:</span> + matrícula (ou nome)</li>
                <li>Etiquetas de materiais começam com <span className="font-mono text-yellow-400">MAT:</span> + código do item</li>
                <li>Imprima, recorte e cole nas ferramentas/EPIs e crachás</li>
                <li>No celular, use a opção "📷 Ler QR Code" nas páginas de Saída, Entrega e Devolução para preencher automaticamente</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
