import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowDown, ArrowUp } from 'lucide-react';

export function HistoricoDiario() {
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    loadMovimentacoes();
  }, []);

  const loadMovimentacoes = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: false });

      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação registrada hoje.
            </div>
          ) : (
            <div className="space-y-3">
              {movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                >
                  {mov.movement_type === 'saida' ? (
                    <ArrowDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <ArrowUp className="w-5 h-5 text-green-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{mov.item_name}</p>
                    <p className="text-gray-400 text-xs">
                      Qtd: {mov.quantity} | Motivo: {mov.reason || 'N/A'}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(mov.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
