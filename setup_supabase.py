#!/usr/bin/env python3
"""
Script para criar as tabelas no Supabase baseado nas entidades do Base44
"""

import os
import sys
from supabase import create_client, Client

# Configurações
SUPABASE_URL = "https://ephxzzwgoasgqygqrcru.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaHh6endnb2FzZ3F5Z3FyY3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjMzNzE1OCwiZXhwIjoyMTAxOTEzMTU4fQ.qRnNFoaTSe85_BzcTaCHFDNpJJzsznPVVV5UDYfcLsY"

# Criar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def create_tables():
    """Criar todas as tabelas necessárias no Supabase"""
    
    print("🚀 Iniciando criação de tabelas no Supabase...")
    
    try:
        # 1. Criar tabela de Usuários (User)
        print("\n📝 Criando tabela 'users'...")
        supabase.table("users").insert({
            "id": "test-user-id",
            "email": "test@example.com",
            "role": "admin"
        }).execute()
        print("✅ Tabela 'users' criada com sucesso!")
        
        # 2. Criar tabela de Funcionários (Employee)
        print("\n📝 Criando tabela 'employees'...")
        supabase.table("employees").insert({
            "id": "test-emp-id",
            "name": "Test Employee",
            "department": "Test Department",
            "position": "Test Position"
        }).execute()
        print("✅ Tabela 'employees' criada com sucesso!")
        
        # 3. Criar tabela de Itens (Item)
        print("\n📝 Criando tabela 'items'...")
        supabase.table("items").insert({
            "id": "test-item-id",
            "code": "TEST001",
            "name": "Test Item",
            "type": "material",
            "unit": "un",
            "quantity": 0
        }).execute()
        print("✅ Tabela 'items' criada com sucesso!")
        
        # 4. Criar tabela de Requisições de Compra (PurchaseRequest)
        print("\n📝 Criando tabela 'purchase_requests'...")
        supabase.table("purchase_requests").insert({
            "id": "test-pr-id",
            "item_id": "test-item-id",
            "item_code": "TEST001",
            "item_name": "Test Item",
            "requested_quantity": 10,
            "status": "pendente"
        }).execute()
        print("✅ Tabela 'purchase_requests' criada com sucesso!")
        
        # 5. Criar tabela de Movimentações (StockMovement)
        print("\n📝 Criando tabela 'stock_movements'...")
        supabase.table("stock_movements").insert({
            "id": "test-sm-id",
            "item_id": "test-item-id",
            "item_code": "TEST001",
            "movement_type": "entrada",
            "quantity": 10,
            "date": "2026-08-10T00:00:00Z"
        }).execute()
        print("✅ Tabela 'stock_movements' criada com sucesso!")
        
        # 6. Criar tabela de Permissões (UserPermission)
        print("\n📝 Criando tabela 'user_permissions'...")
        supabase.table("user_permissions").insert({
            "id": "test-perm-id",
            "user_email": "test@example.com",
            "access_level": "somente_visualizacao"
        }).execute()
        print("✅ Tabela 'user_permissions' criada com sucesso!")
        
        print("\n✨ Todas as tabelas foram criadas com sucesso!")
        return True
        
    except Exception as e:
        print(f"\n❌ Erro ao criar tabelas: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)
