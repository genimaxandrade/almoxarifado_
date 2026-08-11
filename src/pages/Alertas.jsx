import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const alertas = [
  {
    id: 1,
    type: 'urgente',
    title: 'Estoque Crítico: Parafuso M6',
    message: 'Quantidade abaixo do mínimo (5 unidades restantes)',
    icon: AlertTriangle,
    color: 'red',
  },
  {
    id: 2,
    type: 'aviso',
    title: 'Reposição Necessária: Porca M8',
    message: 'Solicitação de compra pendente há 3 dias',
    icon: AlertCircle,
    color: 'yellow',
  },
  {
    id: 3,
    type: 'info',
    title: 'Movimentação Registrada',
    message: 'Nova saída de material registrada hoje',
    icon: Info,
    color: 'blue',
  },
];

export function Alertas() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertas do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertas.map((alert) => {
              const Icon = alert.icon;
              const colorClasses = {
                red: 'bg-red-900/20 border-red-700 text-red-300',
                yellow: 'bg-yellow-900/20 border-yellow-700 text-yellow-300',
                blue: 'bg-blue-900/20 border-blue-700 text-blue-300',
              };

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${colorClasses[alert.color]} flex items-start gap-3`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">{alert.title}</h3>
                    <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
