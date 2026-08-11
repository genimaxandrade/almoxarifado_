import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart, TrendingUp, TrendingDown, Package } from 'lucide-react';

export function RelatorioMensal() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Entradas</p>
                <p className="text-white text-2xl font-bold">245</p>
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
                <p className="text-white text-2xl font-bold">189</p>
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
                <p className="text-white text-2xl font-bold">56</p>
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
            Resumo de movimentações do mês de Agosto/2026.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
