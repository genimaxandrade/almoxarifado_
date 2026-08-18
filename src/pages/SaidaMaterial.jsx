import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown, ShieldCheck, FileText, Printer, Plus, Trash2, AlertTriangle, Camera } from 'lucide-react';
import { QrCodeReader } from '@/components/QrCodeReader';

export function SaidaMaterial({ items, onItemsUpdated, userEmail }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState('');
  const [areaUso, setAreaUso] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [termAccepted, setTermAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saidaList, setSaidaList] = useState([]);
  const [showSignatureSheet, setShowSignatureSheet] = useState(false);
  const [lastSignatureData, setLastSignatureData] = useState(null);
  const [ultimaRetirada, setUltimaRetirada] = useState(null);
  const [isLoadingUltima, setIsLoadingUltima] = useState(false);
  const [showQrReader, setShowQrReader] = useState(false);
  const [qrMode, setQrMode] = useState('item'); // 'item' ou 'funcionario'
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    // Carregar funcionários cadastrados para autocompletar
    supabase
      .from('employees')
      .select('id, name, department, position, matricula')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setEmployees(data);
      });
  }, []);

  const selectEmployee = (emp) => {
    setEmployeeName(emp.name);
    setEmployeeDepartment(emp.department || '');
    setSelectedEmployeeData(emp);
    setShowEmployeeSuggestions(false);
    if (saidaList.length > 0) {
      const itemId = saidaList[0].item.id;
      buscarUltimaRetirada(itemId, emp.name);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name &&
      emp.name.toLowerCase().includes(employeeName.trim().toLowerCase()) &&
      employeeName.trim().length > 0
  );

  // Buscar a última retirada do item selecionado pela mesma pessoa
  const buscarUltimaRetirada = async (itemId, requisitante) => {
    if (!itemId || !requisitante.trim()) {
      setUltimaRetirada(null);
      return;
    }
    setIsLoadingUltima(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('item_id', itemId)
        .eq('type', 'saida')
        .ilike('reason', `%Requisitante: ${requisitante.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      setUltimaRetirada(data && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('Erro ao buscar última retirada:', err);
      setUltimaRetirada(null);
    } finally {
      setIsLoadingUltima(false);
    }
  };

  // Tratamento do QR Code lido
  const handleQrScan = (valor) => {
    const v = valor.trim().toUpperCase();
    if (v.startsWith('MAT:')) {
      const codigo = v.replace('MAT:', '');
      const item = items.find(i => i.code.toUpperCase() === codigo);
      if (item) {
        setSelectedItem(item.id);
        setSearchTerm('');
        setMessage(`✅ Item lido: ${item.code} - ${item.name}`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Material com código "${codigo}" não encontrado no estoque.`);
        setTimeout(() => setMessage(''), 4000);
      }
    } else if (v.startsWith('FUNC:')) {
      const codigo = v.replace('FUNC:', '');
      supabase
        .from('employees')
        .select('*')
        .or(`matricula.eq.${codigo},name.ilike.%${codigo}%`)
        .limit(1)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setEmployeeName(data.name);
            setEmployeeDepartment(data.department || '');
            setMessage(`✅ Funcionário lido: ${data.name}`);
          } else {
            setMessage(`❌ Funcionário com código "${codigo}" não encontrado.`);
          }
          setTimeout(() => setMessage(''), 4000);
        });
    } else {
      setMessage(`❌ QR Code não reconhecido: ${valor}`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const openQrReader = (mode) => {
    setQrMode(mode);
    setShowQrReader(true);
  };

  const filteredItems = items
    .filter(item => item.quantity > 0)
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAddToSaida = () => {
    if (!selectedItem) return;
    const item = items.find(i => i.id === selectedItem);
    if (!item) return;
    
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;
    if (qty > item.quantity) {
      setMessage('❌ Quantidade insuficiente em estoque!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Gases exigem área de utilização
    if (item.type === 'gas' && !areaUso.trim()) {
      setMessage('⚠️ Para Gás é obrigatório informar a área de utilização!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Verificar se o item já está na lista
    const existingIndex = saidaList.findIndex(s => s.item.id === selectedItem);
    if (existingIndex >= 0) {
      const updated = [...saidaList];
      updated[existingIndex].quantity += qty;
      setSaidaList(updated);
    } else {
      setSaidaList([...saidaList, { item, quantity: qty, areaUso: item.type === 'gas' ? areaUso : '' }]);
    }

    setSelectedItem('');
    setQuantity('');
    setAreaUso('');
    setMessage('');
  };

  const removeFromSaida = (index) => {
    setSaidaList(saidaList.filter((_, i) => i !== index));
  };

  const hasEPIorFerramenta = saidaList.some(s => s.item.type === 'epi' || s.item.type === 'ferramenta');

  const handleRegistrarSaida = async () => {
    if (saidaList.length === 0) {
      setMessage('⚠️ Adicione pelo menos um item à lista.');
      return;
    }
    if (!employeeName.trim()) {
      setMessage('⚠️ É obrigatório informar o nome do requisitante.');
      return;
    }
    if (hasEPIorFerramenta && !termAccepted) {
      setMessage('⚠️ É obrigatório aceitar o termo de responsabilidade.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const now = new Date().toISOString();
      
      // Processar cada item da lista
      for (const saida of saidaList) {
        const item = saida.item;
        const newQuantity = item.quantity - saida.quantity;

        // Atualizar quantidade do item
        const { error: updateError } = await supabase
          .from('items')
          .update({ quantity: newQuantity })
          .eq('id', item.id);
        if (updateError) throw updateError;

        // Registrar movimentação
        const { error: movError } = await supabase
          .from('stock_movements')
          .insert([{
            item_id: item.id,
            item_code: item.code,
            item_name: item.name,
            movement_type: 'saida',
            quantity: saida.quantity,
            reason: `Requisitante: ${employeeName} - ${employeeDepartment ? `Setor: ${employeeDepartment}` : ''}${saida.areaUso ? ` - Área de Uso: ${saida.areaUso}` : ''}`,
            date: now
          }]);
        if (movError) throw movError;

        // Verificar se atingiu estoque mínimo → gerar solicitação de compra
        if (newQuantity <= item.estoque_minimo) {
          await supabase
            .from('purchase_requests')
            .insert([{
              item_id: item.id,
              item_code: item.code,
              item_name: item.name,
              requested_quantity: item.estoque_minimo * 2,
              status: 'pendente',
              created_at: now,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }]);
        }

        // Registrar assinatura se EPI ou Ferramenta
        if (item.type === 'epi' || item.type === 'ferramenta') {
          await supabase
            .from('item_signatures')
            .insert([{
              item_id: item.id,
              item_name: item.name,
              item_type: item.type,
              employee_name: employeeName,
              employee_department: employeeDepartment,
              signature_name: employeeName,
              term_accepted: true,
              signed_at: now
            }]);
        }
      }

      // Abrir o termo de saída em uma nova guia, já pronto para impressão
      openTermoEmNovaAba(saidaList, employeeName, employeeDepartment);

      // Salvar dados para a folha de assinatura
      setLastSignatureData({
        items: saidaList,
        employeeName,
        employeeDepartment,
        date: now
      });
      setShowSignatureSheet(true);

      setMessage('✅ Saídas registradas com sucesso!');
      setSaidaList([]);
      setEmployeeName('');
      setEmployeeDepartment('');
      setTermAccepted(false);
      
      if (onItemsUpdated) onItemsUpdated();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Abrir o termo de saída em uma nova guia, já pronta para impressão
  const openTermoEmNovaAba = (items, requisitante, setor) => {
    const temEpi = items.some((s) => (s.item.type || '').toLowerCase() === 'epi');
    if (temEpi) {
      openFichaEpiEmNovaAba(items, requisitante, setor);
      return;
    }
    openTermoMateriaisEmNovaAba(items, requisitante, setor);
  };

  const LOGO_DATA = 'data:image/png;base64,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';

  const openHtmlInNewTab = (html) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    }
  };

  // TERMO DE ENTREGA DE MATERIAIS (baseado no modelo FO-NPE-236)
  const openTermoMateriaisEmNovaAba = (items, requisitante, setor) => {
    const emp = selectedEmployeeData;
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const rows = items
      .map(
        (s) => `<tr>
          <td style="text-align:center">${dataStr}</td>
          <td style="text-align:center">-</td>
          <td style="text-align:center">${s.quantity}</td>
          <td>${s.item.name || ''}${s.item.code ? ` (${s.item.code})` : ''}${s.areaUso ? ` — ${s.areaUso}` : ''}</td>
          <td style="text-align:center">${s.item.patrimonio || '-'}</td>
          <td></td>
          <td style="text-align:center">-</td>
          <td style="text-align:center">-</td>
        </tr>`
      )
      .join('');
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Termo de Entrega de Materiais</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none !important; } }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; padding: 28px 40px; max-width: 900px; margin: 0 auto; font-size: 12px; }
  .cab { display: flex; align-items: center; gap: 18px; margin-bottom: 14px; }
  .cab img { width: 88px; height: 88px; }
  .titulo { font-size: 19px; font-weight: bold; text-align: center; text-decoration: underline; text-decoration-thickness: 2px; }
  .decl { text-align: justify; line-height: 1.5; margin: 14px 0; }
  .campo { margin: 10px 0; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0 10px; font-size: 12px; }
  th, td { border: 1px solid #000; padding: 5px 6px; }
  th { text-align: center; }
  .obs { margin-top: 12px; }
  .assinBloco { margin-top: 24px; line-height: 1.8; }
  .assinLin { display: flex; gap: 40px; margin-top: 40px; }
  .assinBloco2 { flex: 1; text-align: center; }
  .assinBloco2 .linha { border-top: 1px solid #000; margin: 0 10px; }
  .btn { display: inline-block; margin: 12px 6px 0; padding: 9px 20px; background: #16a34a; color: #fff; border: 0; border-radius: 6px; font-size: 14px; cursor: pointer; }
  .btn2 { background: #6b7280; }
</style>
</head>
<body>
  <div class="no-print" style="text-align:center">
    <button class="btn" onclick="window.print()">🖨️ Imprimir Termo</button>
    <button class="btn btn2" onclick="window.close()">✕ Fechar</button>
  </div>
  <div class="cab">
    <img src="${LOGO_DATA}" alt="Support Mining">
    <div class="titulo">TERMO DE ENTREGA DE MATERIAIS</div>
  </div>
  <p class="decl">
    Declaro ter recebido da <strong>SUPPORT MINING</strong> a título de entrega, para uso exclusivo, conforme determinado na lei, os materiais especificados neste termo de responsabilidade. Comprometo-me a mantê-los em perfeito estado de conservação, ficando ciente de que: 1 - Se o material for danificado ou inutilizado por emprego inadequado, mau uso, negligência ou extravio, a empresa me fornecerá um outro material e cobrará o valor de um material da mesma marca ou equivalente ao da praça. 2 - Em dano, inutilização, ou extravio do material, deverei comunicar imediatamente ao setor competente e a minha liderança.
  </p>
  <p class="campo"><strong>NOME:</strong> ${requisitante}</p>
  <p class="campo"><strong>FUNÇÃO:</strong> ${emp && emp.position ? emp.position : setor || ''} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>MATRÍCULA:</strong> ${emp && emp.matricula ? emp.matricula : ''}</p>
  <table>
    <thead>
      <tr><th>DATA ENTREGA</th><th>ENTREGUE POR</th><th>QUANT.</th><th>DESCRIÇÃO</th><th>PATRIMÔNIO</th><th>ASSINATURA</th><th>DATA DEV.</th><th>RECEBIDO POR</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="obs"><strong>Observações:</strong></p>
  <div class="assinBloco">
    <p><strong>Colaborador</strong></p>
    <p>Nome: ${requisitante}</p>
    <p>Assinatura: ________________________________________________</p>
  </div>
  <div class="assinBloco">
    <p><strong>Almoxarifado</strong></p>
    <p>Nome: _____________________________________________________</p>
    <p>Assinatura: ________________________________________________</p>
  </div>
  <script>setTimeout(() => window.print(), 400);</script>
</body>
</html>`;
    openHtmlInNewTab(html);
  };

  // FICHA DE ENTREGA DE EPIS (baseada no modelo FICHADEEPIs.docx)
  const openFichaEpiEmNovaAba = (items, requisitante, setor) => {
    const emp = selectedEmployeeData;
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const rows = items
      .filter((s) => (s.item.type || '').toLowerCase() === 'epi')
      .map(
        (s) => `<tr>
          <td style="text-align:center">${dataStr}</td>
          <td>${s.item.name}${s.quantity > 1 ? ` — Qtd: ${s.quantity}` : ''}</td>
          <td style="text-align:center">${s.item.ca || '-'}</td>
          <td></td>
        </tr>`
      )
      .join('');
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ficha de Entrega de EPIs</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none !important; } }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; padding: 28px 40px; max-width: 900px; margin: 0 auto; font-size: 12px; }
  .cab { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
  .cab img { width: 88px; height: 88px; }
  .titulo { font-size: 19px; font-weight: bold; text-align: center; }
  .campo { margin: 9px 0; line-height: 1.5; }
  .campo b { display: inline-block; width: 100px; }
  .termoTitulo { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin: 22px 0 12px; }
  .decl { text-align: justify; line-height: 1.5; }
  .clausula { text-align: justify; line-height: 1.5; margin: 10px 0; }
  .assin { margin-top: 26px; line-height: 1.8; margin-left: 90px; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0 10px; font-size: 12px; page-break-inside: auto; }
  th, td { border: 1px solid #000; padding: 6px; }
  tr { page-break-inside: avoid; }
  .btn { display: inline-block; margin: 12px 6px 0; padding: 9px 20px; background: #16a34a; color: #fff; border: 0; border-radius: 6px; font-size: 14px; cursor: pointer; }
  .btn2 { background: #6b7280; }
</style>
</head>
<body>
  <div class="no-print" style="text-align:center">
    <button class="btn" onclick="window.print()">🖨️ Imprimir Ficha</button>
    <button class="btn btn2" onclick="window.close()">✕ Fechar</button>
  </div>
  <div class="cab">
    <img src="${LOGO_DATA}" alt="Support Mining">
    <div class="titulo">FICHA DE ENTREGA DE EPIS</div>
  </div>
  <p class="campo"><b>MATRÍCULA:</b> ${emp && emp.matricula ? emp.matricula : ''}</p>
  <p class="campo"><b>Nome:</b> ${requisitante}</p>
  <p class="campo"><b>Cargo/Função:</b> ${emp && emp.position ? emp.position : setor || ''}</p>
  <p class="campo"><b>OS:</b></p>
  <div class="termoTitulo">TERMO DE RESPONSABILIDADE</div>
  <p class="decl">Declaro para todos os efeitos legais que recebi do <strong>SUPPORT MINING</strong>, para meu uso exclusivo, conforme determinado na lei, os EPIs especificados neste termo de responsabilidade, comprometendo-me a mantê-los em perfeito estado de conservação, ficando ciente de que:</p>
  <p class="clausula">1- Se o EPI for danificado ou inutilizado por emprego inadequado, mau uso, negligência ou extravio, a empresa me fornecerá novo equipamento e cobrará o valor de um equipamento da mesma marca ou equivalente ao da praça.</p>
  <p class="clausula">2- Em caso de dano, inutilização ou extravio do EPI deverei comunicar imediatamente ao setor <strong>competente</strong> e a minha <strong>Liderança</strong>.</p>
  <p class="clausula">3- Terminando os serviços ou no caso de rescisão do contrato de trabalho, devolverei o(s) EPI(s) completo(s) e em perfeito estado de conservação, considerando-se o tempo do uso dele, ao setor competente.</p>
  <p class="clausula">4- Estando os EPIs em minha posse, estarei sujeito a inspeções sem prévio aviso.</p>
  <table>
    <thead>
      <tr><th>DATA</th><th>DESCRIÇÃO</th><th>C.A.</th><th>ASSINATURA</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="assin">
    <p>ASSINATURA: _______________________________________________</p>
    <p>DATA: ______/______/________</p>
  </div>
  <script>setTimeout(() => window.print(), 400);</script>
</body>
</html>`;
    openHtmlInNewTab(html);
  };

  const handlePrintPreview = () => {
    if (saidaList.length === 0) {
      setMessage('⚠️ Adicione pelo menos um item à lista antes de imprimir.');
      return;
    }
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 200);
  };

  // Dados para a folha de saída por funcionário (todos os itens da lista)
  const printSaida = {
    employeeName,
    employeeDepartment,
    items: saidaList.map((s) => ({
      item: s.item,
      quantity: s.quantity,
      areaUso: s.areaUso,
    })),
  };

  const getSecurityAlert = (item, qty) => {
    const newQty = item.quantity - qty;
    if (newQty <= item.estoque_seguranca) return '🟡 atingirá estoque de segurança';
    if (newQty <= item.estoque_minimo) return '🔴 atingirá estoque mínimo';
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Folha de Assinatura - Visível apenas na impressão */}
      {showSignatureSheet && lastSignatureData && (
        <div className="print:block hidden">
          <div className="bg-white text-black p-8 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-center mb-6">TERMO DE RESPONSABILIDADE - SAÍDA DE MATERIAL</h1>
            <div className="mb-4">
              <p><strong>Data:</strong> {new Date(lastSignatureData.date).toLocaleDateString('pt-BR')}</p>
              <p><strong>Requisitante:</strong> {lastSignatureData.employeeName}</p>
              <p><strong>Setor:</strong> {lastSignatureData.employeeDepartment || 'N/A'}</p>
            </div>
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1">Código</th>
                  <th className="border border-black px-2 py-1">Item</th>
                  <th className="border border-black px-2 py-1">Tipo</th>
                  <th className="border border-black px-2 py-1">Qtd</th>
                  <th className="border border-black px-2 py-1">Área de Uso</th>
                </tr>
              </thead>
              <tbody>
                {lastSignatureData.items.map((s, i) => (
                  <tr key={i}>
                    <td className="border border-black px-2 py-1">{s.item.code}</td>
                    <td className="border border-black px-2 py-1">{s.item.name}</td>
                    <td className="border border-black px-2 py-1">{s.item.type?.toUpperCase()}</td>
                    <td className="border border-black px-2 py-1">{s.quantity}</td>
                    <td className="border border-black px-2 py-1">{s.areaUso || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm mb-6">
              <p className="font-semibold mb-2">ORIENTAÇÕES:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Utilizar os materiais exclusivamente para fins profissionais;</li>
                <li>Zelar pela conservação e guarda adequada;</li>
                <li>Devolver ao almoxarifado quando solicitado ou ao término do uso;</li>
                <li>Comunicar imediatamente qualquer perda, dano ou extravio;</li>
                <li>Responsabilizar-se por custos de reposição em caso de mau uso;</li>
                <li>No caso de EPI: utilizar corretamente conforme orientações do fabricante;</li>
                <li>No caso de Gás: manusear com segurança, afastado de fontes de calor.</li>
              </ul>
            </div>
            <div className="flex justify-between mt-16 pt-8">
              <div className="text-center">
                <div className="border-t border-black w-48"></div>
                <p className="text-sm mt-1">Assinatura do Requisitante</p>
                <p className="text-xs">{lastSignatureData.employeeName}</p>
              </div>
              <div className="text-center">
                <div className="border-t border-black w-48"></div>
                <p className="text-sm mt-1">Assinatura do Almoxarife</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folha de Termo de Saída — Prévia (antes de registrar) - Qualquer tipo de item */}
      {showPrintPreview && saidaList.length > 0 && (
        <div className="fixed inset-0 z-[200] print:static print:block hidden">
          <div className="bg-black/70 min-h-screen print:bg-transparent">
            <div className="bg-white text-black p-8 max-w-2xl mx-auto my-8">
              <div className="flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-black"
                >
                  ✕ Fechar prévia
                </button>
              </div>
              <div className="text-black">
                <h1 className="text-xl font-bold text-center mb-2">ALMOXARIFADO — TERMO DE SAÍDA DE MATERIAL</h1>
                <p className="text-center text-sm text-gray-600 mb-4">(Prévia — imprima para entrega ao requisitante)</p>
                <div className="mb-4">
                  <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')} <strong>Horário:</strong> {new Date().toLocaleTimeString('pt-BR')}</p>
                  <p><strong>Requisitante:</strong> {employeeName}</p>
                  {employeeDepartment && <p><strong>Setor:</strong> {employeeDepartment}</p>}
                </div>
                <table className="w-full border-collapse mb-4 text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-1">Código</th>
                      <th className="border border-black px-2 py-1">Item</th>
                      <th className="border border-black px-2 py-1">Tipo</th>
                      <th className="border border-black px-2 py-1">Un</th>
                      <th className="border border-black px-2 py-1">Qtd</th>
                      <th className="border border-black px-2 py-1">Área de Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saidaList.map((s, i) => (
                      <tr key={i}>
                        <td className="border border-black px-2 py-1">{s.item.code}</td>
                        <td className="border border-black px-2 py-1">{s.item.name}</td>
                        <td className="border border-black px-2 py-1">{s.item.type?.toUpperCase() || '-'}</td>
                        <td className="border border-black px-2 py-1">{s.item.unit}</td>
                        <td className="border border-black px-2 py-1 text-center">{s.quantity}</td>
                        <td className="border border-black px-2 py-1">{s.areaUso || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm mb-2">
                  Declaro ter recebido os materiais acima relacionados em boas condições, comprometendo-me a utilizá-los exclusivamente para fins profissionais e a devolvê-los ou informar qualquer perda/dano ao almoxarifado.
                </p>
                <div className="flex justify-between mt-16 pt-8">
                  <div className="text-center">
                    <div className="border-t border-black w-48"></div>
                    <p className="text-sm mt-1">Assinatura do Requisitante</p>
                    <p className="text-xs">{employeeName}</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-48"></div>
                    <p className="text-sm mt-1">Assinatura do Almoxarife</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folha de Saída por Funcionário - Visível apenas na impressão */}
      {saidaList.length > 0 && employeeName.trim() && !showPrintPreview && (
        <div className="print:block hidden">
          <div className="bg-white text-black p-8 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-center mb-2">ALMOXARIFADO — REGISTRO DE SAÍDA DE MATERIAL</h1>
            <div className="mb-4">
              <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')} <strong>Horário:</strong> {new Date().toLocaleTimeString('pt-BR')}</p>
              <p><strong>Requisitante:</strong> {employeeName}</p>
              {employeeDepartment && <p><strong>Setor:</strong> {employeeDepartment}</p>}
            </div>
            <table className="w-full border-collapse mb-4 text-sm">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1">Código</th>
                  <th className="border border-black px-2 py-1">Item</th>
                  <th className="border border-black px-2 py-1">Tipo</th>
                  <th className="border border-black px-2 py-1">Un</th>
                  <th className="border border-black px-2 py-1">Qtd</th>
                  <th className="border border-black px-2 py-1">Área de Uso</th>
                </tr>
              </thead>
              <tbody>
                {printSaida.items.map((s, i) => (
                  <tr key={i}>
                    <td className="border border-black px-2 py-1">{s.item.code}</td>
                    <td className="border border-black px-2 py-1">{s.item.name}</td>
                    <td className="border border-black px-2 py-1">{s.item.type?.toUpperCase() || '-'}</td>
                    <td className="border border-black px-2 py-1">{s.item.unit}</td>
                    <td className="border border-black px-2 py-1 text-center">{s.quantity}</td>
                    <td className="border border-black px-2 py-1">{s.areaUso || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-16 pt-8">
              <div className="text-center">
                <div className="border-t border-black w-48"></div>
                <p className="text-sm mt-1">Assinatura do Requisitante</p>
                <p className="text-xs">{employeeName}</p>
              </div>
              <div className="text-center">
                <div className="border-t border-black w-48"></div>
                <p className="text-sm mt-1">Assinatura do Almoxarife</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface Normal */}
      <div className="print:hidden">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowDown className="w-5 h-5" />
              Saída de Material
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Seleção de item */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-300 block">Selecionar Item *</label>
                <Button
                  type="button"
                  onClick={() => openQrReader('item')}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Ler QR Code
                </Button>
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Digite para filtrar por nome ou código..."
                className="bg-gray-700 border-gray-600 text-white mb-2"
              />
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
              >
                <option value="">Selecione um item</option>
                {filteredItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name} (Qtd: {item.quantity})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Mostrando apenas itens com estoque disponível. Use a busca para filtrar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Quantidade *</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              {/* Área de utilização - obrigatória para Gás */}
              {selectedItem && items.find(i => i.id === selectedItem)?.type === 'gas' && (
                <div>
                  <label className="text-sm font-medium text-red-400 mb-1 block">Área de Utilização * (obrigatório para Gás)</label>
                  <Input
                    type="text"
                    value={areaUso}
                    onChange={(e) => setAreaUso(e.target.value)}
                    placeholder="Ex: Solda, Corte, Soldagem"
                    className="bg-gray-700 border-red-600 text-white"
                  />
                </div>
              )}
              <div className="flex items-end">
                <Button onClick={handleAddToSaida} className="bg-green-600 hover:bg-green-700 text-white w-full">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de itens para saída */}
            {saidaList.length > 0 && (
              <div className="mb-4 border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Itens para Saída ({saidaList.length})</h3>
                <div className="space-y-2">
                  {saidaList.map((saida, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex-1">
                        <span className="text-white text-sm">
                          {saida.item.code} - {saida.item.name}
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          ({saida.quantity} {saida.item.unit})
                        </span>
                        {saida.areaUso && (
                          <span className="text-blue-400 text-xs ml-2">📍 {saida.areaUso}</span>
                        )}
                        {getSecurityAlert(saida.item, saida.quantity) && (
                          <span className="text-yellow-400 text-xs ml-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {getSecurityAlert(saida.item, saida.quantity)}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFromSaida(index)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dados do Requisitante */}
            {saidaList.length > 0 && (
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold">Requisitante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-300 block">Nome do Funcionário *</label>
                      <Button
                        type="button"
                        onClick={() => openQrReader('funcionario')}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" /> Ler QR Code
                      </Button>
                    </div>
                    <div className="relative">
                    <Input
                      value={employeeName}
                      onChange={(e) => {
                        setEmployeeName(e.target.value);
                        setShowEmployeeSuggestions(true);
                        // Buscar última retirada quando o nome for preenchido
                        if (saidaList.length > 0 && e.target.value.trim().length > 2) {
                          const itemId = saidaList[0].item.id;
                          buscarUltimaRetirada(itemId, e.target.value);
                        } else {
                          setUltimaRetirada(null);
                        }
                      }}
                      onFocus={() => setShowEmployeeSuggestions(true)}
                      placeholder="Nome completo (busque ou selecione)"
                      autoComplete="off"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    {showEmployeeSuggestions && filteredEmployees.length > 0 && employeeName.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-600 bg-gray-800 shadow-xl z-30">
                        {filteredEmployees.slice(0, 15).map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectEmployee(emp)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 border-b border-gray-700 last:border-0"
                          >
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-gray-400 text-xs ml-2">
                              {emp.department || emp.position || ''}{emp.matricula ? ` • Matr. ${emp.matricula}` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Departamento / Setor</label>
                    <Input
                      value={employeeDepartment}
                      onChange={(e) => setEmployeeDepartment(e.target.value)}
                      placeholder="Ex: Produção, Manutenção"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Última retirada do mesmo item pela mesma pessoa */}
                {employeeName.trim().length > 2 && saidaList.length > 0 && (
                  <div className="p-4 bg-gray-900 border border-gray-600 rounded-lg">
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <ArrowDown className="w-4 h-4 text-blue-400" />
                      Última Retirada deste Item por {employeeName}
                    </h4>
                    {isLoadingUltima ? (
                      <p className="text-gray-400 text-sm">Buscando...</p>
                    ) : ultimaRetirada ? (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-300">
                          <span className="text-gray-400">Data:</span>{' '}
                          {new Date(ultimaRetirada.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                          {' • '}
                          <span className="text-gray-400">Quantidade:</span> {ultimaRetirada.quantity}
                          {' • '}
                          <span className="text-gray-400">Setor:</span> {ultimaRetirada.area_uso || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Observação: {ultimaRetirada.reason || 'Nenhuma'}
                        </p>
                        <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Item já foi retirado anteriormente por esta pessoa. Confirme antes de registrar nova saída.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        ✅ Nenhuma retirada anterior encontrada para este item por {employeeName}.
                      </p>
                    )}
                  </div>
                )}

                {/* Termo de Responsabilidade para EPI/Ferramenta */}
                {hasEPIorFerramenta && (
                  <div className="p-4 bg-gray-900 border border-gray-600 rounded-lg">
                    <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-yellow-400" />
                      TERMO DE RESPONSABILIDADE
                    </h4>
                    <ul className="text-gray-400 text-xs leading-relaxed space-y-1 mb-3">
                      <li>• Utilizar o item exclusivamente para fins profissionais;</li>
                      <li>• Zelar pela conservação e guarda adequada;</li>
                      <li>• Devolver ao almoxarifado quando solicitado;</li>
                      <li>• Comunicar imediatamente qualquer perda, dano ou extravio;</li>
                      <li>• Responsabilizar-se por custos de reposição em caso de mau uso;</li>
                      <li>• No caso de EPI: utilizar corretamente conforme orientações do fabricante;</li>
                      <li>• No caso de Gás: manusear com segurança.</li>
                    </ul>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termAccepted}
                        onChange={(e) => setTermAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4"
                      />
                      <span className="text-gray-300 text-sm">
                        Declaro que li e aceito o termo de responsabilidade.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {showQrReader && (
              <QrCodeReader onScan={handleQrScan} onClose={() => setShowQrReader(false)} />
            )}

            {message && (
              <div className={`p-3 rounded-md text-sm mt-4 ${
                message.includes('✅')
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : message.includes('⚠️')
                  ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-600'
                  : 'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {message}
              </div>
            )}

            {saidaList.length > 0 && (
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleRegistrarSaida} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : (
                    <>
                      <FileText className="w-4 h-4 mr-1" />
                      Registrar Saída{hasEPIorFerramenta ? ' e Gerar Termo' : ''}
                    </>
                  )}
                </Button>
                {showSignatureSheet && (
                  <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white">
                    <Printer className="w-4 h-4 mr-1" /> Imprimir Termo/Registro
                  </Button>
                )}
              </div>
            )}

            {/* Prévia de impressão antes de registrar (qualquer tipo de item) */}
            {saidaList.length > 0 && employeeName.trim() && !showSignatureSheet && (
              <div className="mt-4 p-4 bg-gray-700/50 border border-gray-600 rounded-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-gray-300">
                    📄 <strong>{saidaList.length} {saidaList.length === 1 ? 'item adicionado' : 'itens adicionados'}</strong> para saída de <strong>{employeeName}</strong>{employeeDepartment ? ` (${employeeDepartment})` : ''}
                  </p>
                  <Button
                    type="button"
                    onClick={handlePrintPreview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                  >
                    <Printer className="w-4 h-4 mr-1" /> Visualizar / Imprimir Termo de Saída
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  O termo de saída pode ser impresso antes ou depois de registrar. Para EPI/Ferramenta também é gerado o Termo de Responsabilidade após o registro.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de saídas recentes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">📋 Últimas Saídas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">As saídas são registradas e podem ser consultadas na aba Histórico Diário.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
