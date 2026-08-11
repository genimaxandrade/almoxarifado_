import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowDown, ArrowUp } from 'lucide-react';

export function HistoricoDiario() {
  const movimentacoes = [
    { id: 1, tipo: 'saida', item: 'Parafuso M6', qtd: 10, hora: '08:30' },
    { id: 2, tipo: 'entrada', item: 'Porca M8', qtd: 50, hora: '10:15' },
    { id: 3, tipo: 'saida', item: 'Arruela M10', qtd: 5, hora: '14:20' },
  ];

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
          <div className="space-y-3">
            {movimentacoes.map((mov) => (
              <div
                key={mov.id}
                className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
              >
                {mov.tipo === 'saida' ? (
                  <ArrowDown className="w-5 h-5 text-red-400" />
                ) : (
                  <ArrowUp className="w-5 h-5 text-green-400" />
                )}
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{mov.item}</p>
                  <p className="text-gray-400 text-xs">Qtd: {mov.qtd}</p>
                </div>
                <span className="text-gray-500 text-sm">{mov.hora}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
