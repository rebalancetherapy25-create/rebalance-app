"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { emailPattern, getErrorMessages } from '@/lib/form-validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

export default function ContactForm() {
    const { toast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: { name?: string; email?: string; message?: string } = {};

        if (!formData.name.trim()) {
            nextErrors.name = 'Full name is required.';
        } else if (formData.name.trim().length < 2) {
            nextErrors.name = 'Full name must be at least 2 characters.';
        }

        if (!formData.email.trim()) {
            nextErrors.email = 'Email is required.';
        } else if (!emailPattern.test(formData.email.trim())) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!formData.message.trim()) {
            nextErrors.message = 'Message is required.';
        } else if (formData.message.trim().length < 10) {
            nextErrors.message = 'Message must be at least 10 characters.';
        }

        if (getErrorMessages(nextErrors).length) {
            setErrors(nextErrors);
            toast({
                variant: 'error',
                title: 'Please fix this form',
                items: getErrorMessages(nextErrors),
            });
            return;
        }

        setErrors({});
        toast({
            title: 'Message ready to send',
            description: 'Your contact details look good.',
        });
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="contact-name" className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                    id="contact-name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    className={cn(
                        'rounded-xl h-12 bg-accent/5 border-border focus-visible:ring-primary',
                        errors.name && 'border-destructive/30 focus-visible:ring-destructive/40'
                    )}
                    value={formData.name}
                    onChange={(e) => {
                        setFormData((current) => ({ ...current, name: e.target.value }));
                        if (errors.name) {
                            setErrors((current) => ({ ...current, name: undefined }));
                        }
                    }}
                    aria-invalid={Boolean(errors.name)}
                />
                <FieldError message={errors.name} />
            </div>
            <div className="space-y-2">
                <label htmlFor="contact-email" className="text-sm font-medium text-foreground">Email</label>
                <Input
                    id="contact-email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    className={cn(
                        'rounded-xl h-12 bg-accent/5 border-border focus-visible:ring-primary',
                        errors.email && 'border-destructive/30 focus-visible:ring-destructive/40'
                    )}
                    value={formData.email}
                    onChange={(e) => {
                        setFormData((current) => ({ ...current, email: e.target.value }));
                        if (errors.email) {
                            setErrors((current) => ({ ...current, email: undefined }));
                        }
                    }}
                    aria-invalid={Boolean(errors.email)}
                />
                <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
                <label htmlFor="contact-message" className="text-sm font-medium text-foreground">Message</label>
                <textarea
                    id="contact-message"
                    className={cn(
                        'w-full min-h-[120px] rounded-xl bg-accent/5 border border-border focus-visible:ring-2 focus-visible:ring-primary/40 p-3 text-sm outline-none transition-all',
                        errors.message && 'border-destructive/30 focus-visible:ring-destructive/40'
                    )}
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={(e) => {
                        setFormData((current) => ({ ...current, message: e.target.value }));
                        if (errors.message) {
                            setErrors((current) => ({ ...current, message: undefined }));
                        }
                    }}
                    aria-invalid={Boolean(errors.message)}
                />
                <FieldError message={errors.message} />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-md font-medium bg-primary text-text-inverse hover:bg-primary/90 shadow-md">Send Message</Button>
        </form>
    );
}
