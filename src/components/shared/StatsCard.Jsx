import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatsCard({ icon: Icon, label, value, color = "text-primary", bgColor = "bg-primary/10" }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </Card>
  );
}