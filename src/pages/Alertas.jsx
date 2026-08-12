import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, AlertCircle, Info, CalendarClock, ShieldAlert } from 'lucide-react';

export function Alertas({ items }) {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    generateAlertas();
  }, [items]);

  const generateAlertas = () => {
    const newAlertas = [];
    
    // 1. Alertas de estoque zerado
    const zerados = items.filter(i => i.quantity === 0);
    zerados.forEach(item => {
      newAlertas.push({
        id: `zerado-${item.id}`,
        type: 'urgente',
        title: `🔴 Estoque Zerado: ${item.name}`,
        message: `Item sem estoque! Necessária reposição urgente.`,
        icon: AlertTriangle,
        color: 'red',
      });
    });

    // 2. Alertas de estoque abaixo do mínimo personalizado
    const abaixoMinimo = items.filter(i => {
      const min = i.estoque_minimo || 10;
      return i.quantity > 0 && i.quantity <= min;
    });
    abaixoMinimo.forEach(item => {
      const min = item.estoque_minimo || 10;
      newAlertas.push({
        id: `baixo-${item.id}`,
        type: 'urgente',
        title: `⚠️ Estoque Baixo: ${item.name}`,
        message: `Quantidade (${item.quantity}) abaixo do mínimo definido (${min}). Reposição necessária!`,
        icon: AlertTriangle,
        color: 'red',
      });
    });

    // 3. Alertas de CA vencido (EPIs)
    const hoje = new Date();
    const caVencidos = items.filter(i => {
      if (i.type !== 'epi' || !i.data_validade_ca) return false;
      const validade = new Date(i.data_validade_ca);
      return validade < hoje;
    });
    caVencidos.forEach(item => {
      newAlertas.push({
        id: `ca-vencido-${item.id}`,
        type: 'urgente',
        title: `🚫 CA VENCIDO: ${item.name}`,
        message: `CA nº ${item.ca} venceu em ${formatDate(item.data_validade_ca)}. EPI não pode ser utilizado!`,
        icon: ShieldAlert,
        color: 'red',
      });
    });

    // 4. Alertas de CA próximo do vencimento (EPIs - 30 dias)
    const caProximoVencimento = items.filter(i => {
      if (i.type !== 'epi' || !i.data_validade_ca) return false;
      const validade = new Date(i.data_validade_ca);
      const diff = (validade - hoje) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });
    caProximoVencimento.forEach(item => {
      const validade = new Date(item.data_validade_ca);
      const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
      newAlertas.push({
        id: `ca-proximo-${item.id}`,
        type: 'aviso',
        title: `⏰ CA Próximo do Vencimento: ${item.name}`,
        message: `CA nº ${item.ca} vence em ${formatDate(item.data_validade_ca)} (${diasRestantes} dias). Planeje a substituição!`,
        icon: CalendarClock,
        color: 'yellow',
      });
    });

    // 5. Alertas de CA vencendo em 30-90 dias (EPIs - planejamento)
    const caPlanejamento = items.filter(i => {
      if (i.type !== 'epi' || !i.data_validade_ca) return false;
      const validade = new Date(i.data_validade_ca);
      const diff = (validade - hoje) / (1000 * 60 * 60 * 24);
      return diff > 30 && diff <= 90;
    });
    caPlanejamento.forEach(item => {
      newAlertas.push({
        id: `ca-planej-${item.id}`,
        type: 'info',
        title: `📅 CA Vence em Breve: ${item.name}`,
        message: `CA nº ${item.ca} vence em ${formatDate(item.data_validade_ca)}. Inicie o planejamento de substituição.`,
        icon: CalendarClock,
        color: 'blue',
      });
    });

    // 6. Alerta informativo se não houver alertas
    if (newAlertas.length === 0 && items.length > 0) {
      newAlertas.push({
        id: 'info-ok',
        type: 'info',
        title: '✅ Sistema Operando Normal',
        message: 'Nenhum alerta de estoque ou CA no momento. Tudo em ordem!',
        icon: Info,
        color: 'blue',
      });
    }

    setAlertas(newAlertas);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
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
