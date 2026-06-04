'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Pencil, Tag, ExternalLink, Image as ImageIcon, AlignLeft, Smartphone, Monitor, Upload } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';

interface OfferBanner {
    _id: string;
    type: 'text' | 'image';
    text: string;
    code: string;
    link: string;
    mobileImageUrl: string;
    desktopImageUrl: string;
    isActive: boolean;
}

export default function OfferBannersPage() {
    const { toast } = useToast();
    const [offerBanners, setOfferBanners] = useState<OfferBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [type, setType] = useState<'text' | 'image'>('text');
    const [text, setText] = useState('');
    const [code, setCode] = useState('');
    const [link, setLink] = useState('');
    const [isActive, setIsActive] = useState(true);
    
    // File upload states
    const [mobileFile, setMobileFile] = useState<File | null>(null);
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string | null>(null);
    const [desktopPreview, setDesktopPreview] = useState<string | null>(null);

    const mobileInputRef = useRef<HTMLInputElement>(null);
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const editMobileInputRef = useRef<HTMLInputElement>(null);
    const editDesktopInputRef = useRef<HTMLInputElement>(null);

    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<OfferBanner | null>(null);
    const [editFormData, setEditFormData] = useState({
        type: 'text' as 'text' | 'image',
        text: '',
        code: '',
        link: '',
        mobileImageUrl: '',
        desktopImageUrl: '',
        isActive: true
    });
    
    const [editMobileFile, setEditMobileFile] = useState<File | null>(null);
    const [editDesktopFile, setEditDesktopFile] = useState<File | null>(null);
    const [editMobilePreview, setEditMobilePreview] = useState<string | null>(null);
    const [editDesktopPreview, setEditDesktopPreview] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    const fetchOfferBanners = async () => {
        try {
            const res = await api.get('/offer-banners/all');
            setOfferBanners(res.data);
        } catch (error) {
            console.error('Failed to fetch offer banners', error);
            toast({
                variant: 'error',
                title: 'Unable to load offer banners',
                items: [getApiErrorMessage(error, 'Failed to fetch offer banners.')],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfferBanners();
    }, []);

    const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMobileFile(file);
            setMobilePreview(URL.createObjectURL(file));
        }
    };

    const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDesktopFile(file);
            setDesktopPreview(URL.createObjectURL(file));
        }
    };

    const handleEditMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditMobileFile(file);
            setEditMobilePreview(URL.createObjectURL(file));
        }
    };

    const handleEditDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditDesktopFile(file);
            setEditDesktopPreview(URL.createObjectURL(file));
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (type === 'text' && !text.trim()) {
            errors.text = 'Offer text is required for a text offer banner.';
        }

        if (type === 'image') {
            if (!mobileFile) {
                errors.mobileImage = 'Mobile banner image file is required.';
            }
            if (!desktopFile) {
                errors.desktopImage = 'Desktop banner image file is required.';
            }
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these errors',
                items: messages,
            });
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('link', link.trim());
            formData.append('isActive', isActive.toString());

            if (type === 'text') {
                formData.append('text', text.trim());
                formData.append('code', code.trim());
            } else {
                if (mobileFile) formData.append('mobileImage', mobileFile);
                if (desktopFile) formData.append('desktopImage', desktopFile);
            }

            await api.post('/offer-banners', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setText('');
            setCode('');
            setLink('');
            setMobileFile(null);
            setDesktopFile(null);
            setMobilePreview(null);
            setDesktopPreview(null);
            if (mobileInputRef.current) mobileInputRef.current.value = '';
            if (desktopInputRef.current) desktopInputRef.current.value = '';
            
            setIsActive(true);
            toast({
                title: 'Offer banner created',
                description: 'The offer banner was created successfully.',
            });
            fetchOfferBanners();
        } catch (error) {
            console.error('Failed to create offer banner', error);
            toast({
                variant: 'error',
                title: 'Unable to create offer banner',
                items: [getApiErrorMessage(error, 'Failed to create offer banner.')],
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (banner: OfferBanner) => {
        setEditingBanner(banner);
        setEditFormData({
            type: banner.type || 'text',
            text: banner.text || '',
            code: banner.code || '',
            link: banner.link || '',
            mobileImageUrl: banner.mobileImageUrl || '',
            desktopImageUrl: banner.desktopImageUrl || '',
            isActive: banner.isActive,
        });
        setEditMobileFile(null);
        setEditDesktopFile(null);
        setEditMobilePreview(banner.mobileImageUrl || null);
        setEditDesktopPreview(banner.desktopImageUrl || null);
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBanner) return;

        const errors: Record<string, string | undefined> = {};
        if (editFormData.type === 'text' && !editFormData.text.trim()) {
            errors.text = 'Offer text is required for a text offer banner.';
        }

        if (editFormData.type === 'image') {
            if (!editMobilePreview && !editMobileFile) {
                errors.mobileImage = 'Mobile banner image is required.';
            }
            if (!editDesktopPreview && !editDesktopFile) {
                errors.desktopImage = 'Desktop banner image is required.';
            }
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these errors',
                items: messages,
            });
            return;
        }

        setEditLoading(true);
        try {
            const formData = new FormData();
            formData.append('type', editFormData.type);
            formData.append('link', editFormData.link.trim());
            formData.append('isActive', editFormData.isActive.toString());

            if (editFormData.type === 'text') {
                formData.append('text', editFormData.text.trim());
                formData.append('code', editFormData.code.trim());
            } else {
                if (editMobileFile) formData.append('mobileImage', editMobileFile);
                if (editDesktopFile) formData.append('desktopImage', editDesktopFile);
            }

            await api.put(`/offer-banners/${editingBanner._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setIsEditOpen(false);
            toast({
                title: 'Offer banner updated',
                description: 'The offer banner was updated successfully.',
            });
            fetchOfferBanners();
        } catch (error) {
            console.error('Failed to update offer banner', error);
            toast({
                variant: 'error',
                title: 'Unable to update offer banner',
                items: [getApiErrorMessage(error, 'Failed to update offer banner.')],
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer banner?')) return;

        setDeleteLoadingId(id);
        try {
            await api.delete(`/offer-banners/${id}`);
            toast({
                title: 'Offer banner deleted',
                description: 'The offer banner was deleted successfully.',
            });
            fetchOfferBanners();
        } catch (error) {
            console.error('Failed to delete offer banner', error);
            toast({
                variant: 'error',
                title: 'Unable to delete offer banner',
                items: [getApiErrorMessage(error, 'Failed to delete offer banner.')],
            });
        } finally {
            setDeleteLoadingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-neutral-400">Loading offer banners...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Manage Offer Banners</h1>
                    <p className="text-neutral-400">Upload and manage premium text promos or responsive visual banners for mobile and desktop screens.</p>
                </div>
            </div>

            <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
                <h2 className="text-lg font-semibold mb-6 text-white font-display">Create New Offer Banner</h2>
                
                {/* Banner Type Tabs */}
                <div className="flex gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-lg w-fit mb-6">
                    <button
                        type="button"
                        onClick={() => setType('text')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${type === 'text' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                        <AlignLeft className="w-4 h-4" /> Text Banner
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('image')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${type === 'image' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Image Banner
                    </button>
                </div>

                <form onSubmit={handleCreate} noValidate className="space-y-4">
                    {type === 'text' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Promo/Offer Text</label>
                                <textarea
                                    required
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600 text-sm"
                                    placeholder="E.g., Special Launch Offer: Use code REBALANCE20 for 20% off your first session!"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Coupon/Promo Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600 text-sm"
                                        placeholder="E.g., REBALANCE20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Redirect Link (Optional)</label>
                                    <input
                                        type="text"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600 text-sm"
                                        placeholder="E.g., /therapists"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                                        <Smartphone className="w-4 h-4 text-emerald-500" /> Mobile View Image Upload (Small Width Devices)
                                    </label>
                                    <input
                                        ref={mobileInputRef}
                                        type="file"
                                        required
                                        accept="image/*"
                                        onChange={handleMobileFileChange}
                                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 focus:outline-none"
                                    />
                                    {mobilePreview && (
                                        <div className="mt-4 h-28 w-16 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                                            <img src={mobilePreview} alt="Mobile preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
                                        <Monitor className="w-4 h-4 text-emerald-500" /> Desktop View Image Upload (Large Width Devices)
                                    </label>
                                    <input
                                        ref={desktopInputRef}
                                        type="file"
                                        required
                                        accept="image/*"
                                        onChange={handleDesktopFileChange}
                                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 focus:outline-none"
                                    />
                                    {desktopPreview && (
                                        <div className="mt-4 h-20 w-36 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                                            <img src={desktopPreview} alt="Desktop preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Banner Click Redirection Link (Optional)</label>
                                <input
                                    type="text"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600 text-sm"
                                    placeholder="E.g., /therapists"
                                />
                            </div>
                        </>
                    )}

                    <label className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-800/20 transition-colors w-fit">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 text-emerald-500 bg-neutral-950 border-neutral-700 rounded focus:ring-emerald-500/20"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Active Status</span>
                            <span className="text-xs text-neutral-500">Show this banner immediately</span>
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 text-sm"
                    >
                        {submitting ? 'Creating and Uploading...' : 'Create Offer Banner'}
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white font-display">Active & Inactive Offer Banners</h2>
                <div className="grid grid-cols-1 gap-6">
                    {offerBanners.map(banner => (
                        <div key={banner._id} className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6 flex flex-col md:flex-row gap-6 relative group">
                            
                            {/* Visual Type Indicators */}
                            <div className="shrink-0 flex items-center justify-center w-14 h-14 bg-neutral-950 rounded-2xl border border-neutral-800 text-emerald-500">
                                {banner.type === 'image' ? <ImageIcon className="w-6 h-6" /> : <AlignLeft className="w-6 h-6" />}
                            </div>

                            <div className="space-y-3 flex-1">
                                {banner.type === 'image' ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Image-based Announcement</span>
                                        </div>
                                        {/* Responsive Previews */}
                                        <div className="flex flex-wrap gap-4">
                                            {banner.mobileImageUrl && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-neutral-500 flex items-center gap-1"><Smartphone className="w-3 h-3" /> Mobile View</span>
                                                    <div className="h-20 w-12 rounded-lg overflow-hidden border border-neutral-800">
                                                        <img src={banner.mobileImageUrl} alt="Mobile preview" className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                            )}
                                            {banner.desktopImageUrl && (
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-neutral-500 flex items-center gap-1"><Monitor className="w-3 h-3" /> Desktop View</span>
                                                    <div className="h-20 w-36 rounded-lg overflow-hidden border border-neutral-800">
                                                        <img src={banner.desktopImageUrl} alt="Desktop preview" className="w-full h-full object-cover" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Text-based Announcement</span>
                                        <p className="text-white text-base font-semibold leading-relaxed">{banner.text}</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${banner.isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                            }`}
                                    >
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {banner.type === 'text' && banner.code && (
                                        <span className="inline-flex items-center gap-1 bg-neutral-950 text-neutral-300 border border-neutral-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                            <Tag className="w-3 h-3 text-emerald-500" /> Code: {banner.code}
                                        </span>
                                    )}
                                    {banner.link && (
                                        <span className="inline-flex items-center gap-1 bg-neutral-950 text-neutral-300 border border-neutral-800 px-2.5 py-0.5 rounded-full text-xs">
                                            <ExternalLink className="w-3 h-3 text-blue-400" /> Link: {banner.link}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                <button
                                    onClick={() => openEditDialog(banner)}
                                    className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 hover:text-white rounded-lg transition-all"
                                    title="Edit Offer Banner"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(banner._id)}
                                    disabled={deleteLoadingId === banner._id}
                                    className="p-2.5 bg-neutral-800 hover:bg-red-500/20 text-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                                    title="Delete Offer Banner"
                                >
                                    {deleteLoadingId === banner._id ? (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                    {offerBanners.length === 0 && (
                        <div className="text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                            No offer banners found.
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-neutral-905 border border-neutral-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-white font-display">Edit Offer Banner</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} noValidate className="space-y-4 py-4">
                        
                        {/* Edit Banner Type Selector */}
                        <div className="flex gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setEditFormData({ ...editFormData, type: 'text' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all ${editFormData.type === 'text' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <AlignLeft className="w-3.5 h-3.5" /> Text
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditFormData({ ...editFormData, type: 'image' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all ${editFormData.type === 'image' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" /> Image
                            </button>
                        </div>

                        {editFormData.type === 'text' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Promo/Offer Text</label>
                                    <textarea
                                        required
                                        value={editFormData.text}
                                        onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Coupon/Promo Code (Optional)</label>
                                        <input
                                            type="text"
                                            value={editFormData.code}
                                            onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Redirect Link (Optional)</label>
                                        <input
                                            type="text"
                                            value={editFormData.link}
                                            onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Replace Mobile Image (File Upload)</label>
                                        <input
                                            ref={editMobileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditMobileFileChange}
                                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 focus:outline-none"
                                        />
                                        {editMobilePreview && (
                                            <div className="mt-2 h-20 w-12 rounded-lg overflow-hidden border border-neutral-800">
                                                <img src={editMobilePreview} alt="Mobile preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-1"><Monitor className="w-3.5 h-3.5 text-emerald-500" /> Replace Desktop Image (File Upload)</label>
                                        <input
                                            ref={editDesktopInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditDesktopFileChange}
                                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 focus:outline-none"
                                        />
                                        {editDesktopPreview && (
                                            <div className="mt-2 h-20 w-36 rounded-lg overflow-hidden border border-neutral-800">
                                                <img src={editDesktopPreview} alt="Desktop preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Redirection Link</label>
                                        <input
                                            type="text"
                                            value={editFormData.link}
                                            onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <label className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-800/20 transition-colors">
                            <input
                                type="checkbox"
                                checked={editFormData.isActive}
                                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                                className="w-4 h-4 text-emerald-500 bg-neutral-950 border-neutral-700 rounded focus:ring-emerald-500/20"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Active Status</span>
                                <span className="text-xs text-neutral-500">Show this banner immediately</span>
                            </div>
                        </label>

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
                                {editLoading ? 'Saving and Uploading...' : 'Save Changes'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
