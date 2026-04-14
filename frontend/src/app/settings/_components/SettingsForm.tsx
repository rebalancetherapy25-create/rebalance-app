"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SettingsFormSkeleton } from '@/components/loading/skeletons';
import { User, Lock } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsForm() {
    const router = useRouter();
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await api.get('/auth/me');
                setProfileData({ name: res.data.name || '', email: res.data.email || '' });
            } catch {
                router.push('/login');
                return;
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [router]);

    const saveProfile = async () => {
        setSavingProfile(true);
        setMessage('');
        try {
            const res = await api.put('/auth/me', { name: profileData.name, email: profileData.email });
            setProfileData({ name: res.data.name, email: res.data.email });
            setMessage('Profile updated successfully.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setMessage(msg || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async () => {
        setSavingPassword(true);
        setMessage('');
        try {
            await api.put('/auth/password', passwordData);
            setPasswordData({ currentPassword: '', newPassword: '' });
            setMessage('Password updated successfully.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setMessage(msg || 'Failed to update password.');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return <SettingsFormSkeleton />;
    }

    return (
        <div className="flex-1 w-full space-y-8">
            {message && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
                    message.toLowerCase().includes('success') || message.toLowerCase().includes('updated')
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-destructive/5 border-destructive/20 text-destructive'
                }`}>
                    {message}
                </div>
            )}

            <Card className="border-none shadow-sm rounded-2xl bg-background p-2">
                <div className="p-6 border-b border-border/50 mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><User className="w-5 h-5" /> Profile</h2>
                </div>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input value={profileData.name} onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))} className="bg-accent/5" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input value={profileData.email} onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))} className="bg-accent/5" />
                    </div>
                    <div className="pt-4">
                        <Button loading={savingProfile} loadingText="Saving changes..." disabled={savingProfile} onClick={saveProfile} className="bg-primary text-text-inverse hover:bg-primary/90 rounded-xl">
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-background p-2">
                <div className="p-6 border-b border-border/50 mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h2>
                </div>
                <CardContent className="space-y-4 max-w-sm">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Current Password</label>
                        <Input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-accent/5"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <Input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="••••••••"
                            className="bg-accent/5"
                        />
                    </div>
                    <div className="pt-4">
                        <Button loading={savingPassword} loadingText="Updating password..." disabled={savingPassword} onClick={savePassword} variant="outline" className="border-primary text-primary hover:bg-primary/10 rounded-xl">
                            Update Password
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
