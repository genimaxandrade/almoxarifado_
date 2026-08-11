import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { usePermissions } from '@/hooks/usePermissions';
import { ItemModal } from '@/components/ItemModal';
import { exportItemsToExcel, importItemsFromExcel, downloadTemplate } from '@/utils/excelUtils';

// Páginas
import { SaidaMaterial } from '@/pages/SaidaMaterial';
import { ReposicaoEstoque } from '@/pages/ReposicaoEstoque';
import { SolicitacoesCompra } from '@/pages/SolicitacoesCompra';
import { Alertas } from '@/pages/Alertas';
import { HistoricoDiario } from '@/pages/HistoricoDiario';
import { RelatorioMensal } from '@/pages/RelatorioMensal';
import { Estatisticas } from '@/pages/Estatisticas';
import { HistoricoPrecos } from '@/pages/HistoricoPrecos';
import { Graficos } from '@/pages/Graficos';
import { Funcionarios } from '@/pages/Funcionarios';
import { Etiquetas } from '@/pages/Etiquetas';
import { Backup } from '@/pages/Backup';
import { Ajuda } from '@/pages/Ajuda';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [userName, setUserName] = useState('');
  const [currentPage, setCurrentPage] = useState('saida');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [importError, setImportError] = useState('');

  // Permissões
  const { userRole } = usePermissions(user);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          extractUserName(session.user.email);
        }
        setLoading(false);
      }
    );
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        extractUserName(session.user.email);
      }
    } catch (err) {
      console.error('Erro ao verificar usuário:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractUserName = (email) => {
    if (email) {
      const name = email.split('@')[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  const loadItems = async () => {
    try {
      const { data, error } = await supabase.from('items').select('*');
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Verifique seu email para confirmar!');
        setEmail('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setItems([]);
      setUserName('');
      setCurrentPage('saida');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const handleSaveItem = async (formData) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('items').insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadItems();
    } catch (err) {
      setError(err.message || 'Erro ao salvar item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este item?')) {
      try {
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
        await loadItems();
      } catch (err) {
        setError(err.message || 'Erro ao deletar item');
      }
    }
  };

  const handleExportItems = () => {
    exportItemsToExcel(items);
  };

  const handleImportItems = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    try {
      const importedItems = await importItemsFromExcel(file);
      
      const { error } = await supabase.from('items').insert(importedItems);
      if (error) throw error;

      setImportError(`✅ ${importedItems.length} item(ns) importado(s) com sucesso!`);
      await loadItems();
      
      setTimeout(() => setImportError(''), 3000);
    } catch (err) {
      setImportError(`❌ Erro ao importar: ${err.message}`);
    }

    e.target.value = '';
  };

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
  };

  // Renderizar página atual
  const renderPage = () => {
    switch (currentPage) {
      case 'controle':
        return null; // Será renderizado abaixo
      case 'saida':
        return <SaidaMaterial items={items} />;
      case 'reposicao':
        return <ReposicaoEstoque items={items} />;
      case 'solicitacoes':
        return <SolicitacoesCompra />;
      case 'alertas':
        return <Alertas />;
      case 'historico_diario':
        return <HistoricoDiario />;
      case 'relatorio_mensal':
        return <RelatorioMensal />;
      case 'estatisticas':
        return <Estatisticas />;
      case 'historico_precos':
        return <HistoricoPrecos />;
      case 'graficos':
        return <Graficos />;
      case 'funcionarios':
        return <Funcionarios />;
      case 'etiquetas':
        return <Etiquetas />;
      case 'backup':
        return <Backup />;
      case 'ajuda':
        return <Ajuda />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-gray-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">Almoxarifado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                />
              </div>
              {error && (
                <div className={`p-3 rounded-md text-sm ${
                  error.includes('Verifique') 
                    ? 'bg-green-900 text-green-300 border border-green-700' 
                    : 'bg-red-900 text-red-300 border border-red-700'
                }`}>
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={loading}
              >
                {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        userRole={userRole}
        userName={userName}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 lg:pl-[17rem]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white text-xl font-semibold">
                Bem-vindo, {userName}
              </h2>
              <p className="text-gray-400 text-sm capitalize">
                {userRole === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 lg:pl-[17rem]">
          {currentPage === 'controle' ? (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <CardTitle className="text-white">Itens em Estoque</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => {
                          setEditingItem(null);
                          setIsModalOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        + Novo Item
                      </Button>
                      <Button
                        onClick={handleExportItems}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        📥 Exportar
                      </Button>
                      <Button
                        onClick={downloadTemplate}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        📋 Modelo
                      </Button>
                      <label className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md cursor-pointer inline-block">
                        📤 Importar
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleImportItems}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {importError && (
                    <div className={`p-3 rounded-md text-sm mb-4 ${
                      importError.includes('✅')
                        ? 'bg-green-900 text-green-300 border border-green-700'
                        : 'bg-red-900 text-red-300 border border-red-700'
                    }`}>
                      {importError}
                    </div>
                  )}
                  {error && (
                    <div className="p-3 rounded-md text-sm mb-4 bg-red-900 text-red-300 border border-red-700">
                      {error}
                    </div>
                  )}
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum item encontrado. Crie o primeiro item!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700 border-b border-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Código</th>
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Nome</th>
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Tipo</th>
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Unidade</th>
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Quantidade</th>
                            <th className="px-4 py-3 text-left text-gray-300 font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr 
                              key={item.id} 
                              className={`border-t border-gray-700 hover:bg-gray-700 transition ${
                                index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                              }`}
                            >
                              <td className="px-4 py-3 text-gray-300">{item.code}</td>
                              <td className="px-4 py-3 text-gray-300">{item.name}</td>
                              <td className="px-4 py-3 text-gray-400 text-sm">{item.type}</td>
                              <td className="px-4 py-3 text-gray-400">{item.unit}</td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  item.quantity > 10 
                                    ? 'bg-green-900 text-green-300' 
                                    : item.quantity > 0 
                                    ? 'bg-yellow-900 text-yellow-300' 
                                    : 'bg-red-900 text-red-300'
                                }`}>
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsModalOpen(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Deletar
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
            </div>
          ) : (
            renderPage()
          )}
        </div>
      </div>

      {/* Item Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveItem}
        editingItem={editingItem}
        isLoading={isSaving}
      />
    </div>
  );
}

export default App;
