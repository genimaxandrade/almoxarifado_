import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown } from 'lucide-react';

export function SaidaMaterial({ items, onItemsUpdated }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaida = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const item = items.find(i => i.id === selectedItem);
      if (!item) {
        setMessage('❌ Item não encontrado!');
        setIsLoading(false);
        return;
      }

      const newQuantity = item.quantity - parseInt(quantity);
      if (newQuantity < 0) {
        setMessage('❌ Quantidade insuficiente em estoque!');
        setIsLoading(false);
        return;
      }

      // Atualizar quantidade do item
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('id', selectedItem);

      if (updateError) throw updateError;

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert([{
          item_id: selectedItem,
          item_code: item.code,
          item_name: item.name,
          movement_type: 'saida',
          quantity: parseInt(quantity),
          reason: reason,
          date: new Date().toISOString()
        }]);

      if (movError) throw movError;

      setMessage('✅ Saída registrada com sucesso!');
      setSelectedItem('');
      setQuantity('');
      setReason('');
      
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
            <ArrowDown className="w-5 h-5" />
            Saída de Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaida} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Item</label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                required
              >
                <option value="">Selecione um item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Qtd: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Quantidade</label>
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
              <label className="text-sm font-medium text-gray-300 mb-2 block">Motivo</label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Uso em produção"
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Registrar Saída'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
