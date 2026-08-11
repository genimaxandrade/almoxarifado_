import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function HistoricoPrecos() {
  const [precos, setPrecos] = useState([]);

  useEffect(() => {
    loadPrecos();
  }, []);

  const loadPrecos = async () => {
    try {
      const { data: items } = await supabase
        .from('items')
        .select('name, unit_price')
        .limit(10);

      if (items) {
        setPrecos(items.map(item => ({
          item: item.name,
          precoAtual: item.unit_price || 0,
          variacao: '0%',
          trend: 'stable',
        })));
      }
    } catch (err) {
      console.error('Erro ao carregar preços:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          {precos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado de preços disponível.
            </div>
          ) : (
            <div className="space-y-3">
              {precos.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-white text-sm">{item.item}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-semibold">R$ {item.precoAtual.toFixed(2)}</span>
                    <div className={`flex items-center gap-1 text-sm ${
                      item.trend === 'up' ? 'text-green-400' :
                      item.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {item.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                      {item.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                      {item.trend === 'stable' && <Minus className="w-4 h-4" />}
                      <span>{item.variacao}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
