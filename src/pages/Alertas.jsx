import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export function Alertas({ items }) {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    generateAlertas();
  }, [items]);

  const generateAlertas = () => {
    const newAlertas = [];
    
    // Alertas de estoque crítico (quantidade <= 5)
    const criticos = items.filter(i => i.quantity <= 5 && i.quantity > 0);
    criticos.forEach(item => {
      newAlertas.push({
        id: `critico-${item.id}`,
        type: 'urgente',
        title: `Estoque Crítico: ${item.name}`,
        message: `Quantidade abaixo do mínimo (${item.quantity} unidades restantes)`,
        icon: AlertTriangle,
        color: 'red',
      });
    });

    // Alertas de estoque zerado
    const zerados = items.filter(i => i.quantity === 0);
    zerados.forEach(item => {
      newAlertas.push({
        id: `zerado-${item.id}`,
        type: 'urgente',
        title: `Estoque Zerado: ${item.name}`,
        message: 'Item sem estoque! Necessária reposição urgente',
        icon: AlertTriangle,
        color: 'red',
      });
    });

    // Alertas de estoque baixo (quantidade <= 20)
    const baixos = items.filter(i => i.quantity > 5 && i.quantity <= 20);
    baixos.forEach(item => {
      newAlertas.push({
        id: `baixo-${item.id}`,
        type: 'aviso',
        title: `Estoque Baixo: ${item.name}`,
        message: `Reposição recomendada (${item.quantity} unidades restantes)`,
        icon: AlertCircle,
        color: 'yellow',
      });
    });

    // Alerta informativo se não houver alertas
    if (newAlertas.length === 0 && items.length > 0) {
      newAlertas.push({
        id: 'info-ok',
        type: 'info',
        title: 'Sistema Operando Normal',
        message: 'Nenhum alerta de estoque no momento',
        icon: Info,
        color: 'blue',
      });
    }

    setAlertas(newAlertas);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertas do Sistema ({alertas.length})
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
