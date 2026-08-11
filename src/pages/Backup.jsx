import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload, CheckCircle } from 'lucide-react';
import { exportItemsToExcel, importItemsFromExcel, downloadTemplate } from '@/utils/excelUtils';

export function Backup({ items, onItemsUpdated }) {
  const [backups, setBackups] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleBackup = async () => {
    setIsExporting(true);

    try {
      // Buscar todos os dados
      const { data: itemsData } = await supabase
        .from('items')
        .select('*');

      const { data: movementsData } = await supabase
        .from('stock_movements')
        .select('*');

      const { data: requestsData } = await supabase
        .from('purchase_requests')
        .select('*');

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*');

      // Criar backup completo em JSON
      const backupData = {
        timestamp: new Date().toISOString(),
        items: itemsData || [],
        stock_movements: movementsData || [],
        purchase_requests: requestsData || [],
        employees: employeesData || [],
      };

      // Download do arquivo JSON
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_almoxarifado_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setBackups(prev => [
        {
          date: new Date().toISOString(),
          items: itemsData?.length || 0,
          movements: movementsData?.length || 0,
          requests: requestsData?.length || 0,
          employees: employeesData?.length || 0,
        },
        ...prev,
      ]);

      setMessage('✅ Backup realizado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro ao fazer backup: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.items) {
        const { error } = await supabase
          .from('items')
          .insert(data.items);
        if (error) throw error;
      }

      setMessage('✅ Dados importados com sucesso!');
      if (onItemsUpdated) onItemsUpdated();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro ao importar: ${err.message}`);
    }

    e.target.value = '';
  };

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
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('✅')
                ? 'bg-green-900 text-green-300 border border-green-700'
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {message}
            </div>
          )}

          <p className="text-gray-400 text-sm">
            Exporte todos os dados do sistema em um único arquivo JSON para manter backups seguros.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleBackup}
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar Backup'}
            </Button>

            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer inline-flex items-center justify-center flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Importar Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Botões adicionais de exportação */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <p className="text-gray-400 text-sm mb-3">Exportações rápidas:</p>
            <div className="flex gap-2">
              <Button
                onClick={() => exportItemsToExcel(items)}
                variant="outline"
                className="text-sm"
              >
                📊 Itens (Excel)
              </Button>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="text-sm"
              >
                📋 Modelo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backups Realizados */}
      {backups.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Backups Realizados (Sessão)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backups.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-white">{new Date(b.date).toLocaleString('pt-BR')}</p>
                    <p className="text-gray-400 text-xs">
                      {b.items} itens, {b.movements} movimentações, {b.requests} solicitações, {b.employees} funcionários
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
