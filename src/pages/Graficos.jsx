import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';

export function Graficos() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Gráficos de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-6 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Gráfico de Distribuição por Categoria</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-6 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Gráfico de Movimentações Mensais</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
