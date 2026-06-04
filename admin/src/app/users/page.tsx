'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, Shield, User as UserIcon, Plus, Search, X } from 'lucide-react';
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

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

function UserSection({
    title, icon, users, emptyMsg, accentClass, onEdit, onDelete,
}: {
    title: string;
    icon: React.ReactNode;
    users: User[];
    emptyMsg: string;
    accentClass: 'purple' | 'emerald';
    onEdit: (u: User) => void;
    onDelete: (u: User) => void;
}) {
    const badge = accentClass === 'purple'
        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    const headerBorder = accentClass === 'purple' ? 'border-purple-500/20' : 'border-emerald-500/20';

    return (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            {/* Section header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBorder} bg-neutral-950/30`}>
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-bold text-white">{title}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge}`}>
                        {users.length}
                    </span>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="px-6 py-10 text-center text-neutral-500 text-sm">{emptyMsg}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-950/50 text-neutral-500 font-medium border-b border-neutral-800 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-neutral-300">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${accentClass === 'purple' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-neutral-400">{user.email}</td>
                                    <td className="px-6 py-3.5 text-neutral-500 text-xs">
                                        {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-3.5 text-right space-x-1">
                                        <button onClick={() => onEdit(user)}
                                            className="p-2 text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDelete(user)}
                                            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [createLoading, setCreateLoading] = useState(false);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [search, setSearch] = useState('');

    const adminUsers = useMemo(() => {
        const q = search.toLowerCase();
        return users.filter(u => u.role === 'admin' && (
            !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        ));
    }, [users, search]);

    const regularUsers = useMemo(() => {
        const q = search.toLowerCase();
        return users.filter(u => u.role !== 'admin' && (
            !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        ));
    }, [users, search]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast({
                variant: 'error',
                title: 'Unable to load users',
                items: [getApiErrorMessage(error, 'Failed to fetch users.')],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (!createFormData.name.trim()) {
            errors.name = 'Full name is required.';
        } else if (createFormData.name.trim().length < 2) {
            errors.name = 'Full name must be at least 2 characters.';
        }

        if (!createFormData.email.trim()) {
            errors.email = 'Email address is required.';
        } else if (!emailPattern.test(createFormData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        if (!createFormData.password.trim()) {
            errors.password = 'Password is required.';
        } else if (createFormData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
        }

        if (!createFormData.role) {
            errors.role = 'Role is required.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these user errors',
                items: messages,
            });
            return;
        }

        setCreateLoading(true);
        try {
            await api.post('/admin/users', {
                ...createFormData,
                name: createFormData.name.trim(),
                email: createFormData.email.trim(),
            });
            setIsCreateOpen(false);
            setCreateFormData({ name: '', email: '', password: '', role: 'user' });
            toast({
                title: 'User created',
                description: 'The new user account was created successfully.',
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user', error);
            toast({
                variant: 'error',
                title: 'Unable to create user',
                items: [getApiErrorMessage(error, 'Failed to create user.')],
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setEditFormData({ name: user.name, email: user.email, role: user.role });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        const errors: Record<string, string | undefined> = {};

        if (!editFormData.name.trim()) {
            errors.name = 'Full name is required.';
        } else if (editFormData.name.trim().length < 2) {
            errors.name = 'Full name must be at least 2 characters.';
        }

        if (!editFormData.email.trim()) {
            errors.email = 'Email address is required.';
        } else if (!emailPattern.test(editFormData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        if (!editFormData.role) {
            errors.role = 'Role is required.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these user errors',
                items: messages,
            });
            return;
        }

        setEditLoading(true);
        try {
            await api.put(`/admin/users/${editingUser._id}`, {
                ...editFormData,
                name: editFormData.name.trim(),
                email: editFormData.email.trim(),
            });
            setIsEditOpen(false);
            toast({
                title: 'User updated',
                description: 'The user details were saved successfully.',
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user', error);
            toast({
                variant: 'error',
                title: 'Unable to update user',
                items: [getApiErrorMessage(error, 'Failed to update user.')],
            });
        } finally {
            setEditLoading(false);
        }
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/users/${userToDelete._id}`);
            setIsDeleteOpen(false);
            toast({
                title: 'User deleted',
                description: 'The user account was deleted successfully.',
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            toast({
                variant: 'error',
                title: 'Unable to delete user',
                items: [getApiErrorMessage(error, 'Failed to delete user.')],
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Manage Users</h1>
                    <p className="text-neutral-400 text-sm">
                        <span className="text-purple-400 font-medium">{users.filter(u => u.role === 'admin').length} admin{users.filter(u => u.role === 'admin').length !== 1 ? 's' : ''}</span>
                        <span className="text-neutral-600 mx-2">·</span>
                        <span className="text-emerald-400 font-medium">{users.filter(u => u.role !== 'admin').length} user{users.filter(u => u.role !== 'admin').length !== 1 ? 's' : ''}</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-xl transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            {/* ── Search ── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-9 pr-9 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none placeholder:text-neutral-600"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-14 bg-neutral-900 rounded-xl border border-neutral-800 animate-pulse" />)}
                </div>
            ) : (
                <>
                    {/* ── Administrators ── */}
                    <UserSection
                        title="Administrators"
                        icon={<Shield className="w-4 h-4 text-purple-400" />}
                        users={adminUsers}
                        emptyMsg={search ? 'No admins match your search.' : 'No administrator accounts.'}
                        accentClass="purple"
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                    />

                    {/* ── Regular Users ── */}
                    <UserSection
                        title="Users"
                        icon={<UserIcon className="w-4 h-4 text-emerald-400" />}
                        users={regularUsers}
                        emptyMsg={search ? 'No users match your search.' : 'No registered users yet.'}
                        accentClass="emerald"
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                    />
                </>
            )}

            {/* Create User Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} noValidate className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={createFormData.name}
                                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={createFormData.email}
                                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={createFormData.password}
                                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Role</label>
                            <select
                                value={createFormData.role}
                                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <DialogFooter className="mt-6 pt-4 border-t border-neutral-800">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="px-4 py-2 text-sm font-medium bg-emerald-500 text-neutral-950 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 ml-2"
                            >
                                {createLoading ? 'Creating...' : 'Create User'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} noValidate className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Role</label>
                            <select
                                value={editFormData.role}
                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <DialogFooter className="mt-6 pt-4 border-t border-neutral-800">
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editLoading}
                                className="px-4 py-2 text-sm font-medium bg-emerald-500 text-neutral-950 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 ml-2"
                            >
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete User</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-neutral-400 text-sm">
                            Are you sure you want to delete <span className="text-white font-medium">{userToDelete?.name}</span>?
                            This action cannot be undone and will permanently remove their access to the platform.
                        </p>
                    </div>
                    <DialogFooter className="border-t border-neutral-800 pt-4 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            disabled={deleteLoading}
                            className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all disabled:opacity-50 ml-2"
                        >
                            {deleteLoading ? 'Deleting...' : 'Yes, delete user'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
