import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, ShieldCheck, Printer, Plus, Trash2, UserCheck, Camera } from 'lucide-react';
import { QrCodeReader } from '@/components/QrCodeReader';

export function EntregaFerramentas({ userEmail }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [ferramentas, setFerramentas] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [obs, setObs] = useState('');
  const [termAccepted, setTermAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entregaList, setEntregaList] = useState([]);
  const [showTermo, setShowTermo] = useState(false);
  const [lastTermoData, setLastTermoData] = useState(null);
  const [showQrReader, setShowQrReader] = useState(false);
  const [qrMode, setQrMode] = useState('funcionario');

  useEffect(() => {
    loadFuncionarios();
    loadFerramentas();
  }, []);

  const loadFuncionarios = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    setFuncionarios(data || []);
  };

  const loadFerramentas = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .in('type', ['ferramenta', 'epi', 'equipamento'])
      .order('name');
    setFerramentas(data || []);
  };

  // Tratamento do QR Code lido
  const handleQrScan = (valor) => {
    const v = valor.trim().toUpperCase();
    if (v.startsWith('FUNC:')) {
      const codigo = v.replace('FUNC:', '');
      const emp = funcionarios.find(f =>
        f.matricula?.toUpperCase() === codigo || f.name.replace(/\s+/g, '_').toUpperCase() === codigo
      );
      if (emp) {
        handleSelectEmployee(emp);
        setMessage(`✅ Funcionário lido: ${emp.name}`);
      } else {
        setMessage(`❌ Funcionário com código "${codigo}" não encontrado.`);
      }
      setTimeout(() => setMessage(''), 4000);
    } else if (v.startsWith('MAT:')) {
      const codigo = v.replace('MAT:', '');
      const item = ferramentas.find(f => f.code.toUpperCase() === codigo);
      if (item) {
        setSelectedItem(item.id);
        setItemSearch('');
        setMessage(`✅ Ferramenta lida: ${item.code} - ${item.name}`);
      } else {
        setMessage(`❌ Ferramenta com código "${codigo}" não encontrada (ou sem estoque).`);
      }
      setTimeout(() => setMessage(''), 4000);
    } else {
      setMessage(`❌ QR Code não reconhecido: ${valor}`);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const openQrReader = (mode) => {
    setQrMode(mode);
    setShowQrReader(true);
  };

  const filteredFuncionarios = funcionarios
    .filter(f =>
      !employeeSearch ||
      f.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      f.matricula?.toLowerCase().includes(employeeSearch.toLowerCase())
    )
    .slice(0, 40);

  const filteredFerramentas = ferramentas
    .filter(f => f.quantity > 0)
    .filter(f =>
      !itemSearch ||
      f.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      f.code.toLowerCase().includes(itemSearch.toLowerCase())
    )
    .slice(0, 40);

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(emp.name);
  };

  const handleAddToEntrega = () => {
    if (!selectedEmployee) {
      setMessage('⚠️ Selecione um funcionário na lista acima.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (!selectedItem) {
      setMessage('⚠️ Selecione uma ferramenta na lista.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const item = ferramentas.find(f => f.id === selectedItem);
    if (!item) return;

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setMessage('⚠️ Informe uma quantidade válida.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (qty > item.quantity) {
      setMessage('❌ Quantidade insuficiente em estoque!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const existingIndex = entregaList.findIndex(e => e.item.id === selectedItem);
    if (existingIndex >= 0) {
      const updated = [...entregaList];
      updated[existingIndex].quantity += qty;
      setEntregaList(updated);
    } else {
      setEntregaList([...entregaList, { item, quantity: qty }]);
    }

    setSelectedItem('');
    setQuantity('1');
    setMessage('');
  };

  const removeFromEntrega = (index) => {
    setEntregaList(entregaList.filter((_, i) => i !== index));
  };

  const handleConfirmarEntrega = async () => {
    if (entregaList.length === 0) {
      setMessage('⚠️ Adicione pelo menos uma ferramenta à lista.');
      return;
    }
    if (!selectedEmployee) {
      setMessage('⚠️ Selecione um funcionário.');
      return;
    }
    if (!termAccepted) {
      setMessage('⚠️ É obrigatório aceitar o termo de responsabilidade.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const now = new Date().toISOString();

      for (const entrega of entregaList) {
        const item = entrega.item;
        const newQuantity = item.quantity - entrega.quantity;

        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('items')
          .update({ quantity: newQuantity })
          .eq('id', item.id);
        if (updateError) throw updateError;

        // Registrar movimentação no histórico
        await supabase
          .from('stock_movements')
          .insert([{
            item_id: item.id,
            item_code: item.code,
            item_name: item.name,
            type: 'saida',
            quantity: entrega.quantity,
            reason: `ENTREGA para funcionário: ${selectedEmployee.name}${selectedEmployee.matricula ? ` (Matrícula: ${selectedEmployee.matricula})` : ''} - Setor: ${selectedEmployee.department || 'N/A'}${obs ? ` - Obs: ${obs}` : ''}`,
            area_uso: selectedEmployee.department || null,
          }]);

        // Registrar na tabela de entregas de ferramentas
        await supabase
          .from('tool_deliveries')
          .insert([{
            employee_id: selectedEmployee.id,
            employee_name: selectedEmployee.name,
            item_id: item.id,
            item_name: item.name,
            item_code: item.code,
            quantity: entrega.quantity,
            type: 'entrega',
            status: 'entregue',
            obs: obs || null,
            delivered_by: userEmail || null,
            created_at: now,
          }]);

        // Registrar assinatura
        await supabase
          .from('item_signatures')
          .insert([{
            item_id: item.id,
            item_name: item.name,
            item_type: item.type,
            employee_name: selectedEmployee.name,
            employee_department: selectedEmployee.department,
            signature_name: selectedEmployee.name,
            term_accepted: true,
            signed_at: now,
          }]);
      }

      setLastTermoData({
        items: entregaList,
        employee: selectedEmployee,
        date: now,
        obs,
      });
      setShowTermo(true);

      setMessage('✅ Entrega registrada com sucesso!');
      setEntregaList([]);
      setSelectedEmployee('');
      setEmployeeSearch('');
      setSelectedItem('');
      setQuantity('1');
      setObs('');
      setTermAccepted(false);

      await loadFerramentas();
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

  return (
    <div className="space-y-6">
      {/* Termo de Entrega - Visível apenas na impressão */}
      {showTermo && lastTermoData && (
        <div className="print:block hidden">
          <div className="bg-white text-black p-8 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-center mb-6">TERMO DE ENTREGA DE FERRAMENTA/EPI</h1>
            <div className="mb-4">
              <p><strong>Data:</strong> {new Date(lastTermoData.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              <p><strong>Funcionário:</strong> {lastTermoData.employee.name}</p>
              {lastTermoData.employee.matricula && (
                <p><strong>Matrícula:</strong> {lastTermoData.employee.matricula}</p>
              )}
              <p><strong>Setor:</strong> {lastTermoData.employee.department || 'N/A'}</p>
              {lastTermoData.obs && <p><strong>Observação:</strong> {lastTermoData.obs}</p>}
            </div>
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1">Código</th>
                  <th className="border border-black px-2 py-1">Ferramenta/EPI</th>
                  <th className="border border-black px-2 py-1">Tipo</th>
                  <th className="border border-black px-2 py-1">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {lastTermoData.items.map((e, i) => (
                  <tr key={i}>
                    <td className="border border-black px-2 py-1">{e.item.code}</td>
                    <td className="border border-black px-2 py-1">{e.item.name}</td>
                    <td className="border border-black px-2 py-1">{e.item.type?.toUpperCase()}</td>
                    <td className="border border-black px-2 py-1">{e.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-sm mb-6">
              <p className="font-semibold mb-2">TERMO DE RESPONSABILIDADE:</p>
              <p className="mb-2">
                Declaro que recebi os itens acima relacionados e me comprometo a:
              </p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Utilizar exclusivamente para fins profissionais;</li>
                <li>Zelar pela conservação e guarda adequada;</li>
                <li>Devolver ao almoxarifado quando solicitado ou ao término do uso;</li>
                <li>Comunicar imediatamente qualquer perda, dano ou extravio;</li>
                <li>Responsabilizar-me por custos de reposição em caso de mau uso ou negligência;</li>
                <li>No caso de EPI: utilizar corretamente conforme orientações do fabricante e NR-6.</li>
              </ul>
            </div>
            <div className="flex justify-between mt-16 pt-8">
              <div className="text-center">
                <div className="border-t border-black w-48"></div>
                <p className="text-sm mt-1">Assinatura do Funcionário</p>
                <p className="text-xs">{lastTermoData.employee.name}</p>
                {lastTermoData.employee.matricula && <p className="text-xs">Matrícula: {lastTermoData.employee.matricula}</p>}
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
              <Wrench className="w-5 h-5" />
              Entrega de Ferramentas por Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('✅')
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : 'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* 1. Selecionar Funcionário */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300 block">
                  1. Funcionário *
                </label>
                <Button
                  type="button"
                  onClick={() => openQrReader('funcionario')}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Ler QR Code
                </Button>
              </div>
              <Input
                placeholder="🔍 Buscar por nome ou matrícula..."
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  if (e.target.value === '') setSelectedEmployee('');
                }}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              />
              {!selectedEmployee && filteredFuncionarios.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 rounded-md border border-gray-600">
                  {filteredFuncionarios.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 border-b border-gray-600 last:border-0 flex justify-between"
                    >
                      <span>{emp.name}</span>
                      <span className="text-gray-400">
                        {emp.matricula ? `Mat. ${emp.matricula}` : emp.department || ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedEmployee && (
                <div className="mt-2 p-3 bg-blue-900/30 border border-blue-700 rounded-md flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300">
                    {selectedEmployee.name}
                    {selectedEmployee.matricula && ` (Matrícula: ${selectedEmployee.matricula})`}
                    {selectedEmployee.department && ` - ${selectedEmployee.department}`}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Adicionar Ferramentas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300 block">
                    2. Buscar Ferramenta/EPI
                  </label>
                  <Button
                    type="button"
                    onClick={() => openQrReader('item')}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                  >
                    <Camera className="w-3.5 h-3.5 mr-1" /> Ler QR Code
                  </Button>
                </div>
                <Input
                  placeholder="🔍 Nome ou código..."
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    if (e.target.value === '') { setSelectedItem(''); }
                  }}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
                {!selectedItem && filteredFerramentas.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 rounded-md border border-gray-600">
                    {filteredFerramentas.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedItem(f.id);
                          setItemSearch(f.name);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 border-b border-gray-600 last:border-0"
                      >
                        {f.code} - {f.name} (Estoque: {f.quantity})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  3. Quantidade
                </label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddToEntrega}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de itens */}
            {entregaList.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Itens para entrega:</label>
                <div className="bg-gray-700 rounded-md border border-gray-600 divide-y divide-gray-600">
                  {entregaList.map((e, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between text-sm text-gray-200">
                      <span>{e.item.code} - {e.item.name} ({e.item.type?.toUpperCase()})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Qtd: {e.quantity}</span>
                        <button
                          type="button"
                          onClick={() => removeFromEntrega(i)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observação */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Observação (opcional)
              </label>
              <Input
                placeholder="Ex: Uso na manutenção preventiva..."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              />
            </div>

            {/* Termo */}
            {entregaList.length > 0 && selectedEmployee && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-md">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termAccepted}
                    onChange={(e) => setTermAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4"
                  />
                  <span className="text-sm text-yellow-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Declaro que o funcionário foi informado sobre as responsabilidades de uso, conservação e devolução dos itens entregues, conforme NR-6 e normas internas.
                  </span>
                </label>
              </div>
            )}

            <Button
              type="button"
              onClick={handleConfirmarEntrega}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Registrando...' : '✅ Confirmar Entrega e Gerar Termo'}
            </Button>

            {showTermo && lastTermoData && (
              <Button
                type="button"
                onClick={handlePrint}
                variant="outline"
                className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Termo de Entrega
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
