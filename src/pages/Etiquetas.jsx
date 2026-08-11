import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Download } from 'lucide-react';

export function Etiquetas() {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateEtiqueta = () => {
    if (!itemCode || !itemName) return;

    // Gerar código de etiqueta único
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `ETQ-${itemCode}-${timestamp}`;
    setGeneratedCode(code);
  };

  const downloadEtiqueta = () => {
    if (!generatedCode) return;

    const content = `
ETIQUETA DE ESTOQUE
===================
Código: ${generatedCode}
Item: ${itemName}
Data: ${new Date().toLocaleDateString('pt-BR')}
===================
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etiqueta_${itemCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Geração de Etiquetas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Código do Item</label>
            <Input
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="Ex: PAR-001"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Nome do Item</label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: Parafuso M6"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <Button onClick={generateEtiqueta} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            <Tag className="w-4 h-4 mr-2" />
            Gerar Etiqueta
          </Button>

          {generatedCode && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">CÓDIGO GERADO</p>
                <p className="text-white font-mono text-lg font-bold">{generatedCode}</p>
                <p className="text-gray-300 text-sm mt-2">{itemName}</p>
                <p className="text-gray-500 text-xs mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
              <Button
                onClick={downloadEtiqueta}
                className="mt-3 bg-green-600 hover:bg-green-700 text-white w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Etiqueta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
