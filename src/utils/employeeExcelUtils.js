import * as XLSX from 'xlsx';

/**
 * Exporta lista de funcionários para arquivo Excel
 */
export function exportEmployeesToExcel(funcionarios) {
  const data = funcionarios.map(f => ({
    'Nome': f.name || f.nome || '',
    'Email': f.email || '',
    'Cargo': f.position || f.cargo || '',
    'Departamento': f.department || f.departamento || '',
    'Permissão': f.access_level === 'admin' ? 'Administrador' : 'Usuário',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 30 }, // Nome
    { wch: 35 }, // Email
    { wch: 25 }, // Cargo
    { wch: 25 }, // Departamento
    { wch: 15 }, // Permissão
  ];
  ws['!cols'] = colWidths;

  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  XLSX.writeFile(wb, `funcionarios_${today}.xlsx`);
}

/**
 * Importa funcionários de um arquivo Excel
 */
export async function importEmployeesFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('Arquivo vazio ou formato inválido'));
          return;
        }

        // Mapear colunas com flexibilidade (aceita variações de nomes)
        const mappedData = jsonData.map(row => {
          const name = row['Nome'] || row['nome'] || row['NAME'] || '';
          const email = row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || '';
          const cargo = row['Cargo'] || row['cargo'] || row['CARGO'] || row['Position'] || '';
          const departamento = row['Departamento'] || row['departamento'] || row['DEPARTAMENTO'] || row['Setor'] || row['setor'] || '';
          const permissao = row['Permissão'] || row['permissao'] || row['PERMISSÃO'] || row['Permissao'] || 'Usuário';

          // Normalizar permissão
          let accessLevel = 'user';
          if (permissao.toString().toLowerCase().includes('admin')) {
            accessLevel = 'admin';
          }

          return {
            name: name.trim(),
            email: email.trim(),
            position: cargo.trim(),
            department: departamento.trim(),
            access_level: accessLevel,
          };
        }).filter(item => item.name && item.email);

        if (mappedData.length === 0) {
          reject(new Error('Nenhum funcionário válido encontrado no arquivo. Verifique se as colunas "Nome" e "Email" existem.'));
          return;
        }

        resolve(mappedData);
      } catch (err) {
        reject(new Error('Erro ao processar o arquivo: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Baixa um modelo/template de planilha para importação de funcionários
 */
export function downloadEmployeeTemplate() {
  const template = [
    {
      'Nome': 'João Silva',
      'Email': 'joao.silva@empresa.com',
      'Cargo': 'Operador de Máquinas',
      'Departamento': 'Produção',
      'Permissão': 'Usuário',
    },
    {
      'Nome': 'Maria Santos',
      'Email': 'maria.santos@empresa.com',
      'Cargo': 'Supervisora',
      'Departamento': 'Manutenção',
      'Permissão': 'Administrador',
    },
    {
      'Nome': 'Carlos Oliveira',
      'Email': 'carlos.oliveira@empresa.com',
      'Cargo': 'Técnico de Segurança',
      'Departamento': 'Segurança do Trabalho',
      'Permissão': 'Usuário',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo');

  const colWidths = [
    { wch: 25 }, // Nome
    { wch: 30 }, // Email
    { wch: 22 }, // Cargo
    { wch: 22 }, // Departamento
    { wch: 15 }, // Permissão
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, 'modelo_funcionarios.xlsx');
}
