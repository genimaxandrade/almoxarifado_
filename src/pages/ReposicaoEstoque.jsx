import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, RotateCcw } from 'lucide-react';

const ENTRY_TYPES = [
  { value: 'compra', label: 'Compra' },
  { value: 'devolucao', label: 'Devolução' },
  { value: 'doacao', label: 'Doação' },
];

export function ReposicaoEstoque({ items, onItemsUpdated }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [entryType, setEntryType] = useState('compra');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [pedidoCompra, setPedidoCompra] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReposicao = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const item = items.find(i => i.id === selectedItem);
      if (!item) {
        setMessage('❌ Item não encontrado!');
        setIsLoading(false);
        return;
      }

      const qty = parseInt(quantity);
      const newQuantity = item.quantity + qty;
      const valorUnit = parseFloat(valorUnitario) || item.preco_unitario || 0;

      // Atualizar quantidade e preço unitário do item
      const { error: updateError } = await supabase
        .from('items')
        .update({ 
          quantity: newQuantity,
          preco_unitario: valorUnit > 0 ? valorUnit : item.preco_unitario,
          fornecedor: fornecedor || item.fornecedor,
        })
        .eq('id', selectedItem);

      if (updateError) throw updateError;

      // Registrar movimentação com dados adicionais
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert([{
          item_id: selectedItem,
          item_code: item.code,
          item_name: item.name,
          movement_type: 'entrada',
          quantity: qty,
          reason: `Tipo: ${ENTRY_TYPES.find(t => t.value === entryType)?.label || entryType}`,
          nota_fiscal: notaFiscal || null,
          pedido_compra: pedidoCompra || null,
          fornecedor: fornecedor || null,
          valor_unitario: valorUnit || null,
          date: new Date().toISOString()
        }]);

      if (movError) throw movError;

      setMessage('✅ Reposição registrada com sucesso!');
      setSelectedItem('');
      setQuantity('');
      setNotaFiscal('');
      setPedidoCompra('');
      setFornecedor('');
      setValorUnitario('');
      
      if (onItemsUpdated) onItemsUpdated();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ArrowUp className="w-5 h-5" />
            Reposição de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReposicao} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Item *</label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                required
              >
                <option value="">Selecione um item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name} (Qtd: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="text-sm font-medium text-gray-300 mb-1 block">Tipo de Entrada</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                >
                  {ENTRY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Valor Unitário (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Será registrado como histórico de preço</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Nota Fiscal</label>
                <Input
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                  placeholder="Ex: NF-12345"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Pedido de Compra</label>
                <Input
                  value={pedidoCompra}
                  onChange={(e) => setPedidoCompra(e.target.value)}
                  placeholder="Ex: PC-2024-001"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Fornecedor</label>
                <Input
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('✅')
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : 'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {message}
              </div>
            )}

            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white w-full" disabled={isLoading}>
              {isLoading ? 'Processando...' : (
                <>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Registrar Reposição
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
