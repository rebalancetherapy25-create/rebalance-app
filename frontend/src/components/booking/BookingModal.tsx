"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { BookingFlowSkeleton } from '@/components/loading/skeletons';

const BookingFlow = dynamic(() => import('./BookingFlow'), {
    loading: () => <BookingFlowSkeleton />,
});

interface BookingModalProps {
    therapistId: string;
    therapistName: string;
    specialty: string;
    price: number;
    sessionTypes: string[];
    availability: { day: string; slots: string[] }[];
    trigger?: React.ReactNode;
}

export default function BookingModal({
    therapistId,
    therapistName,
    specialty,
    price,
    sessionTypes,
    availability,
    trigger
}: BookingModalProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Book Session</Button>}
            </DialogTrigger>
            <DialogContent hideClose className="flex flex-col h-[100dvh] w-full max-w-[100vw] p-0 m-0 overflow-hidden !rounded-none !border-none bg-background/95 backdrop-blur-3xl shadow-2xl md:h-[90dvh] md:w-[95vw] md:max-w-[1200px] md:!rounded-[3rem] md:border md:border-primary/20">
                <DialogTitle className="sr-only">Book a session with {therapistName}</DialogTitle>
                <div className="relative flex-1 flex flex-col overflow-hidden w-full min-h-0">
                    <button
                        onClick={() => setOpen(false)}
                        aria-label="Close modal"
                        className="absolute right-4 top-4 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-sm transition-all hover:scale-110 hover:bg-primary/5 focus:outline-none md:right-6 md:top-6 md:h-12 md:w-12"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
                    </button>
                    <BookingFlow
                        therapistId={therapistId}
                        therapistName={therapistName}
                        specialty={specialty}
                        price={price}
                        sessionTypes={sessionTypes}
                        availability={availability}
                        onComplete={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
