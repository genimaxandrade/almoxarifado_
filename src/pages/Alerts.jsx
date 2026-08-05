import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, PackageMinus, Clock, XCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { addDays, isBefore, isAfter, format } from 'date-fns';

export default function Alerts() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-name', 500),
  });

  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  const lowStock = items.filter(i => (i.minimum_stock || 0) > 0 && i.quantity <= (i.minimum_stock || 0));
  const safetyAlert = items.filter(i => {
    const ss = i.safety_stock || Math.ceil((i.minimum_stock || 0) * 1.2);
    return (i.minimum_stock || 0) > 0 && i.quantity > (i.minimum_stock || 0) && i.quantity <= ss;
  });
  const expired = items.filter(i => i.expiry_date && isBefore(new Date(i.expiry_date), today));
  const expiringSoon = items.filter(i =>
    i.expiry_date &&
    isAfter(new Date(i.expiry_date), today) &&
    isBefore(new Date(i.expiry_date), thirtyDaysFromNow)
  );

  const totalAlerts = lowStock.length + expired.length + expiringSoon.length + safetyAlert.length;

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Alertas</h1>
            <p className="text-sm text-slate-400">Monitoramento automático do estoque</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: PackageMinus, label: 'Estoque Mínimo', value: lowStock.length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
            { icon: ShieldAlert, label: 'Est. Segurança', value: safetyAlert.length, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
            { icon: XCircle, label: 'Vencidos', value: expired.length, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
            { icon: Clock, label: 'Venc. Próximo', value: expiringSoon.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${bg}`}>
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className={`text-2xl font-bold ${value > 0 ? color : 'text-slate-500'}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {totalAlerts === 0 && !isLoading && (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 py-20 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
          <p className="text-lg font-semibold text-white">Tudo certo!</p>
          <p className="text-sm text-slate-500 mt-1">Nenhum alerta encontrado no momento.</p>
        </div>
      )}

      {/* Low stock — estoque mínimo */}
      {lowStock.length > 0 && (
        <AlertSection
          icon={<PackageMinus className="w-4 h-4 text-red-400" />}
          title="Estoque Abaixo do Mínimo"
          color="border-red-500/30 bg-red-500/5"
          headerColor="text-red-400"
        >
          {lowStock.map(item => (
            <AlertRow key={item.id} item={item}>
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
                {item.quantity} / {item.minimum_stock} {item.unit}
              </span>
            </AlertRow>
          ))}
        </AlertSection>
      )}

      {/* Safety stock alert */}
      {safetyAlert.length > 0 && (
        <AlertSection
          icon={<ShieldAlert className="w-4 h-4 text-orange-400" />}
          title="Estoque de Segurança Atingido"
          color="border-orange-500/30 bg-orange-500/5"
          headerColor="text-orange-400"
        >
          {safetyAlert.map(item => {
            const ss = item.safety_stock || Math.ceil((item.minimum_stock || 0) * 1.2);
            return (
              <AlertRow key={item.id} item={item}>
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
                  {item.quantity} / {ss} {item.unit}
                </span>
              </AlertRow>
            );
          })}
        </AlertSection>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <AlertSection
          icon={<XCircle className="w-4 h-4 text-rose-400" />}
          title="Produtos Vencidos"
          color="border-rose-500/30 bg-rose-500/5"
          headerColor="text-rose-400"
        >
          {expired.map(item => (
            <AlertRow key={item.id} item={item}>
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium">
                Vencido em {format(new Date(item.expiry_date), 'dd/MM/yyyy')}
              </span>
            </AlertRow>
          ))}
        </AlertSection>
      )}

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <AlertSection
          icon={<Clock className="w-4 h-4 text-yellow-400" />}
          title="Validade Próxima (30 dias)"
          color="border-yellow-500/30 bg-yellow-500/5"
          headerColor="text-yellow-400"
        >
          {expiringSoon.map(item => (
            <AlertRow key={item.id} item={item}>
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">
                Vence em {format(new Date(item.expiry_date), 'dd/MM/yyyy')}
              </span>
            </AlertRow>
          ))}
        </AlertSection>
      )}
    </div>
  );
}

function AlertSection({ icon, title, color, headerColor, children }) {
  return (
    <div className={`rounded-2xl border ${color} mb-4 overflow-hidden`}>
      <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
        {icon}
        <span className={`font-semibold text-sm ${headerColor}`}>{title}</span>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function AlertRow({ item, children }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-white">{item.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{item.code} — {item.type}</p>
      </div>
      {children}
    </div>
  );
}