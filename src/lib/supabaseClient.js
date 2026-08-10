import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ephxzzwgoasgqygqrcru.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaHh6endnb2FzZ3F5Z3FyY3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMzcxNTgsImV4cCI6MjEwMTkxMzE1OH0.l5myU4gg6RwInesv0qqZTqiUusoqaVQm2FOZC0gtpvA';

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções auxiliares para operações comuns

// Usuários
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
};

export const createUser = async (user) => {
  const { data, error } = await supabase.from('users').insert([user]).select();
  if (error) throw error;
  return data[0];
};

export const updateUser = async (id, updates) => {
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteUser = async (id) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};

// Funcionários
export const getEmployees = async () => {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) throw error;
  return data;
};

export const createEmployee = async (employee) => {
  const { data, error } = await supabase.from('employees').insert([employee]).select();
  if (error) throw error;
  return data[0];
};

export const updateEmployee = async (id, updates) => {
  const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteEmployee = async (id) => {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
};

// Itens
export const getItems = async () => {
  const { data, error } = await supabase.from('items').select('*');
  if (error) throw error;
  return data;
};

export const createItem = async (item) => {
  const { data, error } = await supabase.from('items').insert([item]).select();
  if (error) throw error;
  return data[0];
};

export const updateItem = async (id, updates) => {
  const { data, error } = await supabase.from('items').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteItem = async (id) => {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
};

// Requisições de Compra
export const getPurchaseRequests = async () => {
  const { data, error } = await supabase.from('purchase_requests').select('*');
  if (error) throw error;
  return data;
};

export const createPurchaseRequest = async (request) => {
  const { data, error } = await supabase.from('purchase_requests').insert([request]).select();
  if (error) throw error;
  return data[0];
};

export const updatePurchaseRequest = async (id, updates) => {
  const { data, error } = await supabase.from('purchase_requests').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deletePurchaseRequest = async (id) => {
  const { error } = await supabase.from('purchase_requests').delete().eq('id', id);
  if (error) throw error;
};

// Movimentações de Estoque
export const getStockMovements = async () => {
  const { data, error } = await supabase.from('stock_movements').select('*');
  if (error) throw error;
  return data;
};

export const createStockMovement = async (movement) => {
  const { data, error } = await supabase.from('stock_movements').insert([movement]).select();
  if (error) throw error;
  return data[0];
};

export const updateStockMovement = async (id, updates) => {
  const { data, error } = await supabase.from('stock_movements').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteStockMovement = async (id) => {
  const { error } = await supabase.from('stock_movements').delete().eq('id', id);
  if (error) throw error;
};

// Permissões de Usuário
export const getUserPermissions = async () => {
  const { data, error } = await supabase.from('user_permissions').select('*');
  if (error) throw error;
  return data;
};

export const createUserPermission = async (permission) => {
  const { data, error } = await supabase.from('user_permissions').insert([permission]).select();
  if (error) throw error;
  return data[0];
};

export const updateUserPermission = async (id, updates) => {
  const { data, error } = await supabase.from('user_permissions').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteUserPermission = async (id) => {
  const { error } = await supabase.from('user_permissions').delete().eq('id', id);
  if (error) throw error;
};
