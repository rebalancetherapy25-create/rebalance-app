'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Calendar as CalendarIcon,
    Clock,
    Link as LinkIcon,
    User as UserIcon,
    Plus,
    Trash2,
    Pencil,
    Search,
    X,
    Video,
    Phone,
    MessageSquare,
    Headphones,
    ChevronDown,
    Check,
} from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { getApiErrorMessage, getErrorMessages, isValidUrl } from '@/lib/form-validation';
import { formatSlotTime } from '@/lib/date';

interface Booking {
    _id: string;
    userId?: { _id: string; name: string; email: string } | null;
    guestContact?: { name: string; email: string };
    therapistId: { _id: string; name: string };
    date: string;
    time: string;
    sessionType: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    meetingLink?: string;
    createdAt: string;
}

interface SelectUser {
    _id: string;
    name: string;
    email: string;
}

interface SelectTherapist {
    _id: string;
    name: string;
}

type SortField = 'date' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<Booking['status'], string> = {
    pending: 'text-amber-400',
    confirmed: 'text-emerald-400',
    completed: 'text-blue-400',
    cancelled: 'text-red-400',
};

const SESSION_TYPES = [
    { value: 'video', label: 'Video', Icon: Video },
    { value: 'phone', label: 'Phone', Icon: Phone },
    { value: 'chat', label: 'Chat', Icon: MessageSquare },
    { value: 'audio', label: 'Audio', Icon: Headphones },
] as const;

