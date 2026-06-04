'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import api from '@/lib/axios';

type Coupon = {
    _id: string;
    code: string;
    discountPercentage: number;
    isActive: boolean;
    expiresAt?: string;
    maxUsage?: number;
    currentUsage: number;
    createdAt: string;
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        discountPercentage: 10,
        isActive: true,
        expiresAt: '',
        maxUsage: '',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (coupon?: Coupon) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                discountPercentage: coupon.discountPercentage,
                isActive: coupon.isActive,
                expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
                maxUsage: coupon.maxUsage ? String(coupon.maxUsage) : '',
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                discountPercentage: 10,
                isActive: true,
                expiresAt: '',
                maxUsage: '',
            });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCoupon(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                code: formData.code,
                discountPercentage: Number(formData.discountPercentage),
                isActive: formData.isActive,
                ...(formData.expiresAt ? { expiresAt: formData.expiresAt } : {}),
                ...(formData.maxUsage ? { maxUsage: Number(formData.maxUsage) } : {}),
            };

            if (editingCoupon) {
                await api.put(`/coupons/${editingCoupon._id}`, payload);
            } else {
                await api.post('/coupons', payload);
            }
            fetchCoupons();
            handleCloseForm();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save coupon');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            fetchCoupons();
        } catch (error) {
            console.error('Failed to delete coupon', error);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Coupons</h1>
                    <p className="mt-2 text-neutral-400 text-sm">Manage discount codes for bookings.</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-bold text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                >
                    <Plus className="h-4 w-4" />
                    New Coupon
                </button>
            </div>

            {isFormOpen && (
                <div className="mb-8 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-xl">
                    <h2 className="mb-6 text-xl font-semibold text-white">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-300">Code (e.g. SUMMER20)</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-300">Discount Percentage (%)</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-300">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-300">Max Usage (Optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Leave blank for unlimited"
                                    value={formData.maxUsage}
                                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                                    className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-neutral-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                    <span className="ml-3 text-sm font-medium text-neutral-300">Active Status</span>
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="rounded-xl px-5 py-2.5 text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
                            >
                                {editingCoupon ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex h-32 items-center justify-center text-neutral-500">Loading coupons...</div>
            ) : coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-neutral-900/20 py-20">
                    <Ticket className="mb-4 h-12 w-12 text-neutral-600" />
                    <h3 className="text-lg font-medium text-white">No coupons yet</h3>
                    <p className="mt-1 text-sm text-neutral-400">Create a coupon to offer discounts to your users.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {coupons.map((coupon) => (
                        <div key={coupon._id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-xl transition-all hover:bg-neutral-900/80 hover:shadow-xl">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold tracking-tight text-white">{coupon.code}</h3>
                                        {!coupon.isActive && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">Inactive</span>}
                                    </div>
                                    <p className="mt-1 text-2xl font-black text-emerald-400">{coupon.discountPercentage}% OFF</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenForm(coupon)} className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(coupon._id)} className="rounded-lg p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-6 space-y-2 text-sm text-neutral-400">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span>Usage</span>
                                    <span className="font-medium text-white">{coupon.currentUsage} {coupon.maxUsage ? `/ ${coupon.maxUsage}` : 'uses'}</span>
                                </div>
                                {coupon.expiresAt && (
                                    <div className="flex justify-between pt-2">
                                        <span>Expires</span>
                                        <span className="font-medium text-white">{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
