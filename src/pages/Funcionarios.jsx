import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Edit, Trash, Upload, Download, FileSpreadsheet } from 'lucide-react';
import {
  exportEmployeesToExcel,
  importEmployeesFromExcel,
  downloadEmployeeTemplate,
} from '@/utils/employeeExcelUtils';

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    matricula: '',
    cargo: '',
    departamento: '',
    permissao: 'user',
  });
  const [message, setMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const insertData = {
        name: formData.nome,
        matricula: formData.matricula || null,
        position: formData.cargo,
        department: formData.departamento,
      };

      if (editingFunc) {
        const { error } = await supabase
          .from('employees')
          .update(insertData)
          .eq('id', editingFunc.id);
        if (error) throw error;
        setMessage('✅ Funcionário atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([insertData]);
        if (error) throw error;
        setMessage('✅ Funcionário adicionado com sucesso!');
      }

      setIsModalOpen(false);
      setEditingFunc(null);
      setFormData({
        nome: '',
        email: '',
        matricula: '',
        cargo: '',
        departamento: '',
        permissao: 'user',
      });
      await loadFuncionarios();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este funcionário?')) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);
        if (error) throw error;
        await loadFuncionarios();
        setMessage('✅ Funcionário deletado com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(`❌ Erro: ${err.message}`);
      }
    }
  };

  const handleImportEmployees = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage('');
    try {
      const importedEmployees = await importEmployeesFromExcel(file);

      const { error } = await supabase
        .from('employees')
        .insert(importedEmployees);

      if (error) throw error;

      setImportMessage(`✅ ${importedEmployees.length} funcionário(s) importado(s) com sucesso!`);
      await loadFuncionarios();

      setTimeout(() => setImportMessage(''), 5000);
    } catch (err) {
      setImportMessage(`❌ Erro ao importar: ${err.message}`);
    }

    e.target.value = '';
  };

  const handleExportEmployees = () => {
    exportEmployeesToExcel(funcionarios);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Funcionários ({funcionarios.length})
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  setEditingFunc(null);
                  setFormData({
                    nome: '',
                    email: '',
                    matricula: '',
                    cargo: '',
                    departamento: '',
                    permissao: 'user',
                  });
                  setIsModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
              <Button
                onClick={handleExportEmployees}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                onClick={downloadEmployeeTemplate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Modelo
              </Button>
              <label className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportEmployees}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`p-3 rounded-md text-sm mb-4 ${
              message.includes('✅')
                ? 'bg-green-900 text-green-300 border border-green-700'
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {message}
            </div>
          )}

          {importMessage && (
            <div className={`p-3 rounded-md text-sm mb-4 ${
              importMessage.includes('✅')
                ? 'bg-green-900 text-green-300 border border-green-700'
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {importMessage}
            </div>
          )}

          {funcionarios.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum funcionário cadastrado.</p>
              <p className="text-sm">
                Use o botão "Novo" para adicionar manualmente ou "Importar" para carregar uma planilha.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Nome</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Matrícula</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Email</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Cargo</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Departamento</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Permissão</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((func) => (
                    <tr key={func.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                      <td className="py-3 px-2 text-white text-sm font-medium">{func.name}</td>
                      <td className="py-3 px-2 text-gray-400 text-sm">{func.matricula || '-'}</td>
                      <td className="py-3 px-2 text-gray-400 text-sm">{func.email || '-'}</td>
                      <td className="py-3 px-2 text-gray-400 text-sm">{func.position || 'N/A'}</td>
                      <td className="py-3 px-2 text-gray-400 text-sm">{func.department || 'N/A'}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900 text-blue-300">
                          Usuário
                        </span>
                      </td>
                      <td className="py-3 px-2 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingFunc(func);
                            setFormData({
                              nome: func.name || '',
                              email: func.email || '',
                              matricula: func.matricula || '',
                              cargo: func.position || '',
                              departamento: func.department || '',
                              permissao: 'user',
                            });
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(func.id)}
                          className="text-red-400 border-red-400"
                        >
                          <Trash className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-white text-lg font-semibold mb-4">
              {editingFunc ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Nome *</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Nome completo"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Matrícula (opcional)</label>
                <Input
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="Ex: 123456"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Email (opcional)</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Cargo</label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Operador de Máquinas"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Departamento</label>
                <Input
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  placeholder="Ex: Produção"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Permissão</label>
                <select
                  value={formData.permissao}
                  onChange={(e) => setFormData({ ...formData, permissao: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingFunc(null);
                  }}
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
