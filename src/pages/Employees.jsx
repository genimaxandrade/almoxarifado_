import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2, CheckCircle, XCircle, UserCheck, UserX, Search, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const emptyForm = { registration: '', name: '', role: '', sector: '', active: true };

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('name', 500),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.registration.trim() || !form.name.trim()) throw new Error('Matrícula e nome são obrigatórios');
      if (editingId) {
        await base44.entities.Employee.update(editingId, form);
      } else {
        await base44.entities.Employee.create(form);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Funcionário atualizado!' : 'Funcionário cadastrado!');
      qc.invalidateQueries({ queryKey: ['employees'] });
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      toast.success('Funcionário removido!');
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Employee.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  const openEdit = (emp) => {
    setForm({ registration: emp.registration, name: emp.name, role: emp.role || '', sector: emp.sector || '', active: emp.active ?? true });
    setEditingId(emp.id);
    setOpen(true);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(true);
  };

  const filtered = employees.filter(e =>
    !search ||
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.registration?.toLowerCase().includes(search.toLowerCase()) ||
    e.sector?.toLowerCase().includes(search.toLowerCase())
  );

  const active = employees.filter(e => e.active !== false).length;
  const inactive = employees.length - active;

  const getInitials = (name) => name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';

  const avatarColors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-emerald-500 to-emerald-700',
    'from-orange-500 to-orange-700',
    'from-pink-500 to-pink-700',
    'from-cyan-500 to-cyan-700',
    'from-indigo-500 to-indigo-700',
    'from-rose-500 to-rose-700',
  ];
  const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen">
      {/* Header escuro */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Funcionários</h1>
              <p className="text-sm text-slate-400">Cadastro de funcionários para registro de saídas</p>
            </div>
          </div>
          <Button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Funcionário
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{employees.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total</p>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{active}</p>
            <p className="text-xs text-emerald-500 mt-1">Ativos</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-400">{inactive}</p>
            <p className="text-xs text-slate-500 mt-1">Inativos</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, matrícula ou setor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 py-20 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">{search ? 'Nenhum resultado encontrado.' : 'Nenhum funcionário cadastrado.'}</p>
          {!search && (
            <Button className="mt-4 bg-blue-600 hover:bg-blue-500" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeiro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div
              key={emp.id}
              className={`group rounded-2xl border p-5 transition-all duration-200 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5
                ${emp.active !== false
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColor(emp.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {getInitials(emp.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm truncate">{emp.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border
                      ${emp.active !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-500 border-slate-600'
                      }`}>
                      {emp.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-mono text-slate-400 font-bold">{emp.registration}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-3 mt-1.5">
                    {emp.role && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Briefcase className="w-3 h-3" />{emp.role}
                      </span>
                    )}
                    {emp.sector && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="w-3 h-3" />{emp.sector}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => toggleActiveMut.mutate({ id: emp.id, active: !(emp.active !== false) })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  title={emp.active !== false ? 'Desativar' : 'Ativar'}
                >
                  {emp.active !== false
                    ? <><UserX className="w-3.5 h-3.5" /> Desativar</>
                    : <><UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Ativar</>
                  }
                </button>
                <button
                  onClick={() => openEdit(emp)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-400 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteMut.mutate(emp.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { label: 'Matrícula *', key: 'registration', placeholder: 'Ex: FUNC001' },
              { label: 'Nome Completo *', key: 'name', placeholder: 'Nome do funcionário' },
              { label: 'Cargo', key: 'role', placeholder: 'Ex: Técnico, Enfermeiro...' },
              { label: 'Setor', key: 'sector', placeholder: 'Ex: Oficina, Enfermaria...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-slate-300">{label}</Label>
                <Input
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
            ))}
            <Button
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}