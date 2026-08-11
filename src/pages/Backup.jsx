import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload } from 'lucide-react';

export function Backup() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm">
            Exporte ou importe dados do sistema para manter backups seguros.
          </p>
          <div className="flex gap-3">
            <Button className="bg-green-600 hover:bg-green-700 text-white flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Importar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
