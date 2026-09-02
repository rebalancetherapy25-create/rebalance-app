"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { emailPattern, getErrorMessages } from '@/lib/form-validation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { motion } from 'framer-motion';

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
            title: 'Message sent successfully',
            description: 'We will get back to you as soon as possible.',
        });
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full relative group"
        >
            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-primary/5 transition-all duration-500 group-hover:shadow-primary/10 group-hover:bg-white/50" />
            
            <form onSubmit={handleSubmit} noValidate className="relative z-10 space-y-6 p-8 sm:p-12">
                <div className="space-y-8">
                    <div className="space-y-2 relative">
                        <input
                            id="contact-name"
                            type="text"
                            placeholder="Full Name"
                            autoComplete="name"
                            className={cn(
                                'w-full bg-transparent border-b-2 border-neutral-200 py-3 text-lg text-foreground placeholder:text-neutral-400 focus:border-primary outline-none transition-colors',
                                errors.name && 'border-destructive/50 focus:border-destructive'
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

                    <div className="space-y-2 relative">
                        <input
                            id="contact-email"
                            type="email"
                            placeholder="Email Address"
                            autoComplete="email"
                            className={cn(
                                'w-full bg-transparent border-b-2 border-neutral-200 py-3 text-lg text-foreground placeholder:text-neutral-400 focus:border-primary outline-none transition-colors',
                                errors.email && 'border-destructive/50 focus:border-destructive'
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

                    <div className="space-y-2 relative">
                        <textarea
                            id="contact-message"
                            className={cn(
                                'w-full min-h-[140px] bg-neutral-50/50 rounded-2xl border-2 border-neutral-100 p-5 text-lg text-foreground placeholder:text-neutral-400 focus:border-primary focus:bg-transparent outline-none transition-all resize-none',
                                errors.message && 'border-destructive/50 focus:border-destructive focus:bg-destructive/5'
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
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-normal bg-primary text-text-inverse hover:bg-primary/90 hover:scale-[1.02] shadow-xl hover:shadow-2xl transition-all duration-300">
                        Send Message
                    </Button>
                </div>
            </form>
        </motion.div>
    );
}
