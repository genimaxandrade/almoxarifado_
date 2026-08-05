import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tag, Search, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';

function generateBarcode(code) {
  // Textual barcode representation
  return code?.split('').map(c => {
    const n = c.charCodeAt(0);
    return (n % 2 === 0 ? '█' : '▌') + '│';
  }).join('') || '';
}

function LabelPreview({ item }) {
  return (
    <div className="print-label border-2 border-dashed border-border rounded-lg p-4 bg-white"
      style={{ width: '302px', height: '189px' }}>
      <div className="h-full flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Almoxarifado</p>
          <p className="text-sm font-bold text-gray-900 mt-1 line-clamp-2 leading-tight">{item.name}</p>
        </div>
        <div className="text-center py-2">
          <p className="font-mono text-lg tracking-[6px] text-gray-700">{generateBarcode(item.code)}</p>
          <p className="font-mono text-xs text-gray-600 mt-1">{item.code}</p>
        </div>
        <div className="flex justify-between text-[9px] text-gray-500">
          <span>{item.type}</span>
          <span>{item.unit}</span>
          <span>{item.location || ''}</span>
        </div>
      </div>
    </div>
  );
}

export default function Labels() {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [labelQty, setLabelQty] = useState(1);
  const printRef = useRef();

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.list('-name', 500),
  });

  const searchResults = search.length >= 2
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Etiquetas - ${selectedItem.name}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: sans-serif; }
        .label { width: 302px; height: 189px; border: 1px solid #ccc; padding: 16px; margin: 8px; display: inline-block; page-break-inside: avoid; box-sizing: border-box; }
        .label-name { font-size: 14px; font-weight: bold; margin-top: 4px; }
        .label-header { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #333; }
        .barcode { font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 6px; padding: 8px 0; }
        .code { font-family: monospace; font-size: 11px; text-align: center; color: #666; }
        .footer { display: flex; justify-content: space-between; font-size: 8px; color: #999; }
      </style></head><body>
      ${Array(Number(labelQty)).fill('').map(() => `
        <div class="label">
          <div class="label-header">Almoxarifado</div>
          <div class="label-name">${selectedItem.name}</div>
          <div class="barcode">${generateBarcode(selectedItem.code)}</div>
          <div class="code">${selectedItem.code}</div>
          <div class="footer"><span>${selectedItem.type}</span><span>${selectedItem.unit}</span><span>${selectedItem.location || ''}</span></div>
        </div>
      `).join('')}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <PageHeader icon={Tag} title="Etiquetas" description="Gerar etiquetas para impressão (80mm x 50mm)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Selecionar Item</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar item..." value={search} onChange={e => { setSearch(e.target.value); setSelectedItem(null); }} className="pl-9" />
            </div>
            {searchResults.length > 0 && !selectedItem && (
              <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                {searchResults.map(item => (
                  <button key={item.id} onClick={() => { setSelectedItem(item); setSearch(item.name); }}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({item.code})</span>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Quantidade de Etiquetas</Label>
              <Input type="number" min="1" max="100" value={labelQty} onChange={e => setLabelQty(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!selectedItem} onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir Etiquetas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pré-visualização</CardTitle></CardHeader>
          <CardContent ref={printRef} className="flex flex-wrap gap-4 justify-center">
            {selectedItem ? (
              <LabelPreview item={selectedItem} />
            ) : (
              <p className="text-sm text-muted-foreground py-12">Selecione um item para visualizar a etiqueta</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}