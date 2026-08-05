import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// All available pages/routes in the system
export const ALL_PAGES = [
  { path: '/', label: 'Controle de Estoque' },
  { path: '/saida', label: 'Saída de Material' },
  { path: '/reposicao', label: 'Reposição de Estoque' },
  { path: '/solicitacoes-compra', label: 'Solicitações de Compra' },
  { path: '/alertas', label: 'Alertas' },
  { path: '/historico-diario', label: 'Histórico Diário' },
  { path: '/relatorio-mensal', label: 'Relatório Mensal' },
  { path: '/estatisticas', label: 'Estatísticas' },
  { path: '/historico-precos', label: 'Histórico de Preços' },
  { path: '/graficos', label: 'Gráficos' },
  { path: '/funcionarios', label: 'Funcionários' },
  { path: '/etiquetas', label: 'Etiquetas' },
  { path: '/backup', label: 'Backup' },
];

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);

        // Admins have full access — no need to check permissions
        if (me.role === 'admin') {
          setPermission({ access_level: 'admin' });
          setLoading(false);
          return;
        }

        // Fetch permission for this user
        const perms = await base44.entities.UserPermission.filter({ user_email: me.email, active: true });
        if (perms && perms.length > 0) {
          setPermission(perms[0]);
        } else {
          // No permission record = view only
          setPermission({ access_level: 'somente_visualizacao' });
        }
      } catch {
        setPermission({ access_level: 'somente_visualizacao' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isAdmin = permission?.access_level === 'admin';
  const canEdit = isAdmin || permission?.access_level === 'visualizacao_edicao';

  function canAccessPage(path) {
    if (!permission) return false;
    if (isAdmin) return true;
    if (permission.access_level === 'somente_visualizacao') return true;
    if (permission.access_level === 'visualizacao_edicao') return true;
    if (permission.access_level === 'aba_especifica') {
      const allowed = permission.allowed_pages || [];
      return allowed.includes(path);
    }
    return false;
  }

  return { user, permission, loading, isAdmin, canEdit, canAccessPage };
}