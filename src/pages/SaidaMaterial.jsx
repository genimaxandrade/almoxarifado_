import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown, ShieldCheck, FileText } from 'lucide-react';

export function SaidaMaterial({ items, onItemsUpdated, userEmail }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeDepartment, setEmployeeDepartment] = useState('');
  const [termAccepted, setTermAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o item selecionado é EPI ou Ferramenta
  const selectedItemData = items.find(i => i.id === selectedItem);
  const requiresSignature = selectedItemData?.type === 'epi' || selectedItemData?.type === 'ferramenta';

  const handleSaida = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const item = items.find(i => i.id === selectedItem);
      if (!item) {
        setMessage('❌ Item não encontrado!');
        setIsLoading(false);
        return;
      }

      const newQuantity = item.quantity - parseInt(quantity);
      if (newQuantity < 0) {
        setMessage('❌ Quantidade insuficiente em estoque!');
        setIsLoading(false);
        return;
      }

      // Se for EPI ou Ferramenta, exigir assinatura e termo
      if (requiresSignature) {
        if (!employeeName.trim()) {
          setMessage('⚠️ É obrigatório informar o nome do funcionário que está retirando.');
          setIsLoading(false);
          return;
        }
        if (!termAccepted) {
          setMessage('⚠️ É obrigatório aceitar o termo de responsabilidade.');
          setIsLoading(false);
          return;
        }

        // Registrar assinatura/termo de responsabilidade
        const { error: sigError } = await supabase
          .from('item_signatures')
          .insert([{
            item_id: item.id,
            item_name: item.name,
            item_type: item.type,
            employee_name: employeeName,
            employee_department: employeeDepartment,
            signature_name: employeeName,
            term_accepted: true,
            signed_at: new Date().toISOString()
          }]);

        if (sigError) throw sigError;
      }

      // Atualizar quantidade do item
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('id', selectedItem);

      if (updateError) throw updateError;

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert([{
          item_id: selectedItem,
          item_code: item.code,
          item_name: item.name,
          movement_type: 'saida',
          quantity: parseInt(quantity),
          reason: reason,
          date: new Date().toISOString()
        }]);

      if (movError) throw movError;

      setMessage('✅ Saída registrada com sucesso!');
      setSelectedItem('');
      setQuantity('');
      setReason('');
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

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ArrowDown className="w-5 h-5" />
            Saída de Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaida} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Item *</label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                required
              >
                <option value="">Selecione um item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Qtd: {item.quantity}) {item.type === 'epi' ? '⚠️EPI' : item.type === 'ferramenta' ? '🔧Ferramenta' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Aviso quando EPI ou Ferramenta é selecionado */}
            {requiresSignature && (
              <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <p className="text-yellow-300 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <strong>⚠️ Este item requer assinatura e termo de responsabilidade.</strong>
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Quantidade *</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
                min="1"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Motivo *</label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Uso em produção"
                required
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Campos de assinatura - aparecem apenas para EPI e Ferramenta */}
            {requiresSignature && (
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-yellow-400" />
                  Termo de Responsabilidade
                </h3>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Nome do Funcionário *
                  </label>
                  <Input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Nome completo do funcionário"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Departamento / Setor
                  </label>
                  <Input
                    type="text"
                    value={employeeDepartment}
                    onChange={(e) => setEmployeeDepartment(e.target.value)}
                    placeholder="Ex: Produção, Manutenção, TI"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                {/* Termo de Responsabilidade */}
                <div className="p-4 bg-gray-900 border border-gray-600 rounded-lg">
                  <h4 className="text-white font-semibold text-sm mb-2">TERMO DE RESPONSABILIDADE</h4>
                  <p className="text-gray-400 text-xs leading-relaxed mb-3">
                    Declaro que recebi o item acima descrito em boas condições e me comprometo a:
                  </p>
                  <ul className="text-gray-400 text-xs leading-relaxed space-y-1 mb-3">
                    <li>• Utilizar o item exclusivamente para fins profissionais;</li>
                    <li>• Zelar pela conservação e guarda adequada do item;</li>
                    <li>• Devolver o item ao almoxarifado quando solicitado ou ao término do uso;</li>
                    <li>• Comunicar imediatamente qualquer perda, dano ou extravio;</li>
                    <li>• Responsabilizar-me por eventuais custos de reposição em caso de mau uso;</li>
                    <li>• No caso de EPI: utilizar corretamente conforme orientações do fabricante.</li>
                  </ul>
                  
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termAccepted}
                      onChange={(e) => setTermAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                      required
                    />
                    <span className="text-gray-300 text-sm">
                      Declaro que li e aceito o termo de responsabilidade acima. 
                      Assumo total responsabilidade pelo item retirado.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('✅')
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : message.includes('⚠️')
                  ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-600'
                  : 'bg-red-900 text-red-300 border border-red-700'
              }`}>
                {message}
              </div>
            )}
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full" disabled={isLoading}>
              {isLoading ? 'Processando...' : (requiresSignature ? '📝 Registrar Saída com Assinatura' : 'Registrar Saída')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
