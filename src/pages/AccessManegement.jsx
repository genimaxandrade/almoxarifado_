import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/shared/PageHeader';
import { ALL_PAGES } from '@/hooks/usePermissions';
import { toast } from 'sonner';

const levelLabels = {
  somente_visualizacao: 'Somente Visualização',
  visualizacao_edicao: 'Visualização e Edição',
  aba_especifica: 'Aba Específica',
};

const levelColors = {
  somente_visualizacao: 'bg-blue-100 text-blue-800',
  visualizacao_edicao: 'bg-green-100 text-green-800',
  aba_especifica: 'bg-purple-100 text-purple-800',
};

const emptyForm = {
  user_email: '',
  user_name: '',
  access_level: 'somente_visualizacao',
  allowed_pages: [],
  active: true,
  notes: '',
};

export default function AccessManagement() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['user_permissions'],
    queryFn: () => base44.entities.UserPermission.list('-created_date', 200),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.UserPermission.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_permissions'] });
      toast.success('Permissão criada com sucesso!');
      closeForm();
    },
    onError: () => toast.error('Erro ao criar permissão.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserPermission.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_permissions'] });
      toast.success('Permissão atualizada!');
      closeForm();
    },
    onError: () => toast.error('Erro ao atualizar permissão.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.UserPermission.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_permissions'] });
      toast.success('Permissão removida.');
      setDeleteTarget(null);
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, active }) => base44.entities.UserPermission.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user_permissions'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(perm) {
    setEditing(perm);
    setForm({
      user_email: perm.user_email,
      user_name: perm.user_name || '',
      access_level: perm.access_level,
      allowed_pages: perm.allowed_pages || [],
      active: perm.active !== false,
      notes: perm.notes || '',
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleSave() {
    if (!form.user_email) { toast.error('Email obrigatório.'); return; }
    const payload = {
      ...form,
      allowed_pages: form.access_level === 'aba_especifica' ? form.allowed_pages : [],
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  function togglePage(path) {
    setForm(f => ({
      ...f,
      allowed_pages: f.allowed_pages.includes(path)
        ? f.allowed_pages.filter(p => p !== path)
        : [...f.allowed_pages, path],
    }));
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="Gerenciar Acessos"
        description="Defina o que cada usuário pode fazer no sistema"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar Acesso
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Usuários com Acesso Configurado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Páginas Permitidas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : permissions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum acesso configurado. Usuários sem configuração terão somente visualização.</TableCell></TableRow>
                ) : permissions.map(perm => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-medium">{perm.user_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{perm.user_email}</TableCell>
                    <TableCell>
                      <Badge className={levelColors[perm.access_level]}>
                        {levelLabels[perm.access_level]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      {perm.access_level === 'aba_especifica'
                        ? (perm.allowed_pages || []).map(p => ALL_PAGES.find(x => x.path === p)?.label || p).join(', ') || '—'
                        : 'Todas'}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActiveMut.mutate({ id: perm.id, active: !perm.active })}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${perm.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {perm.active !== false ? 'Ativo' : 'Inativo'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(perm)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(perm)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Acesso' : 'Novo Acesso'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Email do Usuário *</Label>
              <Input
                value={form.user_email}
                onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))}
                placeholder="email@exemplo.com"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground">O usuário precisa estar cadastrado no sistema.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nome (para identificação)</Label>
              <Input
                value={form.user_name}
                onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nível de Acesso *</Label>
              <Select value={form.access_level} onValueChange={v => setForm(f => ({ ...f, access_level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="somente_visualizacao">Somente Visualização</SelectItem>
                  <SelectItem value="visualizacao_edicao">Visualização e Edição</SelectItem>
                  <SelectItem value="aba_especifica">Aba Específica</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.access_level === 'somente_visualizacao' && 'Pode ver tudo, mas não pode editar, criar ou excluir nada.'}
                {form.access_level === 'visualizacao_edicao' && 'Pode ver e editar tudo no sistema.'}
                {form.access_level === 'aba_especifica' && 'Acesso restrito apenas às páginas selecionadas abaixo.'}
              </p>
            </div>

            {form.access_level === 'aba_especifica' && (
              <div className="space-y-2">
                <Label>Páginas Permitidas</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-52 overflow-y-auto">
                  {ALL_PAGES.map(page => (
                    <div key={page.path} className="flex items-center gap-2">
                      <Checkbox
                        id={`page-${page.path}`}
                        checked={form.allowed_pages.includes(page.path)}
                        onCheckedChange={() => togglePage(page.path)}
                      />
                      <label htmlFor={`page-${page.path}`} className="text-sm cursor-pointer">{page.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá o acesso configurado para "{deleteTarget?.user_email}". O usuário ficará com acesso somente leitura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMut.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}