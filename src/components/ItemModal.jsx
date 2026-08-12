import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ITEM_TYPES = [
  { value: 'epi', label: 'EPI', color: 'text-orange-400' },
  { value: 'equipamento', label: 'Equipamento', color: 'text-blue-400' },
  { value: 'material_consumo', label: 'Material de Consumo', color: 'text-gray-400' },
  { value: 'material_limpeza', label: 'Material de Limpeza', color: 'text-green-400' },
  { value: 'gas', label: 'Gás', color: 'text-red-400' },
  { value: 'ferramenta', label: 'Ferramenta', color: 'text-purple-400' },
];

export function ItemModal({ isOpen, onOpenChange, onSave, editingItem, isLoading }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'material_consumo',
    unit: 'un',
    quantity: 0,
    ca: '',
    patrimonio: '',
    data_validade_ca: '',
    estoque_minimo: 10,
    localizacao: '',
    fornecedor: '',
    preco_unitario: 0,
    data_validade: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        code: editingItem.code || '',
        name: editingItem.name || '',
        type: editingItem.type || 'material_consumo',
        unit: editingItem.unit || 'un',
        quantity: editingItem.quantity || 0,
        ca: editingItem.ca || '',
        patrimonio: editingItem.patrimonio || '',
        data_validade_ca: editingItem.data_validade_ca || '',
        estoque_minimo: editingItem.estoque_minimo || 10,
        localizacao: editingItem.localizacao || '',
        fornecedor: editingItem.fornecedor || '',
        preco_unitario: editingItem.preco_unitario || 0,
        data_validade: editingItem.data_validade || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'material_consumo',
        unit: 'un',
        quantity: 0,
        ca: '',
        patrimonio: '',
        data_validade_ca: '',
        estoque_minimo: 10,
        localizacao: '',
        fornecedor: '',
        preco_unitario: 0,
        data_validade: '',
      });
    }
    setError('');
  }, [editingItem, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validação condicional
    if (formData.type === 'epi' && !formData.ca.trim()) {
      setError('⚠️ Para EPI é obrigatório informar o número do CA.');
      return;
    }

    if (formData.type === 'ferramenta' && !formData.patrimonio.trim()) {
      setError('⚠️ Para Ferramenta é obrigatório informar o número do Patrimônio.');
      return;
    }

    // Calcular estoque de segurança (mínimo × 1,2)
    const estoqueSeguranca = (formData.estoque_minimo || 10) * 1.2;

    onSave({
      ...formData,
      estoque_seguranca: estoqueSeguranca,
      preco_unitario: parseFloat(formData.preco_unitario) || 0,
    });
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
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-sm font-medium text-gray-300">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
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

          {/* Campos condicionais para EPI */}
          {formData.type === 'epi' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-yellow-400">CA *</label>
                  <Input
                    value={formData.ca}
                    onChange={(e) => setFormData({ ...formData, ca: e.target.value })}
                    placeholder="Ex: 12345"
                    required
                    className="bg-gray-700 border-yellow-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Data Validade CA</label>
                  <Input
                    type="date"
                    value={formData.data_validade_ca}
                    onChange={(e) => setFormData({ ...formData, data_validade_ca: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Campo Patrimônio - obrigatório se tipo = Ferramenta */}
          {formData.type === 'ferramenta' && (
            <div>
              <label className="text-sm font-medium text-yellow-400">Patrimônio *</label>
              <Input
                value={formData.patrimonio}
                onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                placeholder="Ex: PAT-2024-001"
                required
                className="bg-gray-700 border-yellow-600 text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Estoque Mínimo</label>
              <Input
                type="number"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })}
                placeholder="10"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Segurança: {(formData.estoque_minimo * 1.2).toFixed(1)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Preço Unitário (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.preco_unitario}
                onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                placeholder="0.00"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Localização</label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                placeholder="Ex: Prateleira A-01"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Fornecedor</label>
              <Input
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                placeholder="Ex: Fornecedor XYZ"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Data de Validade (geral) */}
          <div>
            <label className="text-sm font-medium text-gray-300">Data de Validade</label>
            <Input
              type="date"
              value={formData.data_validade}
              onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
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
