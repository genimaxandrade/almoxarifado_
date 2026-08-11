import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

export function Etiquetas() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Etiquetas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm mb-4">
            Gere códigos de etiquetas para identificação de itens no estoque.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Gerar Etiquetas
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
