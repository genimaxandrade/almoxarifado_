import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, BookOpen, Mail, MessageCircle } from 'lucide-react';

export function Ajuda() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Ajuda e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <h3 className="text-white font-medium text-sm">Documentação</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Acesse a documentação completa do sistema para aprender todas as funcionalidades.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <h3 className="text-white font-medium text-sm">Suporte via Chat</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Entre em contato com nossa equipe de suporte para tirar dúvidas em tempo real.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <h3 className="text-white font-medium text-sm">Email de Suporte</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Envie suas dúvidas para suporte@almoxarifado.com
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white font-medium text-sm mb-2">Perguntas Frequentes</h4>
            <div className="space-y-2 text-sm">
              <details className="bg-gray-700 rounded-lg p-3">
                <summary className="text-gray-300 cursor-pointer">Como adicionar um novo item?</summary>
                <p className="text-gray-400 mt-2">Clique no botão "+ Novo Item" na página de Controle de Estoque.</p>
              </details>
              <details className="bg-gray-700 rounded-lg p-3">
                <summary className="text-gray-300 cursor-pointer">Como exportar dados?</summary>
                <p className="text-gray-400 mt-2">Acesse a seção Backup e clique em "Exportar Dados".</p>
              </details>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
