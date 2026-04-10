import { Metadata } from 'next';

import AuthForm from './_components/AuthForm';
import { AuthPageShell } from '@/components/auth/AuthPageShell';

export const metadata: Metadata = {
    title: 'Login | Rebalance',
    description: 'Log in to your account.',
};

export default function LoginPage() {
    return (
        <AuthPageShell mode="login">
            <AuthForm />
        </AuthPageShell>
    );
}
