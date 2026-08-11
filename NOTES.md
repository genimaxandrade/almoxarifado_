# Notas do Projeto Almoxarifado

## Configurações Supabase
- URL: https://ephxzzwgoasgqygqrcru.supabase.co
- SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaHh6endnb2FzZ3F5Z3FyY3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjMzNzE1OCwiZXhwIjoyMTAxOTEzMTU4fQ.qRnNFoaTSe85_BzcTaCHFDNpJJzsznPVVV5UDYfcLsY
- ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaHh6endnb2FzZ3F5Z3FyY3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjMzNzE1OCwiZXhwIjoyMTAxOTEzMTU4fQ.l5myU4gg6RwInesv0qqZTqiUusoqaVQm2FOZC0gtpvA

## Tabelas do Supabase
- items: id, code, name, type, unit, quantity, ca, patrimonio, data_validade_ca, estoque_minimo, created_at
- employees: id, name, email, position, access_level, created_at
- stock_movements: id, item_id, item_code, item_name, movement_type, quantity, reason, date, created_at
- purchase_requests: id, item_id, item_code, item_name, requested_quantity, status, created_at
- user_permissions: id, user_email, access_level, created_at
- item_signatures: id, item_id, item_name, item_type, employee_name, employee_department, signature_name, term_accepted, signed_at, created_at

## URL do Vercel
https://almoxarifado-delta.vercel.app

## Estrutura do Projeto
- React + Vite + Tailwind CSS
- Supabase para banco de dados
- Lucide-react para ícones

## Localização do Bloqueio de Funcionários
- Sidebar.jsx, linha 48: `adminOnly: true` no item Funcionários
- Sidebar.jsx, linha 88-93: `handleNavigation` verifica `isAdminOnly && userRole !== 'admin'`
- Sidebar.jsx, linha 132: `isDisabled = isAdminOnly && userRole !== 'admin'`

## Pendências para corrigir
1. Desbloquear Funcionários: remover `adminOnly: true` ou mudar para false
2. Adicionar importação de funcionários via Excel/CSV
3. Adicionar campo `data_vencimento_ca` na tabela employees
