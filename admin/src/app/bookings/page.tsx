'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Link as LinkIcon, User as UserIcon, Plus, Trash2, Pencil } from 'lucide-react';
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

interface Booking {
    _id: string;
    userId: { _id: string; name: string; email: string };
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

export default function BookingsPage() {
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Available Data for Dropdowns
    const [users, setUsers] = useState<SelectUser[]>([]);
    const [therapists, setTherapists] = useState<SelectTherapist[]>([]);

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        userId: '',
        therapistId: '',
        date: '',
        time: '',
        sessionType: 'video',
        status: 'confirmed'
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
                api.get('/admin/therapists')
            ]);
            setBookings(bookingsRes.data);
            setUsers(usersRes.data);
            setTherapists(therapistsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast({
                variant: 'error',
                title: 'Unable to load bookings',
                items: [getApiErrorMessage(error, 'Failed to fetch booking data.')],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (!createFormData.userId) errors.userId = 'User selection is required.';
        if (!createFormData.therapistId) errors.therapistId = 'Therapist selection is required.';
        if (!createFormData.date) errors.date = 'Date is required.';
        if (!createFormData.time) errors.time = 'Time is required.';
        if (!createFormData.sessionType) errors.sessionType = 'Session type is required.';

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these booking errors',
                items: messages,
            });
            return;
        }

        setCreateLoading(true);
        try {
            await api.post('/admin/bookings', createFormData);
            setIsCreateOpen(false);
            setCreateFormData({ userId: '', therapistId: '', date: '', time: '', sessionType: 'video', status: 'confirmed' });
            toast({
                title: 'Booking created',
                description: 'The booking was created successfully.',
            });
            fetchBookings();
        } catch (error) {
            console.error('Failed to create booking', error);
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
        if (editFormData.meetingLink.trim() && !isValidUrl(editFormData.meetingLink.trim())) {
            errors.meetingLink = 'Meeting link must be a valid URL.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these booking errors',
                items: messages,
            });
            return;
        }

        setEditLoading(true);
        try {
            await api.put(`/admin/bookings/${editingBooking._id}`, {
                status: editFormData.status,
                meetingLink: editFormData.meetingLink.trim(),
                reschedule: { date: editFormData.date, time: editFormData.time },
            });
            setIsEditOpen(false);
            setEditingBooking(null);
            toast({
                title: 'Booking updated',
                description: 'The booking changes were saved successfully.',
            });
            fetchBookings();
        } catch (error) {
            console.error('Failed to update booking', error);
            toast({
                variant: 'error',
                title: 'Unable to update booking',
                items: [getApiErrorMessage(error, 'Failed to update booking.')],
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!bookingToDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/bookings/${bookingToDelete._id}`);
            setIsDeleteOpen(false);
            toast({
                title: 'Booking deleted',
                description: 'The booking was deleted successfully.',
            });
            fetchBookings();
        } catch (error) {
            console.error('Failed to delete booking', error);
            toast({
                variant: 'error',
                title: 'Unable to delete booking',
                items: [getApiErrorMessage(error, 'Failed to delete booking.')],
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            await api.put(`/admin/bookings/${id}`, { status: newStatus });
            toast({
                title: 'Booking status updated',
                description: `Status changed to ${newStatus}.`,
            });
            fetchBookings();
        } catch (error) {
            console.error('Failed to update booking status', error);
            toast({
                variant: 'error',
                title: 'Unable to update booking status',
                items: [getApiErrorMessage(error, 'Failed to update booking status.')],
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusStyle = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20'; // pending
        }
    };

    return (
        <div className="space-y-6">
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
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                        Loading bookings...
                                    </td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                    <UserIcon className="w-4 h-4 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{booking.userId?.name || 'Unknown User'}</div>
                                                    <div className="text-xs text-neutral-500">{booking.userId?.email || ''}</div>
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
                                                    {booking.time} ({booking.sessionType})
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking.meetingLink ? (
                                                <a
                                                    href={booking.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-medium"
                                                >
                                                    <LinkIcon className="w-3.5 h-3.5 mr-1" />
                                                    Join Link
                                                </a>
                                            ) : (
                                                <span className="text-neutral-600 text-xs italic">Not generated yet</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(booking.status)}`}>
                                                    {booking.status}
                                                </span>

                                                <select
                                                    disabled={updatingId === booking._id}
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                                    className={`bg-neutral-950 border border-neutral-700 text-white text-xs rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-1.5 ${updatingId === booking._id ? 'opacity-50 cursor-not-allowed' : ''
                                                        }`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <button
                                                    onClick={() => openEditDialog(booking)}
                                                    className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit Booking"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteDialog(booking)}
                                                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete Booking"
                                                >
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

            {/* Create Booking Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Booking</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} noValidate className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">User</label>
                            <select
                                required
                                value={createFormData.userId}
                                onChange={(e) => setCreateFormData({ ...createFormData, userId: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            >
                                <option value="" disabled>Select a user...</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Therapist</label>
                            <select
                                required
                                value={createFormData.therapistId}
                                onChange={(e) => setCreateFormData({ ...createFormData, therapistId: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            >
                                <option value="" disabled>Select a therapist...</option>
                                {therapists.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={createFormData.date}
                                    onChange={(e) => setCreateFormData({ ...createFormData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Time</label>
                                <input
                                    type="time"
                                    required
                                    value={createFormData.time}
                                    onChange={(e) => setCreateFormData({ ...createFormData, time: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Session Type</label>
                            <select
                                required
                                value={createFormData.sessionType}
                                onChange={(e) => setCreateFormData({ ...createFormData, sessionType: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            >
                                <option value="video">Video</option>
                                <option value="phone">Phone</option>
                                <option value="chat">Chat</option>
                                <option value="audio">Audio</option>
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
                                {createLoading ? 'Creating...' : 'Create Booking'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete Booking</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-neutral-400 text-sm">
                            Are you sure you want to delete this booking for <span className="text-white font-medium">{bookingToDelete?.userId?.name}</span> with <span className="text-white font-medium">{bookingToDelete?.therapistId?.name}</span>?
                            This action cannot be undone.
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
                            {deleteLoading ? 'Deleting...' : 'Yes, delete booking'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Booking Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Booking</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} noValidate className="space-y-4 py-4">
                        <div className="text-sm text-neutral-400">
                            Client: <span className="text-white font-medium">{editingBooking?.userId?.name}</span>
                            <span className="text-neutral-500"> • </span>
                            Therapist: <span className="text-white font-medium">{editingBooking?.therapistId?.name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={editFormData.date}
                                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Time</label>
                                <input
                                    type="time"
                                    required
                                    value={editFormData.time}
                                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                                    className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                            <select
                                value={editFormData.status}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Booking['status'] })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none"
                            >
                                <option value="pending">pending</option>
                                <option value="confirmed">confirmed</option>
                                <option value="completed">completed</option>
                                <option value="cancelled">cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Meeting Link (optional)</label>
                            <input
                                type="url"
                                value={editFormData.meetingLink}
                                onChange={(e) => setEditFormData({ ...editFormData, meetingLink: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                placeholder="https://..."
                            />
                        </div>

                        <DialogFooter className="border-t border-neutral-800 pt-4 mt-2">
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
        </div>
    );
}
