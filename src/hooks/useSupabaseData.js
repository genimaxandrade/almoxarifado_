import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Hook para buscar dados
export const useSupabaseQuery = (table, queryKey = null) => {
  return useQuery({
    queryKey: queryKey || [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data;
    },
  });
};

// Hook para criar dados
export const useSupabaseInsert = (table) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newData) => {
      const { data, error } = await supabase
        .from(table)
        .insert([newData])
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
  });
};

// Hook para atualizar dados
export const useSupabaseUpdate = (table) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
  });
};

// Hook para deletar dados
export const useSupabaseDelete = (table) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
    },
  });
};

// Hook para buscar com filtros
export const useSupabaseQueryWithFilter = (table, filterFn, queryKey = null) => {
  return useQuery({
    queryKey: queryKey || [table, 'filtered'],
    queryFn: async () => {
      let query = supabase.from(table).select('*');
      query = filterFn(query);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
