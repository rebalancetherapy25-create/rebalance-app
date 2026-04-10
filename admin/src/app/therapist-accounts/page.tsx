'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { emailPattern, getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';

interface TherapistAccount {
  _id: string;
  email: string;
  status: 'active' | 'suspended';
  therapistId: { _id: string; name: string } | string;
  createdAt: string;
}

interface Therapist {
  _id: string;
  name: string;
}

export default function TherapistAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<TherapistAccount[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ therapistId: '', email: '', password: '', status: 'active' as 'active' | 'suspended' });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editing, setEditing] = useState<TherapistAccount | null>(null);
  const [editForm, setEditForm] = useState({ email: '', status: 'active' as 'active' | 'suspended', password: '' });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [accRes, tRes] = await Promise.all([
        api.get('/admin/therapist-accounts'),
        api.get('/admin/therapists'),
      ]);
      setAccounts(accRes.data || []);
      setTherapists(tRes.data || []);
    } catch (e) {
      console.error('Failed to fetch therapist accounts', e);
      toast({
        variant: 'error',
        title: 'Unable to load therapist accounts',
        items: [getApiErrorMessage(e, 'Failed to fetch therapist accounts.')],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const therapistName = (account: TherapistAccount) => {
    if (typeof account.therapistId === 'string') return account.therapistId;
    return account.therapistId?.name || 'Unknown';
  };

  const openEdit = (account: TherapistAccount) => {
    setEditing(account);
    setEditForm({
      email: account.email,
      status: account.status,
      password: '',
    });
    setIsEditOpen(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string | undefined> = {};

    if (!createForm.therapistId) errors.therapistId = 'Therapist selection is required.';
    if (!createForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailPattern.test(createForm.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!createForm.password.trim()) {
      errors.password = 'Password is required.';
    } else if (createForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    const messages = getErrorMessages(errors);
    if (messages.length) {
      toast({
        variant: 'error',
        title: 'Please fix these account errors',
        items: messages,
      });
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/admin/therapist-accounts', {
        ...createForm,
        email: createForm.email.trim(),
      });
      setIsCreateOpen(false);
      setCreateForm({ therapistId: '', email: '', password: '', status: 'active' });
      toast({
        title: 'Therapist account created',
        description: 'The therapist portal account was created successfully.',
      });
      await fetchAll();
    } catch (e: unknown) {
      const message = getApiErrorMessage(e, 'Failed to create therapist account.');
      toast({
        variant: 'error',
        title: 'Unable to create therapist account',
        items: [message],
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const errors: Record<string, string | undefined> = {};

    if (!editForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailPattern.test(editForm.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    if (editForm.password.trim() && editForm.password.trim().length < 6) {
      errors.password = 'Reset password must be at least 6 characters.';
    }

    const messages = getErrorMessages(errors);
    if (messages.length) {
      toast({
        variant: 'error',
        title: 'Please fix these account errors',
        items: messages,
      });
      return;
    }

    setEditLoading(true);
    try {
      const payload: any = { email: editForm.email.trim(), status: editForm.status };
      if (editForm.password.trim()) payload.password = editForm.password.trim();
      await api.put(`/admin/therapist-accounts/${editing._id}`, payload);
      setIsEditOpen(false);
      setEditing(null);
      toast({
        title: 'Therapist account updated',
        description: 'The therapist account changes were saved successfully.',
      });
      await fetchAll();
    } catch (e: unknown) {
      const message = getApiErrorMessage(e, 'Failed to update therapist account.');
      toast({
        variant: 'error',
        title: 'Unable to update therapist account',
        items: [message],
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-400" /> Therapist Accounts
          </h1>
          <p className="text-neutral-400">Create therapist logins, reset passwords, and suspend/reactivate access.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-950/50 text-neutral-400 font-medium border-b border-neutral-800 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Therapist</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    Loading…
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    No therapist accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{therapistName(account)}</td>
                    <td className="px-6 py-4 text-neutral-400">{account.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${account.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {account.status === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{new Date(account.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(account)}
                        className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Therapist Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} noValidate className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Therapist</label>
              <select
                required
                value={createForm.therapistId}
                onChange={(e) => setCreateForm({ ...createForm, therapistId: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="" disabled>Select therapist</option>
                {therapists.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
            <DialogFooter>
              <button
                type="submit"
                disabled={createLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors disabled:opacity-70"
              >
                {createLoading ? 'Creating…' : 'Create'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Therapist Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} noValidate className="space-y-4 py-4">
            <div className="text-sm text-neutral-400">
              Therapist: <span className="text-white font-medium">{editing ? therapistName(editing) : '—'}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Reset password (optional)</label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                placeholder="Leave blank to keep current"
              />
            </div>
            <DialogFooter>
              <button
                type="submit"
                disabled={editLoading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors disabled:opacity-70"
              >
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
