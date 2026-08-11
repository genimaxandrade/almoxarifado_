import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateMonthlyReport(userEmail) {
  const doc = new jsPDF();
  
  // Importar Supabase para buscar dados
  const { supabase } = await import('@/lib/supabaseClient');

  // Buscar dados do mês atual
  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);

  const [{ data: movements }, { data: items }] = await Promise.all([
    supabase
      .from('stock_movements')
      .select('*')
      .gte('date', firstDay.toISOString())
      .order('date', { ascending: false }),
    supabase
      .from('items')
      .select('*')
      .order('name'),
  ]);

  // Calcular estatísticas
  const entradas = movements?.filter(m => m.movement_type === 'entrada') || [];
  const saidas = movements?.filter(m => m.movement_type === 'saida') || [];
  const totalEntradas = entradas.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalSaidas = saidas.reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalItens = items?.length || 0;
  const itensEmEstoque = items?.filter(i => i.quantity > 0).length || 0;
  const itensCritic = items?.filter(i => i.quantity <= 5 && i.quantity > 0).length || 0;

  // Cabeçalho
  doc.setFillColor(44, 62, 80);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('RELATÓRIO MENSAL DE ESTOQUE', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(
    `Período: ${firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
    105,
    30,
    { align: 'center' }
  );

  // Informações do relatório
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 48);
  doc.text(`Sistema: Almoxarifado Digital`, 15, 53);
  doc.text(`Responsável: ${userEmail || 'N/A'}`, 15, 58);

  // Resumo Executivo
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('1. RESUMO EXECUTIVO', 15, 70);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const resumoData = [
    ['Indicador', 'Valor'],
    ['Total de Itens Cadastrados', totalItens.toString()],
    ['Itens em Estoque', itensEmEstoque.toString()],
    ['Itens em Nível Crítico', itensCritic.toString()],
    ['Total de Entradas (unidades)', totalEntradas.toString()],
    ['Total de Saídas (unidades)', totalSaidas.toString()],
    ['Número de Movimentações de Entrada', entradas.length.toString()],
    ['Número de Movimentações de Saída', saidas.length.toString()],
    ['Saldo do Mês (Entradas - Saídas)', (totalEntradas - totalSaidas).toString()],
  ];

  autoTable(doc, {
    startY: 75,
    head: [resumoData[0]],
    body: resumoData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    styles: { fontSize: 9 },
  });

  // Movimentações do Mês
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('2. MOVIMENTAÇÕES DO MÊS', 15, finalY);

  if (movements && movements.length > 0) {
    const movData = [
      ['Data', 'Tipo', 'Item', 'Qtd', 'Motivo'],
      ...movements.slice(0, 50).map(m => [
        new Date(m.date).toLocaleDateString('pt-BR'),
        m.movement_type === 'entrada' ? 'ENTRADA' : 'SAÍDA',
        m.item_name || 'N/A',
        m.quantity?.toString() || '0',
        m.reason || 'N/A',
      ]),
    ];

    autoTable(doc, {
      startY: finalY + 5,
      head: [movData[0]],
      body: movData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { 
          cellWidth: 25,
          textColor: (cell) => cell.raw === 'ENTRADA' ? [39, 174, 96] : [231, 76, 60],
          fontStyle: 'bold',
        },
      },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Nenhuma movimentação registrada neste mês.', 15, finalY + 10);
  }

  // Itens em Nível Crítico
  const finalY2 = doc.lastAutoTable?.finalY + 15 || finalY + 20;
  
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('3. ITENS EM NÍVEL CRÍTICO', 15, finalY2);

  const itensCriticos = items?.filter(i => i.quantity <= 5 && i.quantity > 0) || [];
  
  if (itensCriticos.length > 0) {
    const critData = [
      ['Código', 'Nome', 'Quantidade Atual'],
      ...itensCriticos.map(i => [
        i.code,
        i.name,
        i.quantity?.toString() || '0',
      ]),
    ];

    autoTable(doc, {
      startY: finalY2 + 5,
      head: [critData[0]],
      body: critData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { textColor: [231, 76, 60], fontStyle: 'bold' },
      },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(39, 174, 96);
    doc.text('Nenhum item em nível crítico. Estoque saudável!', 15, finalY2 + 10);
  }

  // Rodapé
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Almoxarifado Digital - Relatório Mensal`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Salvar PDF
  const mesAno = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', '_');
  doc.save(`relatorio_mensal_${mesAno}.pdf`);
}
