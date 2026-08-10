import * as XLSX from 'xlsx';

// Exportar itens para Excel
export const exportItemsToExcel = (items, fileName = 'almoxarifado_itens.xlsx') => {
  if (!items || items.length === 0) {
    alert('Nenhum item para exportar!');
    return;
  }

  // Preparar dados para exportação
  const data = items.map(item => ({
    'Código': item.code,
    'Nome': item.name,
    'Tipo': item.type,
    'Unidade': item.unit,
    'Quantidade': item.quantity,
  }));

  // Criar workbook
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Itens');

  // Ajustar largura das colunas
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
  ];

  // Fazer download
  XLSX.writeFile(workbook, fileName);
};

// Importar itens de Excel
export const importItemsFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validar e transformar dados
        const items = jsonData.map((row, index) => {
          const code = row['Código'] || row['Code'] || '';
          const name = row['Nome'] || row['Name'] || '';
          const type = row['Tipo'] || row['Type'] || 'material';
          const unit = row['Unidade'] || row['Unit'] || 'un';
          const quantity = parseInt(row['Quantidade'] || row['Quantity'] || 0);

          if (!code || !name) {
            throw new Error(`Linha ${index + 2}: Código e Nome são obrigatórios`);
          }

          return {
            code: code.toString().trim(),
            name: name.toString().trim(),
            type: type.toString().trim(),
            unit: unit.toString().trim(),
            quantity: isNaN(quantity) ? 0 : quantity,
          };
        });

        resolve(items);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };

    reader.readAsBinaryString(file);
  });
};

// Criar arquivo modelo
export const downloadTemplate = () => {
  const templateData = [
    {
      'Código': 'EX001',
      'Nome': 'Exemplo de Item',
      'Tipo': 'material',
      'Unidade': 'un',
      'Quantidade': 10,
    },
    {
      'Código': 'EX002',
      'Nome': 'Outro Item',
      'Tipo': 'ferramenta',
      'Unidade': 'pç',
      'Quantidade': 5,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Itens');

  // Ajustar largura das colunas
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
  ];

  // Adicionar instrução em outra aba
  const instructionData = [
    ['INSTRUÇÕES PARA IMPORTAÇÃO'],
    [''],
    ['1. Preencha os dados na aba "Itens"'],
    ['2. Código: Identificador único do item (obrigatório)'],
    ['3. Nome: Nome descritivo do item (obrigatório)'],
    ['4. Tipo: material, ferramenta ou epi'],
    ['5. Unidade: un, kg, l, pç, etc.'],
    ['6. Quantidade: Número inteiro'],
    [''],
    ['Não altere os nomes das colunas!'],
  ];

  const instructionSheet = XLSX.utils.aoa_to_sheet(instructionData);
  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instruções');

  XLSX.writeFile(workbook, 'modelo_almoxarifado.xlsx');
};
