import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown, ShieldCheck, FileText, Printer, Plus, Trash2, AlertTriangle } from 'lucide-react';

export function SaidaMaterial({ items, onItemsUpdated, userEmail }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
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

  const filteredItems = items.filter(item => 
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
            {/* Busca de item */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Buscar Item *</label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome ou código..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Selecionar Item *</label>
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
              </div>
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
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Nome do Funcionário *</label>
                    <Input
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Nome completo"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
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
                    <Printer className="w-4 h-4 mr-1" /> Imprimir
                  </Button>
                )}
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
