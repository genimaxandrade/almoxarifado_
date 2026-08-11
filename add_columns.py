import requests
import json

SUPABASE_URL = "https://ephxzzwgoasgqygqrcru.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwaHh6endnb2FzZ3F5Z3FyY3J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjMzNzE1OCwiZXhwIjoyMTAxOTEzMTU4fQ.qRnNFoaTSe85_BzcTaCHFDNpJJzsznPVVV5UDYfcLsY"

# SQL para adicionar colunas CA e Patrimônio
sql = """
ALTER TABLE items ADD COLUMN IF NOT EXISTS ca TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS patrimonio TEXT;
"""

# Executar via SQL REST API
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers={
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    },
    json={"query": sql}
)

if response.status_code == 200 or response.status_code == 201:
    print("✅ Colunas CA e Patrimônio adicionadas com sucesso!")
else:
    print(f"❌ Erro: {response.status_code}")
    print(response.text)
