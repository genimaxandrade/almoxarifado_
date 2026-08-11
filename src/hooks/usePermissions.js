import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para gerenciar permissões de usuário (Admin/Usuário)
 * 
 * Permissões:
 * - admin: Acesso total ao sistema
 * - user: Acesso limitado (não pode gerenciar funcionários)
 */
export function usePermissions(user) {
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRole('user');
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        // Usar .maybeSingle() que não falha se houver 0 ou múltiplos resultados
        const { data, error } = await supabase
          .from('user_permissions')
          .select('access_level')
          .eq('user_email', user.email)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar permissões:', error);
          setUserRole('user');
        } else if (data?.access_level) {
          setUserRole(data.access_level);
          console.log('User role set to:', data.access_level);
        } else {
          setUserRole('user');
          console.log('No permission found, default to user');
        }
      } catch (err) {
        console.error('Erro ao buscar permissões:', err);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole === 'admin';
  const canAccess = (adminOnly) => {
    if (!adminOnly) return true;
    return isAdmin;
  };

  return { userRole, isAdmin, canAccess, loading };
}
