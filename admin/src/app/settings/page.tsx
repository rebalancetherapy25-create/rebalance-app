'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/toaster';
import { emailPattern, getApiErrorMessage, getErrorMessages } from '@/lib/form-validation';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Profile State
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // Password State
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const meRes = await api.get('/auth/me');
            setProfileData({ name: meRes.data.name || '', email: meRes.data.email || '' });
        } catch (error) {
            console.error('Failed to load profile', error);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (!profileData.name.trim()) {
            errors.name = 'Display name is required.';
        } else if (profileData.name.trim().length < 2) {
            errors.name = 'Display name must be at least 2 characters.';
        }

        if (!profileData.email.trim()) {
            errors.email = 'Email address is required.';
        } else if (!emailPattern.test(profileData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            toast({
                variant: 'error',
                title: 'Please fix these profile errors',
                items: messages,
            });
            return;
        }

        setLoading(true);
        setProfileMessage({ type: '', text: '' });
        try {
            const res = await api.put('/admin/settings/profile', {
                name: profileData.name.trim(),
                email: profileData.email.trim(),
            });
            setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
            setProfileData({ name: res.data.name || '', email: res.data.email || '' });
            toast({
                title: 'Profile updated',
                description: 'Admin profile details were saved successfully.',
            });
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, 'Failed to update profile.');
            setProfileMessage({ type: 'error', text: message || 'Failed to update profile.' });
            toast({
                variant: 'error',
                title: 'Unable to update profile',
                items: [message],
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string | undefined> = {};

        if (!passwordData.currentPassword.trim()) {
            errors.currentPassword = 'Current password is required.';
        }

        if (!passwordData.newPassword.trim()) {
            errors.newPassword = 'New password is required.';
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = 'New password must be at least 6 characters.';
        } else if (passwordData.newPassword === passwordData.currentPassword) {
            errors.newPassword = 'New password must be different from the current password.';
        }

        if (!passwordData.confirmPassword.trim()) {
            errors.confirmPassword = 'Please confirm the new password.';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'New passwords do not match.';
        }

        const messages = getErrorMessages(errors);
        if (messages.length) {
            setPasswordMessage({ type: 'error', text: messages[0] });
            toast({
                variant: 'error',
                title: 'Please fix these password errors',
                items: messages,
            });
            return;
        }

        setLoading(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await api.put('/admin/settings/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast({
                title: 'Password updated',
                description: 'Admin password was updated successfully.',
            });
        } catch (error: unknown) {
            const message = getApiErrorMessage(error, 'Failed to update password.');
            setPasswordMessage({ type: 'error', text: message || 'Failed to update password.' });
            toast({
                variant: 'error',
                title: 'Unable to update password',
                items: [message],
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-800">
                <h1 className="text-2xl font-bold text-white mb-1">Account Settings</h1>
                <p className="text-neutral-400">Manage your super admin account credentials and security preferences.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left font-medium ${activeTab === 'profile'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        Profile Details
                    </button>

                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left font-medium ${activeTab === 'security'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent'
                            }`}
                    >
                        <Lock className="w-5 h-5" />
                        Security
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden">
                            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Profile Details</h2>
                                    <p className="text-sm text-neutral-400">Update your public-facing information.</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit} noValidate className="p-6 space-y-5">
                                {profileMessage.text && (
                                    <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${profileMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {profileMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                                        <p>{profileMessage.text}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                                        <input
                                            type="text"
                                            required
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                                        <input
                                            type="email"
                                            required
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-emerald-500 text-neutral-950 font-medium rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save Profile Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden">
                            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Change Password</h2>
                                    <p className="text-sm text-neutral-400">Ensure your account is using a strong, unique password.</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSubmit} noValidate className="p-6 space-y-5">
                                {passwordMessage.text && (
                                    <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${passwordMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                        {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                                        <p>{passwordMessage.text}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-neutral-800 my-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-neutral-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-emerald-500 text-neutral-950 font-medium rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
