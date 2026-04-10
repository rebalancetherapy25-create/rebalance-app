'use client';

import { useState, useEffect, useRef } from 'react';
import { ImagePlus, Trash2, Pencil } from 'lucide-react';
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

interface Banner {
    _id: string;
    title: string;
    imageUrl: string;
    isActive: boolean;
}

export default function BannersPage() {
    const { toast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [editFormData, setEditFormData] = useState({ title: '', isActive: true });
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const fetchBanners = async () => {
        try {
            const res = await api.get('/banners');
            setBanners(res.data);
        } catch (error) {
            console.error('Failed to fetch banners', error);
            toast({
                variant: 'error',
                title: 'Unable to load banners',
                items: [getApiErrorMessage(error, 'Failed to fetch banners.')],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (!title.trim()) {
            errors.title = 'Banner title is required.';
        }

        if (!imageFile) {
            errors.image = 'Banner image is required.';
        } else if (!imageFile.type.startsWith('image/')) {
            errors.image = 'Banner file must be an image.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these banner errors',
                items: messages,
            });
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('image', imageFile!);
            formData.append('isActive', 'true');

            await api.post('/banners', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setTitle('');
            setImageFile(null);
            (document.getElementById('file-input') as HTMLInputElement).value = '';
            toast({
                title: 'Banner created',
                description: 'The banner was uploaded successfully.',
            });
            fetchBanners();
        } catch (error) {
            console.error('Failed to create banner', error);
            toast({
                variant: 'error',
                title: 'Unable to create banner',
                items: [getApiErrorMessage(error, 'Failed to upload banner.')],
            });
        } finally {
            setUploading(false);
        }
    };

    const openEditDialog = (banner: Banner) => {
        setEditingBanner(banner);
        setEditFormData({ title: banner.title, isActive: banner.isActive });
        setEditPreviewUrl(banner.imageUrl);
        setEditFile(null);
        setIsEditOpen(true);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditFile(file);
            setEditPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBanner) return;
        const errors: Record<string, string | undefined> = {};

        if (!editFormData.title.trim()) {
            errors.title = 'Banner title is required.';
        }

        if (editFile && !editFile.type.startsWith('image/')) {
            errors.image = 'Replacement file must be an image.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these banner errors',
                items: messages,
            });
            return;
        }

        setEditLoading(true);
        const formData = new FormData();
        formData.append('title', editFormData.title.trim());
        formData.append('isActive', editFormData.isActive.toString());

        if (editFile) {
            formData.append('image', editFile);
        }

        try {
            await api.put(`/banners/${editingBanner._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setIsEditOpen(false);
            toast({
                title: 'Banner updated',
                description: 'The banner changes were saved successfully.',
            });
            fetchBanners();
        } catch (error) {
            console.error('Failed to update banner', error);
            toast({
                variant: 'error',
                title: 'Unable to update banner',
                items: [getApiErrorMessage(error, 'Failed to update banner.')],
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        setDeleteLoadingId(id);
        try {
            await api.delete(`/banners/${id}`);
            toast({
                title: 'Banner deleted',
                description: 'The banner was deleted successfully.',
            });
            fetchBanners();
        } catch (error) {
            console.error('Failed to delete banner', error);
            toast({
                variant: 'error',
                title: 'Unable to delete banner',
                items: [getApiErrorMessage(error, 'Failed to delete banner.')],
            });
        } finally {
            setDeleteLoadingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-neutral-400">Loading banners...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Banners</h1>
                    <p className="text-neutral-400">Upload and manage dynamic hero banners for the website.</p>
                </div>
            </div>

            <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800 mb-8">
                <h2 className="text-lg font-semibold mb-4 text-white">Upload New Banner</h2>
                <form onSubmit={handleCreate} noValidate className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Banner Title/Name</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                            placeholder="E.g., Summer Sale Hero"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Upload Image (Cloudinary)</label>
                        <input
                            type="file"
                            id="file-input"
                            required
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {uploading ? 'Uploading to Cloudinary...' : 'Create Banner'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map(banner => (
                    <div key={banner._id} className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden flex flex-col relative group">
                        <div className="h-48 bg-neutral-950">
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex-1 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-white truncate">{banner.title}</h3>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${banner.isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                        }`}
                                >
                                    {banner.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="absolute top-4 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditDialog(banner)}
                                    className="p-2 bg-neutral-900/80 backdrop-blur-md rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all shadow-xl"
                                    title="Edit Banner"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleDelete(banner._id)}
                                    disabled={deleteLoadingId === banner._id}
                                    className="p-2 bg-neutral-900/80 backdrop-blur-md rounded-lg text-red-500 hover:text-white hover:bg-red-500/20 transition-all disabled:opacity-50 shadow-xl"
                                    title="Delete Banner"
                                >
                                    {deleteLoadingId === banner._id ? (
                                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {banners.length === 0 && (
                <div className="text-center py-12 text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                    No banners uploaded yet.
                </div>
            )}

            {/* Edit Banner Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Banner</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} noValidate className="space-y-4 py-4">

                        {/* Image Upload Area */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Banner Image</label>
                            <div
                                onClick={() => editFileInputRef.current?.click()}
                                className={`
                  relative h-48 rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-all group
                  ${editPreviewUrl ? 'border-emerald-500/50' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900'}
                `}
                            >
                                {editPreviewUrl ? (
                                    <>
                                        <img
                                            src={editPreviewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white font-medium flex items-center">
                                                <Pencil className="w-4 h-4 mr-2" /> Change Image
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                                        <ImagePlus className="w-8 h-8 mb-2 opacity-50 text-emerald-500" />
                                        <span className="text-sm font-medium">Click to upload new image</span>
                                        <span className="text-xs text-neutral-500 mt-1">16:9 ratio recommended</span>
                                    </div>
                                )}
                                <input
                                    ref={editFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEditFileChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Banner Title</label>
                            <input
                                type="text"
                                required
                                value={editFormData.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>

                        <label className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-800/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={editFormData.isActive}
                                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                                className="w-4 h-4 text-emerald-500 bg-neutral-950 border-neutral-700 rounded focus:ring-emerald-500/20"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Active Status</span>
                                <span className="text-xs text-neutral-500">Show this banner on the homepage</span>
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
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
