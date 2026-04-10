import SignupForm from './_components/SignupForm';
import { AuthPageShell } from '@/components/auth/AuthPageShell';

export const metadata = {
    title: 'Create Account | Rebalance',
    description: 'Start your journey to emotional wellbeing today.',
};

export default function SignupPage() {
    return (
        <AuthPageShell mode="signup">
            <SignupForm />
        </AuthPageShell>
    );
}
