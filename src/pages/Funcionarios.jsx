import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus } from 'lucide-react';

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([
    { id: 1, nome: 'João Silva', email: 'joao@empresa.com', cargo: 'Almoxarife', permissao: 'admin' },
    { id: 2, nome: 'Maria Santos', email: 'maria@empresa.com', cargo: 'Auxiliar', permissao: 'user' },
  ]);

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Funcionários
            </CardTitle>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 font-medium py-2 text-sm">Nome</th>
                  <th className="text-left text-gray-400 font-medium py-2 text-sm">Email</th>
                  <th className="text-left text-gray-400 font-medium py-2 text-sm">Cargo</th>
                  <th className="text-left text-gray-400 font-medium py-2 text-sm">Permissão</th>
                  <th className="text-left text-gray-400 font-medium py-2 text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((func) => (
                  <tr key={func.id} className="border-b border-gray-700">
                    <td className="py-3 text-white text-sm">{func.nome}</td>
                    <td className="py-3 text-gray-400 text-sm">{func.email}</td>
                    <td className="py-3 text-gray-400 text-sm">{func.cargo}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        func.permissao === 'admin'
                          ? 'bg-purple-900 text-purple-300'
                          : 'bg-blue-900 text-blue-300'
                      }`}>
                        {func.permissao === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
