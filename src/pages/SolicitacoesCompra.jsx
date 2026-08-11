import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus } from 'lucide-react';

export function SolicitacoesCompra() {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('normal');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('✅ Solicitação de compra criada com sucesso!');
    setItemName('');
    setQuantity('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Solicitações de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Nome do Item</label>
              <Input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: Parafuso M6"
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
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
              <label className="text-sm font-medium text-gray-300 mb-2 block">Prioridade</label>
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
            {message && (
              <div className="p-3 rounded-md bg-green-900 text-green-300 border border-green-700 text-sm">
                {message}
              </div>
            )}
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
              <Plus className="w-4 h-4 mr-2" />
              Criar Solicitação
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
