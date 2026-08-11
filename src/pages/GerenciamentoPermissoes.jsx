import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, ShieldCheck, ShieldAlert, UserPlus, RefreshCw, Crown } from 'lucide-react';

export function GerenciamentoPermissoes({ currentUser }) {
  const [permissions, setPermissions] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setMessage(`❌ Erro ao carregar permissões: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddPermission = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!newEmail.trim()) {
      setMessage('⚠️ Informe o email do usuário.');
      setIsLoading(false);
      return;
    }

    try {
      // Verifica se já existe
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_email', newEmail.trim())
        .single();

      if (existing) {
        // Atualizar permissão existente
        const { error } = await supabase
          .from('user_permissions')
          .update({ access_level: newRole })
          .eq('user_email', newEmail.trim());
        if (error) throw error;
        setMessage(`✅ Permissão de ${newEmail.trim()} atualizada para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}!`);
      } else {
        // Inserir nova permissão
        const { error } = await supabase
          .from('user_permissions')
          .insert([{ user_email: newEmail.trim(), access_level: newRole }]);
        if (error) throw error;
        setMessage(`✅ ${newEmail.trim()} adicionado como ${newRole === 'admin' ? 'Administrador' : 'Usuário'}!`);
      }

      setNewEmail('');
      await loadPermissions();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (email, newAccessLevel) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({ access_level: newAccessLevel })
        .eq('user_email', email);
      if (error) throw error;

      setMessage(`✅ Permissão de ${email} alterada para ${newAccessLevel === 'admin' ? 'Administrador' : 'Usuário'}!`);
      await loadPermissions();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePermission = async (email) => {
    if (email === currentUser?.email) {
      setMessage('⚠️ Você não pode remover sua própria permissão!');
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover as permissões de ${email}?`)) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('user_permissions')
          .delete()
          .eq('user_email', email);
        if (error) throw error;

        setMessage(`✅ Permissões de ${email} removidas com sucesso!`);
        await loadPermissions();
        setTimeout(() => setMessage(''), 5000);
      } catch (err) {
        setMessage(`❌ Erro: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const adminCount = permissions.filter(p => p.access_level === 'admin').length;
  const userCount = permissions.filter(p => p.access_level === 'user').length;

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{adminCount}</p>
                <p className="text-sm text-gray-400">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{userCount}</p>
                <p className="text-sm text-gray-400">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{permissions.length}</p>
                <p className="text-sm text-gray-400">Total Cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar/Alterar Permissão */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Adicionar / Alterar Permissão
          </CardTitle>
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

          <form onSubmit={handleAddPermission} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Email do Usuário</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="text-sm font-medium text-gray-300 mb-2 block">Nível de Acesso</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2.5"
              >
                <option value="user">👤 Usuário</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Processando...' : 'Salvar'}
              </Button>
            </div>
          </form>

          <p className="text-xs text-gray-500 mt-3">
            💡 Se o email já existir, a permissão será atualizada automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Lista de Permissões */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Usuários com Permissões ({permissions.length})
            </CardTitle>
            <Button
              onClick={loadPermissions}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 text-gray-300"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum usuário com permissão cadastrado.</p>
              <p className="text-sm">
                Use o formulário acima para adicionar o primeiro administrador.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Email</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Nível de Acesso</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Cadastrado em</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-2 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => {
                    const isAdmin = perm.access_level === 'admin';
                    const isCurrentUser = perm.user_email === currentUser?.email;

                    return (
                      <tr key={perm.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                        <td className="py-3 px-2 text-white text-sm font-medium">
                          {perm.user_email}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                              (Você)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${
                            isAdmin
                              ? 'bg-purple-900 text-purple-300 border border-purple-700'
                              : 'bg-blue-900 text-blue-300 border border-blue-700'
                          }`}>
                            {isAdmin ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {isAdmin ? 'Administrador' : 'Usuário'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-400 text-sm">
                          {perm.created_at ? new Date(perm.created_at).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2 flex-wrap">
                            {/* Botão para alternar permissão */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoading || isCurrentUser}
                              onClick={() => handleChangeRole(
                                perm.user_email,
                                isAdmin ? 'user' : 'admin'
                              )}
                              className={isAdmin
                                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                : 'bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-900/50'
                              }
                              title={isAdmin ? 'Tornar Usuário' : 'Tornar Administrador'}
                            >
                              {isAdmin ? 'Tornar Usuário' : '👑 Admin'}
                            </Button>

                            {/* Botão para remover */}
                            {!isCurrentUser && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isLoading}
                                onClick={() => handleRemovePermission(perm.user_email)}
                                className="text-red-400 border-red-400 hover:bg-red-900/20"
                                title="Remover permissão"
                              >
                                Remover
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base">ℹ️ Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400 space-y-2">
          <p>
            <strong className="text-purple-300">Administrador:</strong> Tem acesso total ao sistema, incluindo gerenciamento de funcionários, permissões, backup e todas as funcionalidades.
          </p>
          <p>
            <strong className="text-blue-300">Usuário:</strong> Tem acesso às funcionalidades operacionais (controle de estoque, saída de material, reposição, solicitações, alertas e relatórios).
          </p>
          <p className="text-xs text-gray-500">
            💡 As permissões são aplicadas imediatamente. O usuário precisa fazer logout e login novamente para que as mudanças tenham efeito.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
