import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';

export function Graficos() {
  const [distribuicao, setDistribuicao] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Distribuição por tipo
      const { data: items } = await supabase
        .from('items')
        .select('type, quantity');

      if (items && items.length > 0) {
        const tipos = {};
        items.forEach(item => {
          const tipo = item.type || 'Outros';
          tipos[tipo] = (tipos[tipo] || 0) + item.quantity;
        });

        setDistribuicao(
          Object.entries(tipos).map(([name, value]) => ({ name, value }))
        );
      }

      // Movimentações por dia (últimos 7 dias)
      const today = new Date();
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
      }

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('date, movement_type')
        .gte('date', days[0]);

      if (movements) {
        const dailyStats = days.map(day => {
          const dayMovs = movements.filter(m => m.date.startsWith(day));
          return {
            dia: new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            entradas: dayMovs.filter(m => m.movement_type === 'entrada').length,
            saidas: dayMovs.filter(m => m.movement_type === 'saida').length,
          };
        });
        setMovimentacoes(dailyStats);
      }
    } catch (err) {
      console.error('Erro ao carregar dados dos gráficos:', err);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Distribuição de Estoque por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {distribuicao.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponível.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribuicao}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {distribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Movimentações - Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponível.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={movimentacoes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dia" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Legend />
                <Bar dataKey="entradas" fill="#10B981" name="Entradas" />
                <Bar dataKey="saidas" fill="#EF4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
