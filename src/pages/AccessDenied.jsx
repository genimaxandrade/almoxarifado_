import React from 'react';
import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
        <ShieldOff className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Acesso Negado</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}