import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';

const VALID_TYPES = ['EPI', 'Equipamento', 'Material de Consumo', 'Medicamento'];

function validateRow(row) {
  const errors = [];
  if (!row.code) errors.push('Código obrigatório');
  if (!row.name) errors.push('Nome obrigatório');
  if (!row.type) errors.push('Tipo obrigatório');
  else if (!VALID_TYPES.includes(row.type)) errors.push(`Tipo inválido: use ${VALID_TYPES.join(', ')}`);
  if (!row.unit) errors.push('Unidade obrigatória');
  return errors;
}

function mapRow(raw) {
  return {
    code: String(raw['Código'] || raw['code'] || '').trim(),
    name: String(raw['Nome'] || raw['name'] || '').trim(),
    type: String(raw['Tipo'] || raw['type'] || '').trim(),
    unit: String(raw['Unidade'] || raw['unit'] || '').trim(),
    quantity: parseFloat(raw['Quantidade'] || raw['quantidade'] || raw['quantity'] || 0) || 0,
    minimum_stock: parseFloat(raw['Estoque Mínimo'] || raw['estoque_minimo'] || raw['minimum_stock'] || 0) || 0,
    location: String(raw['Localização'] || raw['localizacao'] || raw['location'] || '').trim(),
    supplier: String(raw['Fornecedor'] || raw['fornecedor'] || raw['supplier'] || '').trim(),
    ca_number: String(raw['CA'] || raw['ca'] || raw['ca_number'] || '').trim(),
    expiry_date: String(raw['Validade'] || raw['validade'] || raw['expiry_date'] || '').trim(),
    description: String(raw['Descrição'] || raw['descricao'] || raw['description'] || '').trim(),
  };
}

export default function ImportDialog({ open, onOpenChange, onImport, isImporting }) {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const workbook = XLSX.read(ev.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (rows.length === 0) { setError('A planilha está vazia.'); setParsed(null); return; }
        const validated = rows.map(raw => {
          const mapped = mapRow(raw);
          return { mapped, errors: validateRow(mapped) };
        }).filter(r => Object.values(r.mapped).some(v => v));
        setParsed(validated);
      } catch {
        setError('Não foi possível ler o arquivo. Certifique-se de enviar um arquivo Excel válido.');
        setParsed(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = parsed?.filter(r => r.errors.length === 0) || [];
  const invalidRows = parsed?.filter(r => r.errors.length > 0) || [];

  const handleImport = () => onImport(validRows.map(r => r.mapped));

  const handleClose = () => {
    setParsed(null); setFileName(''); setError('');
    if (fileRef.current) fileRef.current.value = '';
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const headers = [['Código','Nome','Tipo','Unidade','Quantidade','Estoque Mínimo','Localização','Fornecedor','CA','Validade','Descrição']];
    const example = [['EPI-010','Luva de Malha','EPI','par',100,20,'Prateleira A1','Fornecedor X','12345','2027-12-31','Luva para proteção mecânica']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Itens');
    XLSX.writeFile(wb, 'modelo_importacao.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Itens via Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Baixar modelo de planilha</p>
              <p className="text-xs text-muted-foreground">Use o modelo Excel para garantir as colunas corretas</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> Modelo Excel
            </Button>
          </div>

          {/* Upload area */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">{fileName || 'Clique ou arraste o arquivo Excel'}</p>
            <p className="text-xs text-muted-foreground mt-1">Aceita arquivos .xlsx e .xls</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Preview */}
          {parsed && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> {validRows.length} válidos
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    <X className="w-3 h-3 mr-1" /> {invalidRows.length} com erro
                  </Badge>
                )}
              </div>

              {validRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Prévia dos itens a importar</p>
                  <div className="border rounded-lg overflow-auto max-h-56">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Localização</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validRows.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.mapped.code}</TableCell>
                            <TableCell className="text-sm">{r.mapped.name}</TableCell>
                            <TableCell><Badge variant="outline">{r.mapped.type}</Badge></TableCell>
                            <TableCell className="text-center text-sm">{r.mapped.quantity}</TableCell>
                            <TableCell className="text-sm">{r.mapped.unit}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.mapped.location || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {invalidRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-destructive mb-2">Linhas com erro (serão ignoradas)</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {invalidRows.map((r, i) => (
                      <div key={i} className="text-xs p-2 bg-red-50 border border-red-100 rounded flex items-center gap-2">
                        <span className="font-mono font-bold">{r.mapped.code || `Linha ${i + 1}`}</span>
                        <span className="text-red-600">{r.errors.join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button disabled={!parsed || validRows.length === 0 || isImporting} onClick={handleImport}>
            <FileText className="w-4 h-4 mr-2" />
            {isImporting ? 'Importando...' : `Importar ${validRows.length} iten${validRows.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}