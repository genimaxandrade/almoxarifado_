import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function Graficos() {
  const [topConsumidos, setTopConsumidos] = useState([]);
  const [tendenciaMensal, setTendenciaMensal] = useState([]);
  const [saidasDiarias, setSaidasDiarias] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Buscar apenas saídas dos últimos 90 dias
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('movement_type', 'saida')
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0]);

      if (!movements || movements.length === 0) return;

      // Top 10 mais consumidos
      const consumo = {};
      movements.forEach(m => {
        const name = m.item_name || m.item_code || 'Desconhecido';
        consumo[name] = (consumo[name] || 0) + m.quantity;
      });

      const sorted = Object.entries(consumo)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      setTopConsumidos(
        sorted.map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, total: value }))
      );

      // Tendência mensal (últimos 6 meses)
      const monthly = {};
      movements.forEach(m => {
        const monthKey = m.date.substring(0, 7); // YYYY-MM
        monthly[monthKey] = (monthly[monthKey] || 0) + m.quantity;
      });

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      setTendenciaMensal(
        Object.entries(monthly)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([key, value]) => ({
            mes: monthNames[parseInt(key.split('-')[1]) - 1] + '/' + key.split('-')[0].slice(2),
            saidas: value
          }))
      );

      // Saídas diárias últimos 14 dias
      const days = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
      }

      const dailyData = days.map(day => {
        const dayMovs = movements.filter(m => m.date.startsWith(day));
        return {
          dia: new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          saidas: dayMovs.reduce((acc, m) => acc + m.quantity, 0)
        };
      });
      setSaidasDiarias(dailyData);
    } catch (err) {
      console.error('Erro ao carregar dados dos gráficos:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 10 Mais Consumidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top 10 Itens Mais Consumidos (Saídas)</CardTitle>
        </CardHeader>
        <CardContent>
          {topConsumidos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma saída registrada.</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topConsumidos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={200} />
                <Tooltip />
                <Bar dataKey="total" fill="#EF4444" name="Qtd Saída" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tendência Mensal */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Tendência Mensal de Saídas</CardTitle>
        </CardHeader>
        <CardContent>
          {tendenciaMensal.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum dado disponível.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendenciaMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="saidas" stroke="#3B82F6" strokeWidth={2} name="Saídas" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Saídas Diárias */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Saídas - Últimos 14 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          {saidasDiarias.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum dado disponível.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={saidasDiarias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dia" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip />
                <Bar dataKey="saidas" fill="#F59E0B" name="Saídas (Qtd)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
