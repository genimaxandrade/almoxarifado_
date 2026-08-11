import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown, Package } from 'lucide-react';

export function SaidaMaterial({ items }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const handleSaida = (e) => {
    e.preventDefault();
    setMessage('✅ Saída registrada com sucesso!');
    setTimeout(() => setMessage(''), 3000);
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
              <div className="p-3 rounded-md bg-green-900 text-green-300 border border-green-700 text-sm">
                {message}
              </div>
            )}
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
              Registrar Saída
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
