# Notas do Projeto - Almoxarifado

## Estado Atual
- Projeto: almoxarifado_ (genimaxandrade)
- Deploy: https://almoxarifado-delta.vercel.app
- Branch: main
- Git session: git_push (cd ~/almoxarifado_)

## Colunas da tabela items (atualizado)
- id, code, name, type, unit, quantity, ca, patrimonio, data_validade_ca, estoque_minimo, created_at
- localizacao, fornecedor, preco_unitario, data_validade, estoque_seguranca

## Tipos de itens (novo)
- epi, equipamento, material_consumo, material_limpeza, gas, ferramenta

## Solicitações de compra
- Tabela purchase_requests com campos: item_id, item_code, item_name, requested_quantity, status, created_at
- Novo fluxo: pendente → aprovado → comprado → cancelado
- Expiração automática em 30 dias

## Saída de Material (novo requisito)
- Múltiplos itens para o mesmo requisitante (lista/carrinho)
- Área de utilização obrigatória para gases
- Folha de assinatura imprimível
- Gera solicitação de compra quando atinge estoque mínimo
- Alerta visual ao atingir estoque de segurança

## Reposição (novo requisito)
- Nota fiscal, pedido de compra, fornecedor, valor unitário (histórico de preço)

## Gráficos (novo requisito)
- Apenas saídas
- Ranking 10 itens mais consumidos
- Tendência mensal de movimentações

## Sidebar (novo requisito)
- 📦 Estoque: Controle de Estoque (/), Saída de Material (/saida), Reposição (/reposicao)
- 📊 Relatórios: Estatísticas, Histórico de Preços, Gráficos, Histórico Diário, Relatório Mensal
- ⚙️ Configurações: Alertas, Etiquetas, Funcionários, Solicitações de Compra, Backup, Gerenciar Acessos, Ajuda

## Gerenciar Acessos (novo)
- Substitui "Permissões"
- Tipos: somente_visualizacao, visualizacao_edicao, acesso_restrito

## Credenciais
- Supabase URL: https://ephxzzwgoasgqygqrcru.supabase.co
- User Admin: genimaxandrademax@gmail.com (já configurado como admin)

## Pendências
1. ✅ ItemModal atualizado
2. ⬜ SaidaMaterial - múltiplos itens, folha assinatura, gases obrigatório
3. ⬜ ReposicaoEstoque - nota fiscal, fornecedor, preço unitário
4. ⬜ App.jsx tabela controle de estoque - novos campos e filtros
5. ⬜ SolicitacoesCompra - fluxo de status, expiração 30 dias
6. ⬜ Graficos - apenas saídas, ranking 10
7. ⬜ Sidebar - reorganizar menu
8. ⬜ GerenciamentoPermissoes → Gerenciar Acessos
9. ⬜ Commit + Push
