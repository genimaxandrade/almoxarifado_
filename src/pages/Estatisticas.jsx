import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export function Estatisticas() {
  const [stats, setStats] = useState({
    totalItens: 0,
    emEstoque: 0,
    estoqueBaixo: 0,
    critico: 0,
    rotatividade: 0,
    eficiencia: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: items, error } = await supabase
        .from('items')
        .select('quantity');

      if (error) throw error;

      const totalItens = items?.length || 0;
      const emEstoque = items?.filter(i => i.quantity > 0).length || 0;
      const estoqueBaixo = items?.filter(i => i.quantity > 0 && i.quantity <= 20).length || 0;
      const critico = items?.filter(i => i.quantity <= 5 && i.quantity > 0).length || 0;

      // Calcular taxa de rotatividade (itens com movimentação / total de itens)
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('item_id');

      const uniqueItems = new Set(movements?.map(m => m.item_id));
      const rotatividade = totalItens > 0 
        ? Math.round((uniqueItems.size / totalItens) * 100) 
        : 0;

      // Eficiência de reposição (entradas / saídas)
      const entradas = movements?.filter(m => m.movement_type === 'entrada').length || 0;
      const saidas = movements?.filter(m => m.movement_type === 'saida').length || 0;
      const eficiencia = saidas > 0 
        ? Math.round((entradas / saidas) * 100) 
        : 100;

      setStats({
        totalItens,
        emEstoque,
        estoqueBaixo,
        critico,
        rotatividade,
        eficiencia: Math.min(eficiencia, 100),
      });
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Total de Itens</p>
                <p className="text-white text-2xl font-bold">{stats.totalItens}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Em Estoque</p>
                <p className="text-white text-2xl font-bold">{stats.emEstoque}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Estoque Baixo</p>
                <p className="text-white text-2xl font-bold">{stats.estoqueBaixo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-gray-400 text-sm">Crítico</p>
                <p className="text-white text-2xl font-bold">{stats.critico}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Taxa de Rotatividade</span>
                <span className="text-white">{stats.rotatividade}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${stats.rotatividade}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Eficiência de Reposição</span>
                <span className="text-white">{stats.eficiencia}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${stats.eficiencia}%` }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
