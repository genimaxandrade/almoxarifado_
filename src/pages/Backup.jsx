import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { HardDrive, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-created_date', 2000),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: () => base44.entities.StockMovement.list('-date', 2000),
  });

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackup = () => {
    setIsExporting(true);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

    downloadJSON(items, `itens_backup_${timestamp}.json`);
    downloadJSON(movements.filter(m => m.movement_type === 'saida'), `saidas_backup_${timestamp}.json`);
    downloadJSON(movements.filter(m => m.movement_type === 'entrada'), `entradas_backup_${timestamp}.json`);

    const newBackup = {
      date: new Date().toISOString(),
      items: items.length,
      outputs: movements.filter(m => m.movement_type === 'saida').length,
      inputs: movements.filter(m => m.movement_type === 'entrada').length,
    };
    setBackups(prev => [newBackup, ...prev]);
    toast.success('Backup realizado com sucesso!');
    setIsExporting(false);
  };

  return (
    <div>
      <PageHeader icon={HardDrive} title="Backup" description="Crie cópias de segurança dos dados do sistema" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Criar Backup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Itens cadastrados</span>
                <span className="font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Movimentações de saída</span>
                <span className="font-bold">{movements.filter(m => m.movement_type === 'saida').length}</span>
              </div>
              <div className="flex justify-between p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Movimentações de entrada</span>
                <span className="font-bold">{movements.filter(m => m.movement_type === 'entrada').length}</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleBackup} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Gerar Backup (3 arquivos JSON)'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Serão baixados 3 arquivos JSON com timestamp no nome
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Backups Realizados (Sessão)</CardTitle></CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum backup realizado nesta sessão</p>
            ) : (
              <div className="space-y-3">
                {backups.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">{format(new Date(b.date), 'dd/MM/yyyy HH:mm:ss')}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.items} itens, {b.outputs} saídas, {b.inputs} entradas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}