// Searchable combobox for user / therapist selection
function Combobox<T extends { _id: string; label: string; sub?: string }>({
    items,
    value,
    onChange,
    placeholder,
}: {
    items: T[];
    value: string;
    onChange: (id: string) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const selected = items.find((i) => i._id === value);

    const filtered = query.trim()
        ? items.filter(
              (i) =>
                  i.label.toLowerCase().includes(query.toLowerCase()) ||
                  (i.sub || '').toLowerCase().includes(query.toLowerCase())
          )
        : items;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (id: string) => {
        onChange(id);
        setQuery('');
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3 py-2.5 bg-neutral-950 border rounded-lg text-sm transition-colors text-left ${open ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-neutral-800 hover:border-neutral-700'}`}
            >
                {selected ? (
                    <span className="flex-1 min-w-0">
                        <span className="text-white">{selected.label}</span>
                        {selected.sub && <span className="text-neutral-500 ml-1.5 text-xs">{selected.sub}</span>}
                    </span>
                ) : (
                    <span className="text-neutral-500 flex-1">{placeholder}</span>
                )}
                <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {selected && (
                        <span onClick={handleClear} className="p-0.5 hover:text-white text-neutral-500">
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-neutral-800">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-7 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-neutral-500 text-center">No results found</div>
                        ) : (
                            filtered.map((item) => (
                                <button
                                    key={item._id}
                                    type="button"
                                    onClick={() => handleSelect(item._id)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-800 transition-colors text-left"
                                >
                                    <span>
                                        <span className="text-sm text-white block">{item.label}</span>
                                        {item.sub && <span className="text-xs text-neutral-500">{item.sub}</span>}
                                    </span>
                                    {item._id === value && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BookingsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [users, setUsers] = useState<SelectUser[]>([]);
    const [therapists, setTherapists] = useState<SelectTherapist[]>([]);

    // Search / Filter / Sort
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all');
    const [therapistFilter, setTherapistFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        userId: '',
        therapistId: '',
        date: '',
        time: '',
        sessionType: 'video',
        status: 'confirmed',
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editFormData, setEditFormData] = useState({
        date: '',
        time: '',
        status: 'confirmed' as Booking['status'],
        meetingLink: '',
    });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const [bookingsRes, usersRes, therapistsRes] = await Promise.all([
                api.get('/admin/bookings'),
                api.get('/admin/users'),
                api.get('/admin/therapists'),
            ]);
            setBookings(bookingsRes.data);
            setUsers(usersRes.data);
            setTherapists(therapistsRes.data);
        } catch (error) {
            toast({
                variant: 'error',
                title: 'Unable to load bookings',
                items: [getApiErrorMessage(error, 'Failed to fetch booking data.')],
            });
        } finally {
            setLoading(false);
        }
    };

    const userItems = useMemo(
        () => users.map((u) => ({ _id: u._id, label: u.name, sub: u.email })),
        [users]
    );
    const therapistItems = useMemo(
        () => therapists.map((t) => ({ _id: t._id, label: t.name })),
        [therapists]
    );

    const uniqueTherapists = useMemo(() => {
        const seen = new Map<string, string>();
        bookings.forEach((b) => {
            if (b.therapistId?._id) seen.set(b.therapistId._id, b.therapistId.name);
        });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        let list = [...bookings];
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter((b) => {
                const clientName = (b.userId?.name || b.guestContact?.name || '').toLowerCase();
                const clientEmail = (b.userId?.email || b.guestContact?.email || '').toLowerCase();
                const therapistName = (b.therapistId?.name || '').toLowerCase();
                return clientName.includes(q) || clientEmail.includes(q) || therapistName.includes(q);
            });
        }
        if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
        if (therapistFilter !== 'all') list = list.filter((b) => b.therapistId?._id === therapistFilter);
        list.sort((a, b) => {
            const aVal = sortField === 'date' ? `${a.date}T${a.time}` : a.createdAt;
            const bVal = sortField === 'date' ? `${b.date}T${b.time}` : b.createdAt;
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        return list;
    }, [bookings, searchQuery, statusFilter, therapistFilter, sortField, sortDir]);

    const resetCreateForm = () =>
        setCreateFormData({ userId: '', therapistId: '', date: '', time: '', sessionType: 'video', status: 'confirmed' });

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};
        if (!createFormData.userId) errors.userId = 'Please select a user.';
        if (!createFormData.therapistId) errors.therapistId = 'Please select a therapist.';
        if (!createFormData.date) errors.date = 'Date is required.';
        if (!createFormData.time) errors.time = 'Time is required.';

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({ variant: 'error', title: 'Please fix these errors', items: messages });
            return;
        }

        setCreateLoading(true);
        try {
            await api.post('/admin/bookings', createFormData);
            setIsCreateOpen(false);
            resetCreateForm();
            toast({ title: 'Booking created', description: 'The booking was created successfully.' });
            fetchBookings();
        } catch (error) {
            toast({
                variant: 'error',
                title: 'Unable to create booking',
                items: [getApiErrorMessage(error, 'Failed to create booking.')],
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const openDeleteDialog = (booking: Booking) => {
        setBookingToDelete(booking);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!bookingToDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/bookings/${bookingToDelete._id}`);
            setIsDeleteOpen(false);
            toast({ title: 'Booking deleted', description: 'The booking was deleted successfully.' });
            fetchBookings();
        } catch (error) {
            toast({
                variant: 'error',
                title: 'Unable to delete booking',
                items: [getApiErrorMessage(error, 'Failed to delete booking.')],
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const openEditDialog = (booking: Booking) => {
        setEditingBooking(booking);
        setEditFormData({
            date: booking.date,
            time: booking.time,
            status: booking.status,
            meetingLink: booking.meetingLink || '',
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBooking) return;
        const errors: Record<string, string | undefined> = {};
        if (!editFormData.date) errors.date = 'Date is required.';
        if (!editFormData.time) errors.time = 'Time is required.';
        if (editFormData.meetingLink.trim() && !isValidUrl(editFormData.meetingLink.trim()))
            errors.meetingLink = 'Meeting link must be a valid URL.';

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({ variant: 'error', title: 'Please fix these errors', items: messages });
            return;
        }

        const needsReschedule =
            editFormData.date !== editingBooking.date || editFormData.time !== editingBooking.time;
        const needsStatusUpdate =
            editFormData.status !== editingBooking.status ||
            editFormData.meetingLink.trim() !== (editingBooking.meetingLink || '');

        if (!needsReschedule && !needsStatusUpdate) {
            setIsEditOpen(false);
            setEditingBooking(null);
            return;
        }

        setEditLoading(true);
        try {
            if (needsReschedule) {
                await api.put(`/admin/bookings/${editingBooking._id}`, {
                    reschedule: { date: editFormData.date, time: editFormData.time },
                });
            }
            if (needsStatusUpdate) {
                await api.put(`/admin/bookings/${editingBooking._id}`, {
                    status: editFormData.status,
                    meetingLink: editFormData.meetingLink.trim(),
                });
            }
            setIsEditOpen(false);
            setEditingBooking(null);
            toast({ title: 'Booking updated', description: 'Changes saved successfully.' });
            fetchBookings();
        } catch (error) {
            toast({
                variant: 'error',
                title: 'Unable to update booking',
                items: [getApiErrorMessage(error, 'Failed to update booking.')],
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            await api.put(`/admin/bookings/${id}`, { status: newStatus });
            toast({ title: 'Status updated', description: `Booking changed to ${newStatus}.` });
            fetchBookings();
        } catch (error) {
            toast({
                variant: 'error',
                title: 'Unable to update status',
                items: [getApiErrorMessage(error, 'Failed to update booking status.')],
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const hasFilters = searchQuery || statusFilter !== 'all' || therapistFilter !== 'all';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Manage Bookings</h1>
                    <p className="text-neutral-400">View platform-wide calendar bookings and update statuses.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Booking
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search client or therapist..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={therapistFilter}
                        onChange={(e) => setTherapistFilter(e.target.value)}
                        className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="all">All therapists</option>
                        {uniqueTherapists.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <select
                        value={`${sortField}:${sortDir}`}
                        onChange={(e) => {
                            const [field, dir] = e.target.value.split(':') as [SortField, SortDir];
                            setSortField(field);
                            setSortDir(dir);
                        }}
                        className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option value="createdAt:desc">Newest first</option>
                        <option value="createdAt:asc">Oldest first</option>
                        <option value="date:desc">Session date ↓</option>
                        <option value="date:asc">Session date ↑</option>
                    </select>
                    {hasFilters && (
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTherapistFilter('all'); }}
                            className="px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
                {hasFilters && (
                    <p className="mt-2 text-xs text-neutral-500">
                        Showing {filteredBookings.length} of {bookings.length} bookings
                    </p>
                )}
            </div>

            {/* Table */}
            <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-950/50 text-neutral-400 font-medium border-b border-neutral-800 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Therapist</th>
                                <th className="px-6 py-4">Session Info</th>
                                <th className="px-6 py-4">Meeting</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-neutral-300">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Loading bookings...</td></tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                    {hasFilters ? 'No bookings match your filters.' : 'No bookings found.'}
                                </td></tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="w-4 h-4 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">
                                                        {booking.userId?.name || booking.guestContact?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">
                                                        {booking.userId?.email || booking.guestContact?.email || ''}
                                                        {!booking.userId && booking.guestContact && (
                                                            <span className="ml-1.5 text-[10px] text-amber-500/80 font-medium uppercase tracking-wide">Guest</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            Dr. {booking.therapistId?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-neutral-300">
                                                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                                                    {booking.date}
                                                </div>
                                                <div className="flex items-center text-neutral-400 text-xs">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                                                    {formatSlotTime(booking.time)} ({booking.sessionType})
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking.meetingLink ? (
                                                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-medium">
                                                    <LinkIcon className="w-3.5 h-3.5 mr-1" />Join Link
                                                </a>
                                            ) : (
                                                <span className="text-neutral-600 text-xs italic">Not generated yet</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <select
                                                    disabled={updatingId === booking._id || booking.status === 'completed' || booking.status === 'cancelled'}
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                                    className={`bg-neutral-950 border border-neutral-700 text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-1.5 ${STATUS_COLORS[booking.status]} ${updatingId === booking._id || booking.status === 'completed' || booking.status === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <button onClick={() => openEditDialog(booking)}
                                                    className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openDeleteDialog(booking)}
                                                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add Booking Dialog ── */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetCreateForm(); setIsCreateOpen(open); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Booking</DialogTitle>
                        <p className="text-sm text-neutral-500 mt-1">Fill in all required fields to manually create a booking.</p>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} noValidate className="space-y-5 pt-2">
                        {/* User */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-300">
                                User <span className="text-red-400">*</span>
                            </label>
                            <Combobox
                                items={userItems}
                                value={createFormData.userId}
                                onChange={(id) => setCreateFormData((f) => ({ ...f, userId: id }))}
                                placeholder="Search and select a user..."
                            />
                        </div>

                        {/* Therapist */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-300">
                                Therapist <span className="text-red-400">*</span>
                            </label>
                            <Combobox
                                items={therapistItems}
                                value={createFormData.therapistId}
                                onChange={(id) => setCreateFormData((f) => ({ ...f, therapistId: id }))}
                                placeholder="Search and select a therapist..."
                            />
                        </div>

                        {/* Date + Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-neutral-300">
                                    Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={createFormData.date}
                                    onChange={(e) => setCreateFormData((f) => ({ ...f, date: e.target.value }))}
                                    className={`w-full px-3 py-2.5 bg-neutral-950 border rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors ${createFormData.date ? 'border-neutral-700' : 'border-neutral-800'}`}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-neutral-300">
                                    Time <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={createFormData.time}
                                    onChange={(e) => setCreateFormData((f) => ({ ...f, time: e.target.value }))}
                                    className={`w-full px-3 py-2.5 bg-neutral-950 border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors ${createFormData.time ? 'border-neutral-700 text-white' : 'border-dashed border-neutral-700 text-neutral-500'}`}
                                />
                                {!createFormData.time && (
                                    <p className="text-xs text-neutral-600">e.g. 10:00 AM</p>
                                )}
                            </div>
                        </div>

                        {/* Session Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-300">Session Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {SESSION_TYPES.map(({ value, label, Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setCreateFormData((f) => ({ ...f, sessionType: value }))}
                                        className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${createFormData.sessionType === value
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-300">Initial Status</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setCreateFormData((f) => ({ ...f, status: s }))}
                                        className={`py-2 rounded-lg border text-xs font-medium capitalize transition-all ${createFormData.status === s
                                            ? s === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                                : s === 'pending' ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                                    : s === 'completed' ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                        : 'bg-red-500/10 border-red-500 text-red-400'
                                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t border-neutral-800">
                            <button
                                type="button"
                                onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}
                                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="px-5 py-2 text-sm font-medium bg-emerald-500 text-neutral-950 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 ml-2"
                            >
                                {createLoading ? 'Creating...' : 'Create Booking'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ── */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete Booking</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-neutral-400 text-sm">
                            Are you sure you want to delete this booking for{' '}
                            <span className="text-white font-medium">
                                {bookingToDelete?.userId?.name || bookingToDelete?.guestContact?.name || 'Unknown User'}
                            </span>{' '}
                            with <span className="text-white font-medium">{bookingToDelete?.therapistId?.name}</span>?
                            This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="border-t border-neutral-800 pt-4 mt-2">
                        <button type="button" onClick={() => setIsDeleteOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="button" onClick={handleDeleteConfirm} disabled={deleteLoading}
                            className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-all disabled:opacity-50 ml-2">
                            {deleteLoading ? 'Deleting...' : 'Yes, delete booking'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Booking</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} noValidate className="space-y-4 py-4">
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-sm">
                            <UserIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                            <span className="text-white font-medium">
                                {editingBooking?.userId?.name || editingBooking?.guestContact?.name || 'Unknown'}
                            </span>
                            <span className="text-neutral-600">→</span>
                            <span className="text-neutral-300">Dr. {editingBooking?.therapistId?.name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-neutral-300">Date</label>
                                <input type="date" required value={editFormData.date}
                                    onChange={(e) => setEditFormData((f) => ({ ...f, date: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-neutral-300">Time</label>
                                <input type="time" required value={editFormData.time}
                                    onChange={(e) => setEditFormData((f) => ({ ...f, time: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-300">Status</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
                                    <button key={s} type="button"
                                        onClick={() => setEditFormData((f) => ({ ...f, status: s }))}
                                        className={`py-2 rounded-lg border text-xs font-medium capitalize transition-all ${editFormData.status === s
                                            ? s === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                                : s === 'pending' ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                                    : s === 'completed' ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                        : 'bg-red-500/10 border-red-500 text-red-400'
                                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-neutral-300">Meeting Link <span className="text-neutral-600 font-normal">(optional)</span></label>
                            <input type="url" value={editFormData.meetingLink}
                                onChange={(e) => setEditFormData((f) => ({ ...f, meetingLink: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                placeholder="https://..." />
                        </div>

                        <DialogFooter className="border-t border-neutral-800 pt-4 mt-2">
                            <button type="button" onClick={() => setIsEditOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={editLoading}
                                className="px-4 py-2 text-sm font-medium bg-emerald-500 text-neutral-950 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 ml-2">
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
