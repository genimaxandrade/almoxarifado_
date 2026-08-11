import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Edit, Trash } from 'lucide-react';

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState(null);
  const [formData, setFormData] = useState({ nome: '', email: '', cargo: '', permissao: 'user' });
  const [message, setMessage] = useState('');

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
    try {
      if (editingFunc) {
        const { error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', editingFunc.id);
        if (error) throw error;
        setMessage('✅ Funcionário atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([formData]);
        if (error) throw error;
        setMessage('✅ Funcionário adicionado com sucesso!');
      }

      setIsModalOpen(false);
      setEditingFunc(null);
      setFormData({ nome: '', email: '', cargo: '', permissao: 'user' });
      await loadFuncionarios();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
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

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Funcionários
            </CardTitle>
            <Button 
              onClick={() => {
                setEditingFunc(null);
                setFormData({ nome: '', email: '', cargo: '', permissao: 'user' });
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
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

          {funcionarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum funcionário cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-2 text-sm">Nome</th>
                    <th className="text-left text-gray-400 font-medium py-2 text-sm">Email</th>
                    <th className="text-left text-gray-400 font-medium py-2 text-sm">Cargo</th>
                    <th className="text-left text-gray-400 font-medium py-2 text-sm">Permissão</th>
                    <th className="text-left text-gray-400 font-medium py-2 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((func) => (
                    <tr key={func.id} className="border-b border-gray-700">
                      <td className="py-3 text-white text-sm">{func.name}</td>
                      <td className="py-3 text-gray-400 text-sm">{func.email}</td>
                      <td className="py-3 text-gray-400 text-sm">{func.position || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          func.access_level === 'admin'
                            ? 'bg-purple-900 text-purple-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          {func.access_level === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="py-3 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingFunc(func);
                            setFormData({
                              nome: func.name,
                              email: func.email,
                              cargo: func.position || '',
                              permissao: func.access_level || 'user',
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-white text-lg font-semibold mb-4">
              {editingFunc ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Nome</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Cargo</label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Permissão</label>
                <select
                  value={formData.permissao}
                  onChange={(e) => setFormData({ ...formData, permissao: e.target.value })}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
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
