import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart, TrendingUp, TrendingDown, Package } from 'lucide-react';

export function RelatorioMensal() {
  const [stats, setStats] = useState({ entradas: 0, saidas: 0, itensAtivos: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Primeiro dia do mês atual
      const firstDay = new Date();
      firstDay.setDate(1);
      firstDay.setHours(0, 0, 0, 0);

      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('movement_type')
        .gte('date', firstDay.toISOString());

      if (error) throw error;

      const entradas = movements?.filter(m => m.movement_type === 'entrada').length || 0;
      const saidas = movements?.filter(m => m.movement_type === 'saida').length || 0;

      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id');

      if (itemsError) throw itemsError;

      setStats({
        entradas,
        saidas,
        itensAtivos: items?.length || 0,
      });
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Entradas</p>
                <p className="text-white text-2xl font-bold">{stats.entradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-gray-400 text-sm">Saídas</p>
                <p className="text-white text-2xl font-bold">{stats.saidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Itens Ativos</p>
                <p className="text-white text-2xl font-bold">{stats.itensAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Relatório Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            Resumo de movimentações do mês de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-400">Total de Entradas</span>
              <span className="text-green-400 font-bold">{stats.entradas}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-400">Total de Saídas</span>
              <span className="text-red-400 font-bold">{stats.saidas}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-400">Itens Cadastrados</span>
              <span className="text-blue-400 font-bold">{stats.itensAtivos}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
