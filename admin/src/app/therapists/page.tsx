'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Star, IndianRupee, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
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

interface FAQ {
    question: string;
    answer: string;
}

interface Availability {
    day: string;
    slots: string[];
}

interface Therapist {
    _id: string;
    name: string;
    email?: string;
    specialties: string[];
    price: number;
    about: string;
    bio: string;
    ratingAverage: number;
    profileImage: string;
    languages: string[];
    sessionTypes: string[];
    responseRate: number;
    totalSessions: number;
    experienceYears: number;
    credentials: string;
    faq: FAQ[];
    availability: Availability[];
}

interface TherapistFormState {
    name: string;
    email: string;
    specialties: string;
    price: number;
    about: string;
    languages: string;
    sessionTypes: string[];
    responseRate: number;
    totalSessions: number;
    experienceYears: number;
    credentials: string;
    faq: FAQ[];
    availability: Availability[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SESSION_TYPES = ['Video', 'Phone'];

export default function TherapistsPage() {
    const { toast } = useToast();
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);

    const initialFormState: TherapistFormState = {
        name: '',
        email: '',
        specialties: '',
        price: 0,
        about: '',
        languages: '',
        sessionTypes: ['Video'],
        responseRate: 100,
        totalSessions: 0,
        experienceYears: 5,
        credentials: '',
        faq: [{ question: '', answer: '' }],
        availability: DAYS.map(day => ({ day, slots: [] }))
    };

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState<TherapistFormState>(initialFormState);
    const [createLoading, setCreateLoading] = useState(false);
    const [createPortalAccess, setCreatePortalAccess] = useState(true);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
    const [editFormData, setEditFormData] = useState<TherapistFormState>(initialFormState);
    const [editLoading, setEditLoading] = useState(false);

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [therapistToDelete, setTherapistToDelete] = useState<Therapist | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchTherapists();
    }, []);

    const fetchTherapists = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/therapists');
            setTherapists(res.data);
        } catch (error) {
            console.error('Failed to fetch therapists', error);
            toast({
                variant: 'error',
                title: 'Unable to load therapists',
                items: [getApiErrorMessage(error, 'Failed to fetch therapists.')],
            });
        } finally {
            setLoading(false);
        }
    };

    const parseList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

    const normalizeFaq = (faq: FAQ[]) =>
        faq
            .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
            .filter((item) => item.question || item.answer);

    const validateTherapistForm = (formData: TherapistFormState, portalEmailRequired = false) => {
        const errors: Record<string, string | undefined> = {};
        const email = formData.email.trim();
        const specialties = parseList(formData.specialties);
        const languages = parseList(formData.languages);
        const faq = normalizeFaq(formData.faq);

        if (!formData.name.trim()) {
            errors.name = 'Full name is required.';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Full name must be at least 2 characters.';
        }

        if (portalEmailRequired && !email) {
            errors.email = 'Email is required to create therapist portal access.';
        } else if (email && !emailPattern.test(email)) {
            errors.email = 'Enter a valid therapist email address.';
        }

        if (!formData.credentials.trim()) {
            errors.credentials = 'Credentials are required.';
        }

        if (!Number.isFinite(formData.price) || formData.price <= 0) {
            errors.price = 'Price per session must be greater than 0.';
        }

        if (!Number.isFinite(formData.experienceYears) || formData.experienceYears < 0) {
            errors.experienceYears = 'Experience years cannot be negative.';
        }

        if (!Number.isFinite(formData.totalSessions) || formData.totalSessions < 0) {
            errors.totalSessions = 'Sessions count cannot be negative.';
        }

        if (!Number.isFinite(formData.responseRate) || formData.responseRate < 0 || formData.responseRate > 100) {
            errors.responseRate = 'Response rate must be between 0 and 100.';
        }

        if (!formData.about.trim()) {
            errors.about = 'Bio / About is required.';
        } else if (formData.about.trim().length < 10) {
            errors.about = 'Bio / About must be at least 10 characters.';
        }

        if (!specialties.length) {
            errors.specialties = 'Add at least one specialty.';
        }

        if (!languages.length) {
            errors.languages = 'Add at least one language.';
        }

        if (!formData.sessionTypes.length) {
            errors.sessionTypes = 'Select at least one session type.';
        }

        faq.forEach((item, index) => {
            if (!item.question) {
                errors[`faq-question-${index}`] = `FAQ #${index + 1} question is required when an answer is provided.`;
            }
            if (!item.answer) {
                errors[`faq-answer-${index}`] = `FAQ #${index + 1} answer is required when a question is provided.`;
            }
        });

        return {
            errors,
            email,
            specialties,
            languages,
            faq,
        };
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validateTherapistForm(createFormData, createPortalAccess);
        const messages = getErrorMessages(validation.errors);

        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these therapist errors',
                items: messages,
            });
            return;
        }

        setCreateLoading(true);

        try {
            const email = validation.email.toLowerCase();
            const payload = {
                ...createFormData,
                email: email || undefined,
                name: createFormData.name.trim(),
                credentials: createFormData.credentials.trim(),
                about: createFormData.about.trim(),
                specialties: validation.specialties,
                languages: validation.languages,
                faq: validation.faq,
                ...(createPortalAccess && email ? { portalAccess: { create: true } } : {}),
            };
            await api.post('/admin/therapists', payload);
            setIsCreateOpen(false);
            setCreateFormData(initialFormState);
            setCreatePortalAccess(true);
            toast({
                title: 'Therapist created',
                description: 'The therapist profile was created successfully.',
            });
            fetchTherapists();
        } catch (error) {
            console.error('Failed to create therapist', error);
            toast({
                variant: 'error',
                title: 'Unable to create therapist',
                items: [getApiErrorMessage(error, 'Failed to create therapist.')],
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditDialog = (therapist: Therapist) => {
        setEditingTherapist(therapist);
        setEditFormData({
            name: therapist.name,
            email: therapist.email || '',
            specialties: therapist.specialties.join(', '),
            price: therapist.price,
            about: therapist.about || therapist.bio || '',
            languages: (therapist.languages || []).join(', '),
            sessionTypes: therapist.sessionTypes || ['Video'],
            responseRate: therapist.responseRate || 100,
            totalSessions: therapist.totalSessions || 0,
            experienceYears: therapist.experienceYears || 5,
            credentials: therapist.credentials || '',
            faq: therapist.faq && therapist.faq.length > 0 ? therapist.faq : [{ question: '', answer: '' }],
            availability: therapist.availability && therapist.availability.length > 0
                ? therapist.availability
                : DAYS.map(day => ({ day, slots: [] }))
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTherapist) return;
        const validation = validateTherapistForm(editFormData, false);
        const messages = getErrorMessages(validation.errors);

        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these therapist errors',
                items: messages,
            });
            return;
        }

        setEditLoading(true);

        try {
            const email = validation.email.toLowerCase();
            const payload = {
                ...editFormData,
                email: email || undefined,
                name: editFormData.name.trim(),
                credentials: editFormData.credentials.trim(),
                about: editFormData.about.trim(),
                specialties: validation.specialties,
                languages: validation.languages,
                faq: validation.faq,
            };
            await api.put(`/admin/therapists/${editingTherapist._id}`, payload);
            setIsEditOpen(false);
            toast({
                title: 'Therapist updated',
                description: 'The therapist profile was updated successfully.',
            });
            fetchTherapists();
        } catch (error) {
            console.error('Failed to update therapist', error);
            toast({
                variant: 'error',
                title: 'Unable to update therapist',
                items: [getApiErrorMessage(error, 'Failed to update therapist.')],
            });
        } finally {
            setEditLoading(false);
        }
    };

    const updateFAQ = (index: number, field: 'question' | 'answer', value: string, isEdit: boolean) => {
        const state = isEdit ? editFormData : createFormData;
        const setState = isEdit ? setEditFormData : setCreateFormData;
        const newFAQ = [...state.faq];
        newFAQ[index][field] = value;
        setState({ ...state, faq: newFAQ });
    };

    const addFAQ = (isEdit: boolean) => {
        const state = isEdit ? editFormData : createFormData;
        const setState = isEdit ? setEditFormData : setCreateFormData;
        setState({ ...state, faq: [...state.faq, { question: '', answer: '' }] });
    };

    const removeFAQ = (index: number, isEdit: boolean) => {
        const state = isEdit ? editFormData : createFormData;
        const setState = isEdit ? setEditFormData : setCreateFormData;
        if (state.faq.length <= 1) return;
        const newFAQ = state.faq.filter((_, i) => i !== index);
        setState({ ...state, faq: newFAQ });
    };

    const toggleSlot = (dayIndex: number, slot: string, isEdit: boolean) => {
        const state = isEdit ? editFormData : createFormData;
        const setState = isEdit ? setEditFormData : setCreateFormData;
        const newAvail = [...state.availability];
        const slots = newAvail[dayIndex].slots;
        if (slots.includes(slot)) {
            newAvail[dayIndex].slots = slots.filter(s => s !== slot);
        } else {
            newAvail[dayIndex].slots = [...slots, slot].sort((a, b) => {
                const timeA = new Date(`2000/01/01 ${a}`).getTime();
                const timeB = new Date(`2000/01/01 ${b}`).getTime();
                return timeA - timeB;
            });
        }
        setState({ ...state, availability: newAvail });
    };

    const addCustomSlot = (dayIndex: number, isEdit: boolean) => {
        const slot = prompt("Enter slot (e.g. 10:00 AM)");
        if (slot) toggleSlot(dayIndex, slot, isEdit);
    };

    const openDeleteDialog = (therapist: Therapist) => {
        setTherapistToDelete(therapist);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!therapistToDelete) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/admin/therapists/${therapistToDelete._id}`);
            setIsDeleteOpen(false);
            toast({
                title: 'Therapist deleted',
                description: 'The therapist profile was deleted successfully.',
            });
            fetchTherapists();
        } catch (error) {
            console.error('Failed to delete therapist', error);
            toast({
                variant: 'error',
                title: 'Unable to delete therapist',
                items: [getApiErrorMessage(error, 'Failed to delete therapist.')],
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Manage Therapists</h1>
                    <p className="text-neutral-400">View and update therapist profiles, pricing, and specialties.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Therapist
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-64 animate-pulse" />
                    ))
                ) : therapists.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-neutral-500 bg-neutral-900/50 rounded-2xl border border-neutral-800 border-dashed">
                        No therapists found on the platform.
                    </div>
                ) : (
                    therapists.map((therapist) => (
                        <div key={therapist._id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative group overflow-hidden transition-all hover:border-neutral-700">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                    href={`/therapists/${therapist._id}`}
                                    className="p-2 bg-neutral-800/80 backdrop-blur text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => openEditDialog(therapist)}
                                    className="p-2 bg-neutral-800/80 backdrop-blur text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => openDeleteDialog(therapist)}
                                    className="p-2 bg-neutral-800/80 backdrop-blur text-red-500 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={therapist.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=10b981&color=fff`}
                                    alt={therapist.name}
                                    className="w-16 h-16 rounded-2xl object-cover border border-neutral-800"
                                />
                                <div>
                                    <h3 className="font-semibold text-white text-lg leading-tight">{therapist.name}</h3>
                                    <div className="flex items-center mt-1 text-sm text-amber-500">
                                        <Star className="w-4 h-4 fill-amber-500 mr-1" />
                                        <span className="font-medium">{therapist.ratingAverage?.toFixed(1) || 'New'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1 font-medium">Specialties</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {therapist.specialties.slice(0, 3).map((spec, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md text-xs border border-neutral-700">
                                                {spec}
                                            </span>
                                        ))}
                                        {therapist.specialties.length > 3 && (
                                            <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md text-xs border border-neutral-700">
                                                +{therapist.specialties.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                                    <div className="flex items-center text-emerald-400 font-medium">
                                        <IndianRupee className="w-4 h-4 mr-0.5" />
                                        <span>{therapist.price}</span>
                                        <span className="text-neutral-500 font-normal text-xs ml-1">/ session</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Therapist</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} noValidate className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={createFormData.name}
                                        onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Email (for therapist portal access)</label>
                                    <input
                                        type="email"
                                        value={createFormData.email}
                                        onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                        required={createPortalAccess}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                        placeholder="therapist@example.com"
                                    />
                                    <label className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                                        <input
                                            type="checkbox"
                                            checked={createPortalAccess}
                                            onChange={(e) => setCreatePortalAccess(e.target.checked)}
                                            className="w-4 h-4 rounded border-neutral-800 text-emerald-500"
                                        />
                                        Send therapist portal access email on create
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Credentials (e.g. PhD, MSc)</label>
                                    <input
                                        type="text"
                                        required
                                        value={createFormData.credentials}
                                        onChange={(e) => setCreateFormData({ ...createFormData, credentials: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Price / Session</label>
                                        <input
                                            type="number"
                                            required
                                            value={createFormData.price}
                                            onChange={(e) => setCreateFormData({ ...createFormData, price: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Exp (Years)</label>
                                        <input
                                            type="number"
                                            value={createFormData.experienceYears}
                                            onChange={(e) => setCreateFormData({ ...createFormData, experienceYears: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Session Types</label>
                                    <div className="flex gap-4">
                                        {SESSION_TYPES.map(type => (
                                            <label key={type} className="flex items-center gap-2 text-neutral-300">
                                                <input
                                                    type="checkbox"
                                                    checked={createFormData.sessionTypes.includes(type)}
                                                    onChange={(e) => {
                                                        const types = e.target.checked
                                                            ? [...createFormData.sessionTypes, type]
                                                            : createFormData.sessionTypes.filter(t => t !== type);
                                                        setCreateFormData({ ...createFormData, sessionTypes: types });
                                                    }}
                                                    className="w-4 h-4 rounded border-neutral-800 text-emerald-500"
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Specialties (comma separated)</label>
                                    <input
                                        type="text"
                                        value={createFormData.specialties}
                                        onChange={(e) => setCreateFormData({ ...createFormData, specialties: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Languages (comma separated)</label>
                                    <input
                                        type="text"
                                        value={createFormData.languages}
                                        onChange={(e) => setCreateFormData({ ...createFormData, languages: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Sessions Count</label>
                                        <input
                                            type="number"
                                            value={createFormData.totalSessions}
                                            onChange={(e) => setCreateFormData({ ...createFormData, totalSessions: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Resp Rate (%)</label>
                                        <input
                                            type="number"
                                            max="100"
                                            value={createFormData.responseRate}
                                            onChange={(e) => setCreateFormData({ ...createFormData, responseRate: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Bio / About</label>
                            <textarea
                                rows={3}
                                required
                                value={createFormData.about}
                                onChange={(e) => setCreateFormData({ ...createFormData, about: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-neutral-300">FAQ Section</label>
                                <button type="button" onClick={() => addFAQ(false)} className="text-xs text-emerald-400 font-bold hover:underline">+ Add FAQ</button>
                            </div>
                            {createFormData.faq.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            placeholder="Question"
                                            value={item.question}
                                            onChange={(e) => updateFAQ(i, 'question', e.target.value, false)}
                                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-white"
                                        />
                                        <textarea
                                            placeholder="Answer"
                                            value={item.answer}
                                            onChange={(e) => updateFAQ(i, 'answer', e.target.value, false)}
                                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-white resize-none"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeFAQ(i, false)} className="text-red-500 hover:text-red-400 font-bold">×</button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-neutral-300">Weekly Availability</label>
                            <div className="grid grid-cols-1 gap-4">
                                {createFormData.availability.map((avail, i) => (
                                    <div key={avail.day} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-white">{avail.day}</span>
                                            <button type="button" onClick={() => addCustomSlot(i, false)} className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">+ Add Slot</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {avail.slots.map(slot => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => toggleSlot(i, slot, false)}
                                                    className="px-2 py-1 bg-emerald-500 text-neutral-950 text-xs font-bold rounded"
                                                >
                                                    {slot} ×
                                                </button>
                                            ))}
                                            {avail.slots.length === 0 && <span className="text-[10px] text-neutral-600 italic">No slots selected</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                {createLoading ? 'Creating...' : 'Create Therapist'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Therapist Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} noValidate className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Credentials (e.g. PhD, MSc)</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.credentials}
                                        onChange={(e) => setEditFormData({ ...editFormData, credentials: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Price / Session</label>
                                        <input
                                            type="number"
                                            required
                                            value={editFormData.price}
                                            onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Exp (Years)</label>
                                        <input
                                            type="number"
                                            value={editFormData.experienceYears}
                                            onChange={(e) => setEditFormData({ ...editFormData, experienceYears: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Session Types</label>
                                    <div className="flex gap-4">
                                        {SESSION_TYPES.map(type => (
                                            <label key={type} className="flex items-center gap-2 text-neutral-300">
                                                <input
                                                    type="checkbox"
                                                    checked={editFormData.sessionTypes.includes(type)}
                                                    onChange={(e) => {
                                                        const types = e.target.checked
                                                            ? [...editFormData.sessionTypes, type]
                                                            : editFormData.sessionTypes.filter(t => t !== type);
                                                        setEditFormData({ ...editFormData, sessionTypes: types });
                                                    }}
                                                    className="w-4 h-4 rounded border-neutral-800 text-emerald-500"
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Specialties (comma separated)</label>
                                    <input
                                        type="text"
                                        value={editFormData.specialties}
                                        onChange={(e) => setEditFormData({ ...editFormData, specialties: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Languages (comma separated)</label>
                                    <input
                                        type="text"
                                        value={editFormData.languages}
                                        onChange={(e) => setEditFormData({ ...editFormData, languages: e.target.value })}
                                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Sessions Count</label>
                                        <input
                                            type="number"
                                            value={editFormData.totalSessions}
                                            onChange={(e) => setEditFormData({ ...editFormData, totalSessions: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Resp Rate (%)</label>
                                        <input
                                            type="number"
                                            max="100"
                                            value={editFormData.responseRate}
                                            onChange={(e) => setEditFormData({ ...editFormData, responseRate: Number(e.target.value) })}
                                            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">About</label>
                            <textarea
                                rows={3}
                                required
                                value={editFormData.about}
                                onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                                placeholder="A brief bio about the therapist..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-neutral-300">FAQ Section</label>
                                <button type="button" onClick={() => addFAQ(true)} className="text-xs text-emerald-400 font-bold hover:underline">+ Add FAQ</button>
                            </div>
                            {editFormData.faq.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            placeholder="Question"
                                            value={item.question}
                                            onChange={(e) => updateFAQ(i, 'question', e.target.value, true)}
                                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-white"
                                        />
                                        <textarea
                                            placeholder="Answer"
                                            value={item.answer}
                                            onChange={(e) => updateFAQ(i, 'answer', e.target.value, true)}
                                            className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-sm text-white resize-none"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeFAQ(i, true)} className="text-red-500 hover:text-red-400 font-bold">×</button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-neutral-300">Weekly Availability</label>
                            <div className="grid grid-cols-1 gap-4">
                                {editFormData.availability.map((avail, i) => (
                                    <div key={avail.day} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-white">{avail.day}</span>
                                            <button type="button" onClick={() => addCustomSlot(i, true)} className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">+ Add Slot</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {avail.slots.map(slot => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => toggleSlot(i, slot, true)}
                                                    className="px-2 py-1 bg-emerald-500 text-neutral-950 text-xs font-bold rounded"
                                                >
                                                    {slot} ×
                                                </button>
                                            ))}
                                            {avail.slots.length === 0 && <span className="text-[10px] text-neutral-600 italic">No slots selected</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                        <DialogTitle className="text-red-400">Delete Therapist</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-neutral-400 text-sm">
                            Are you sure you want to delete <span className="text-white font-medium">{therapistToDelete?.name}</span>?
                            This action cannot be undone and will permanently remove them from the platform.
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
                            {deleteLoading ? 'Deleting...' : 'Yes, delete therapist'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
