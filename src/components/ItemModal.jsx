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
    ca: '',
    patrimonio: '',
    data_validade_ca: '',
    estoque_minimo: 10,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        type: editingItem.type || 'material',
        unit: editingItem.unit || 'un',
        quantity: editingItem.quantity || 0,
        ca: editingItem.ca || '',
        patrimonio: editingItem.patrimonio || '',
        data_validade_ca: editingItem.data_validade_ca || '',
        estoque_minimo: editingItem.estoque_minimo || 10,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'material',
        unit: 'un',
        quantity: 0,
        ca: '',
        patrimonio: '',
        data_validade_ca: '',
        estoque_minimo: 10,
      });
    }
    setError('');
  }, [editingItem, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validação condicional
    if (formData.type === 'epi' && !formData.ca.trim()) {
      setError('⚠️ Para EPI é obrigatório informar o número do CA (Certificado de Aprovação).');
      return;
    }

    if (formData.type === 'ferramenta' && !formData.patrimonio.trim()) {
      setError('⚠️ Para Ferramenta é obrigatório informar o número do Patrimônio.');
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
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
            <label className="text-sm font-medium text-gray-300">Tipo *</label>
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

          {/* Campo CA - obrigatório se tipo = EPI */}
          {formData.type === 'epi' && (
            <div>
              <label className="text-sm font-medium text-yellow-400">
                CA (Certificado de Aprovação) *
              </label>
              <Input
                value={formData.ca}
                onChange={(e) => setFormData({ ...formData, ca: e.target.value })}
                placeholder="Ex: 12345"
                required
                className="bg-gray-700 border-yellow-600 text-white placeholder-gray-500"
              />
              <p className="text-xs text-yellow-500 mt-1">
                Obrigatório para itens do tipo EPI
              </p>
            </div>
          )}

          {/* Campo Patrimônio - obrigatório se tipo = Ferramenta */}
          {formData.type === 'ferramenta' && (
            <div>
              <label className="text-sm font-medium text-yellow-400">
                Patrimônio *
              </label>
              <Input
                value={formData.patrimonio}
                onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                placeholder="Ex: PAT-2024-001"
                required
                className="bg-gray-700 border-yellow-600 text-white placeholder-gray-500"
              />
              <p className="text-xs text-yellow-500 mt-1">
                Obrigatório para itens do tipo Ferramenta
              </p>
            </div>
          )}

          {/* Campo Data de Validade do CA - para EPIs */}
          {formData.type === 'epi' && (
            <div>
              <label className="text-sm font-medium text-yellow-400">
                Data de Validade do CA
              </label>
              <Input
                type="date"
                value={formData.data_validade_ca}
                onChange={(e) => setFormData({ ...formData, data_validade_ca: e.target.value })}
                className="bg-gray-700 border-yellow-600 text-white"
              />
              <p className="text-xs text-yellow-500 mt-1">
                O sistema alertará quando o CA estiver próximo do vencimento
              </p>
            </div>
          )}

          {/* Campo Estoque Mínimo */}
          <div>
            <label className="text-sm font-medium text-gray-300">Estoque Mínimo</label>
            <Input
              type="number"
              value={formData.estoque_minimo}
              onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })}
              placeholder="10"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Sistema alertará quando a quantidade atingir este valor
            </p>
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

          {error && (
            <div className="p-3 rounded-md text-sm bg-yellow-900/50 text-yellow-300 border border-yellow-600">
              {error}
            </div>
          )}

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
