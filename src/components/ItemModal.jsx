import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ItemModal({ isOpen, onOpenChange, onSave, editingItem, isLoading }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'material',
    unit: 'un',
    quantity: 0,
  });

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'material',
        unit: 'un',
        quantity: 0,
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingItem ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">Código *</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="EX001"
              required
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Nome *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do item"
              required
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
            >
              <option value="material">Material</option>
              <option value="ferramenta">Ferramenta</option>
              <option value="epi">EPI</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Unidade</label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="un"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Quantidade</label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
