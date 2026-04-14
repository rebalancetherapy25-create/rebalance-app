"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Phone, MessageCircle, Lock, Globe, Clock } from 'lucide-react';

const STEPS = ['Format', 'Date & Time', 'Details', 'Payment', 'Confirmed'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DAY_NAME_TO_INDEX: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

interface LegacyAvailability {
    day: string;
    slots: string[];
}

interface DateOption {
    date: string;
    label: string;
    slots: string[];
}

interface OrderData {
    orderId: string;
    amount: number;
    currency: string;
    bookingId: string;
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface BookingErrors {
    name?: string;
    email?: string;
    general?: string;
    payment?: string;
}

const normalizeTime = (slot: string): string | null => {
    const value = slot.trim();
    if (/^\d{1,2}:\d{2}$/.test(value)) {
        const [hour, minute] = value.split(':').map(Number);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }
        return null;
    }

    const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3].toUpperCase();
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (hour === 12) hour = 0;
    if (meridiem === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const buildDateOptions = (availability: LegacyAvailability[]): DateOption[] => {
    const now = new Date();
    const options: DateOption[] = [];

    for (let i = 0; i < 14; i += 1) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        const dayOfWeek = date.getDay();
        const template = availability.find((item) => DAY_NAME_TO_INDEX[item.day.toLowerCase()] === dayOfWeek);
        if (!template) continue;

        const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const slots = Array.from(
            new Set(template.slots.map((slot) => normalizeTime(slot)).filter((slot): slot is string => Boolean(slot)))
        ).sort();

        options.push({
            date: isoDate,
            label: `${template.day.slice(0, 3)} ${date.getDate()}`,
            slots,
        });
    }

    return options;
};

interface BookingFlowProps {
    therapistId: string;
    therapistName: string;
    specialty: string;
    price: number;
    sessionTypes: string[];
    availability: LegacyAvailability[];
    onComplete?: () => void;
}

export default function BookingFlow({
    therapistId,
    therapistName,
    specialty,
    price,
    sessionTypes,
    availability,
    onComplete
}: BookingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0);

    // Dynamic State
    const [sessionType, setSessionType] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [bookingDetails, setBookingDetails] = useState({
        name: '',
        email: '',
        reason: ''
    });

    const [processing, setProcessing] = useState(false);
    const [liveSlots, setLiveSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Fetch Live Slots when date changes
    useEffect(() => {
        const fetchLiveSlots = async () => {
            if (!therapistId || !date) return;
            setFetchingSlots(true);
            try {
                const res = await fetch(`${API_BASE}/availability/${therapistId}?date=${date}`);
                if (res.ok) {
                    const hasRecord = res.headers.get('X-Availability-Record') === '1';
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setLiveSlots(data.map((s: { time: string }) => s.time).sort());
                    } else {
                        if (hasRecord) {
                            setLiveSlots([]);
                        } else {
                            // Fallback to template if no live record yet.
                            const templateSlots = dateOptions.find((option) => option.date === date)?.slots || [];
                            setLiveSlots(templateSlots);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch live slots", err);
                // Fallback on error
                const templateSlots = dateOptions.find((option) => option.date === date)?.slots || [];
                setLiveSlots(templateSlots);
            } finally {
                setFetchingSlots(false);
            }
        };

        fetchLiveSlots();
    }, [date, therapistId, dateOptions]);

    useEffect(() => {
        const detectAuthenticatedUser = async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    credentials: 'include',
                });
                if (!response.ok) {
                    setIsAuthenticated(false);
                    return;
                }

                const me = await response.json();
                setIsAuthenticated(true);
                setBookingDetails((prev) => ({
                    ...prev,
                    name: prev.name || me?.name || '',
                    email: prev.email || me?.email || '',
                }));
            } catch {
                setIsAuthenticated(false);
            }
        };

        detectAuthenticatedUser();
    }, []);

    useEffect(() => {
        const options = buildDateOptions(availability || []);
        setDateOptions(options);

        if (sessionTypes && sessionTypes.length > 0) {
            setSessionType(sessionTypes[0]);
        } else {
            setSessionType('Video');
        }

        if (options.length > 0) {
            setDate(options[0].date);
            // Time is now handled by the liveSlots effect
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            const s = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (s) document.body.removeChild(s);
        };
    }, [sessionTypes, availability]);

    const [errors, setErrors] = useState<BookingErrors>({});

    const validateForm = () => {
        if (isAuthenticated) {
            setErrors((prev) => ({ ...prev, name: undefined, email: undefined }));
            return true;
        }

        const newErrors: BookingErrors = {};
        if (!bookingDetails.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (bookingDetails.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!bookingDetails.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!emailRegex.test(bookingDetails.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = async () => {
        // Step 0 -> 1: Session Format
        if (currentStep === 0) {
            if (!sessionType) {
                setErrors({ ...errors, general: 'Please select a session format' });
                return;
            }
            setCurrentStep(1);
            return;
        }

        // Step 1 -> 2: Date & Time
        if (currentStep === 1) {
            if (!date || !time) {
                setErrors({ ...errors, general: 'Please select both date and time' });
                return;
            }
            setCurrentStep(2);
            return;
        }

        // Step 2 -> 3 transition: Lock slot and Create Order
        if (currentStep === 2) {
            if (!validateForm()) return;

            setProcessing(true);
            try {
                const createRes = await fetch(`${API_BASE}/bookings/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        therapistId,
                        date,
                        time,
                        sessionType,
                        ...(isAuthenticated ? {} : {
                            name: bookingDetails.name,
                            email: bookingDetails.email
                        })
                    })
                });

                if (!createRes.ok) {
                    const errData = await createRes.json();
                    setErrors({ ...errors, general: errData.error || "Something didn't go through - let's try again." });
                    setProcessing(false);
                    return;
                }
                const data = await createRes.json();
                setOrderData(data as OrderData);
                setProcessing(false);
                // SUCCESS: Proceed to next step
                setCurrentStep(3);
                return;
            } catch (err) {
                console.error(err);
                setErrors({ ...errors, general: 'We hit a snag' });
                setProcessing(false);
                return;
            }
        }

        // Step 3 -> Pay
        if (currentStep === 3) {
            if (!orderData) return;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mocked_key',
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Rebalance Therapy",
                description: `${sessionType} Session with ${therapistName}`,
                order_id: orderData.orderId,
                handler: async function (response: RazorpayResponse) {
                    try {
                        const verifyRes = await fetch(`${API_BASE}/bookings/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                bookingId: orderData.bookingId
                            })
                        });

                        if (verifyRes.ok) {
                            setCurrentStep(4);
                        } else {
                            const errData = await verifyRes.json().catch(() => ({}));
                            setErrors((prev) => ({ ...prev, payment: errData?.error || 'Payment verification failed. Please contact support.' }));
                        }
                    } catch (err) {
                        console.error('Verification error', err);
                        setErrors((prev) => ({ ...prev, payment: 'Payment verification failed. Please contact support.' }));
                    }
                },
                prefill: {
                    name: bookingDetails.name,
                    email: bookingDetails.email,
                },
                theme: {
                    color: "#059669"
                }
            };

            const RazorpayConstructor = (window as unknown as { Razorpay?: new (opts: object) => { open: () => void } }).Razorpay;
            if (!RazorpayConstructor) {
                setErrors((prev) => ({ ...prev, general: 'Payment service failed to initialize' }));
                return;
            }
            const rzp = new RazorpayConstructor(options);
            rzp.open();
            return;
        }

        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const payableAmount = orderData ? orderData.amount / 100 : price;

    return (
        <div className="relative z-10 flex h-full w-full min-w-0 flex-col overflow-hidden bg-background lg:border lg:border-border/10 lg:bg-background/80 lg:backdrop-blur-2xl lg:min-h-[550px] lg:flex-row lg:rounded-[1.5rem] lg:shadow-[0_32px_80px_rgba(0,0,0,0.1)]">

            {/* Left Sidebar - Mobile Horizontal / Desktop Vertical */}
            <div className="relative flex w-full min-w-0 shrink-0 flex-col overflow-hidden bg-primary p-3 pb-2 text-background lg:w-[240px] lg:p-8">
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-background/5 rounded-full blur-3xl hidden lg:block"></div>

                <div className="relative z-10 mb-2 pr-10 lg:mb-8 lg:pr-0">
                    <div className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/10 text-background/90 text-xs font-bold uppercase tracking-widest mb-3">
                        <Lock className="w-2.5 h-2.5" /> Secure
                    </div>
                    <h2 className="max-w-[100%] truncate text-base font-heading font-bold tracking-tight lg:text-xl">{therapistName}</h2>
                    <p className="max-w-[95%] truncate text-[10px] font-medium italic text-background/80 lg:text-xs">{specialty}</p>
                </div>

                {/* Steps Stepper */}
                <div className="relative z-10 flex w-full gap-2 lg:gap-5 overflow-x-auto pb-2 pt-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
                    {STEPS.map((step, index) => {
                        const isActive = index === currentStep;
                        const isPast = index < currentStep;
                        return (
                            <div key={step} className={`flex shrink-0 items-center gap-1.5 lg:gap-3 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                <div className={`flex h-5 w-5 lg:h-7 lg:w-7 items-center justify-center rounded-lg lg:rounded-xl border-2 text-[9px] lg:text-xs font-black transition-all duration-300 ${isActive || isPast ? 'scale-110 border-border bg-background text-primary shadow-sm' : 'border-background/20 bg-transparent text-background'
                                    }`}>
                                    {isPast ? '✓' : index + 1}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`whitespace-nowrap text-[9px] lg:text-xs font-bold uppercase tracking-[0.1em] lg:tracking-wide ${isActive ? 'text-background' : 'text-background/80'}`}>{step}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Right Content Area */}
            <div className="relative flex flex-1 flex-col bg-background/60 min-h-0">
                {/* Header */}
                <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/10 px-4 sm:px-6 lg:h-16 lg:px-8">
                    <div className="flex items-center gap-2">
                        <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-[9px] lg:text-[11px] font-black uppercase tracking-tighter text-accent">Step {currentStep + 1}</span>
                        <div className="font-heading text-sm font-black italic tracking-tight text-foreground lg:text-lg">
                            {currentStep === 4 ? 'Success' : STEPS[currentStep]}
                        </div>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 sm:px-6 lg:max-h-[400px] lg:px-8 lg:pb-8 lg:pt-6">
                    {/* Step 0: Format */}
                    {currentStep === 0 && (
                        <div className="space-y-3 lg:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-sm lg:text-lg font-heading font-black text-foreground">Select Format</h3>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                {(sessionTypes || ['Video', 'Phone']).map((format) => (
                                    <div
                                        key={format}
                                        onClick={() => setSessionType(format)}
                                        className={`group p-3 lg:p-4 rounded-xl lg:rounded-2xl border-[1.5px] lg:border-2 cursor-pointer transition-all ${sessionType === format ? 'border-primary bg-primary/5' : 'border-border/30 bg-background/50 hover:border-primary/20'}`}
                                    >
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-[10px] lg:rounded-xl flex items-center justify-center transition-all ${sessionType === format ? 'bg-primary text-background' : 'bg-accent/10 text-primary'}`}>
                                                {format === 'Video' ? <Video className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : format === 'Phone' ? <Phone className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <MessageCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs lg:text-sm text-foreground">{format} Session</h4>
                                                <p className="text-[10px] lg:text-xs text-muted-foreground font-medium">Private consultation</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 1: Date & Time */}
                    {currentStep === 1 && (
                        <div className="space-y-5 lg:space-y-7 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Timezone Indicator */}
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 border border-primary/10 transition-colors hover:bg-primary/10">
                                <Globe className="w-3.5 h-3.5 text-primary animate-pulse" />
                                <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-primary/80">Timezone: IST (GMT+5:30)</span>
                            </div>

                            {/* Date Selector */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-heading font-black text-sm lg:text-base text-foreground tracking-tight">Pick a Date</h4>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-background/50 px-2 py-0.5 rounded-md border border-border/20">14 Days</span>
                                </div>
                                <div className="flex w-full gap-2.5 overflow-x-auto pb-4 pt-2">
                                    {dateOptions.map((option) => {
                                        const isSelected = date === option.date;
                                        return (
                                            <button
                                                key={option.date}
                                                type="button"
                                                onClick={() => {
                                                    setDate(option.date);
                                                    setTime('');
                                                }}
                                                className={`group relative flex flex-col items-center justify-center p-3 rounded-[1.25rem] border-2 transition-all duration-300 min-w-[76px] lg:min-w-[88px] shrink-0 focus:outline-none focus:ring-4 focus:ring-primary/20
                                                    ${isSelected 
                                                        ? 'border-primary bg-primary text-background shadow-lg shadow-primary/20 scale-[1.02]' 
                                                        : 'border-border/30 bg-background/60 hover:border-primary/40 hover:bg-background text-foreground hover:-translate-y-0.5 shadow-sm'
                                                    }`}
                                            >
                                                {isSelected && (
                                                    <div className="absolute inset-0 rounded-[1.1rem] ring-1 ring-inset ring-white/20"></div>
                                                )}
                                                <span className={`text-[10px] lg:text-[11px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground group-hover:text-primary/70'} transition-colors`}>
                                                    {option.label.split(' ')[0]}
                                                </span>
                                                <span className={`text-base lg:text-lg font-heading font-black italic tracking-tighter ${isSelected ? 'text-background' : 'text-foreground'}`}>
                                                    {option.label.split(' ')[1]}
                                                </span>
                                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Selector */}
                            <div className="space-y-3 relative">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-heading font-black text-sm lg:text-base text-foreground tracking-tight">Available Times</h4>
                                    {fetchingSlots && liveSlots.length > 0 && (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            <span>Loading...</span>
                                        </div>
                                    )}
                                </div>

                                {fetchingSlots ? (
                                    <div className="grid grid-cols-3 gap-2 lg:gap-3 sm:grid-cols-4 lg:grid-cols-4">
                                        {Array.from({ length: 8 }).map((_, index) => (
                                            <Skeleton key={index} className="h-10 rounded-xl lg:h-11" />
                                        ))}
                                    </div>
                                ) : liveSlots.length > 0 ? (
                                    <div className={`grid grid-cols-3 gap-2 lg:gap-3 transition-opacity duration-300 sm:grid-cols-4 lg:grid-cols-4 ${fetchingSlots ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                        {liveSlots.map((slot: string) => {
                                            const isSelected = time === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setTime(slot)}
                                                    className={`relative flex items-center justify-center py-2.5 px-1 rounded-xl border-2 font-black transition-all duration-300 text-[11px] lg:text-xs tracking-wide focus:outline-none focus:ring-4 focus:ring-primary/20
                                                        ${isSelected 
                                                            ? 'border-primary bg-primary/10 text-primary scale-[1.03] shadow-inner' 
                                                            : 'border-border/30 bg-background/50 text-foreground hover:border-primary/40 hover:bg-background hover:-translate-y-0.5'
                                                        }`}
                                                >
                                                    {isSelected && <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    !fetchingSlots && (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gradient-to-b from-accent/5 to-transparent rounded-[1.5rem] border border-dashed border-accent/20">
                                            <div className="w-10 h-10 mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-accent/60" />
                                            </div>
                                            <h5 className="text-sm font-heading font-black text-foreground mb-1">No Times Available</h5>
                                            <p className="text-[10px] lg:text-xs font-medium text-muted-foreground leading-relaxed max-w-[200px]">
                                                Dr. {therapistName.split(' ')[1] || therapistName} is fully booked on this day. Please select another date.
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {currentStep === 2 && (
                        <div className="space-y-4 lg:space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            {errors.general && (
                                <div className="p-2.5 bg-destructive-light border border-destructive-border rounded-lg lg:rounded-xl text-destructive text-[10px] lg:text-xs font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                    {errors.general}
                                </div>
                            )}

                            <div className="space-y-1">
                                <h3 className="text-sm lg:text-lg font-heading font-black text-foreground">Your Details</h3>
                                <p className="text-[10px] lg:text-xs text-muted-foreground font-medium">
                                    {isAuthenticated
                                        ? 'Using your account profile details for this booking.'
                                        : 'We\'ll send the session link to your email.'}
                                </p>
                            </div>

                            <div className="space-y-3 lg:space-y-4">
                                <div className="space-y-1 lg:space-y-1.5">
                                    <label className="text-[9px] lg:text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                                    <Input
                                        placeholder="Siddharth Sharma"
                                        value={bookingDetails.name}
                                        onChange={e => {
                                            setBookingDetails({ ...bookingDetails, name: e.target.value });
                                            if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                                        }}
                                        className={`h-10 lg:h-12 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold bg-background/50 ${errors.name ? 'border-destructive focus:ring-destructive/20' : ''}`}
                                    />
                                    {errors.name && <p className="text-[10px] lg:text-xs text-destructive font-bold ml-1">{errors.name}</p>}
                                </div>
                                <div className="space-y-1 lg:space-y-1.5">
                                    <label className="text-[9px] lg:text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="you@email.com"
                                        value={bookingDetails.email}
                                        onChange={e => {
                                            setBookingDetails({ ...bookingDetails, email: e.target.value });
                                            if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                                        }}
                                        className={`h-10 lg:h-12 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold bg-background/50 ${errors.email ? 'border-destructive focus:ring-destructive/20' : ''}`}
                                    />
                                    {errors.email && <p className="text-[10px] lg:text-xs text-destructive font-bold ml-1">{errors.email}</p>}
                                </div>
                                <div className="space-y-1 lg:space-y-1.5">
                                    <label className="text-[9px] lg:text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Reason (Optional)</label>
                                    <textarea
                                        placeholder="..."
                                        value={bookingDetails.reason}
                                        onChange={e => setBookingDetails({ ...bookingDetails, reason: e.target.value })}
                                        className="w-full rounded-lg lg:rounded-xl bg-background/50 border border-border/40 p-2.5 lg:p-3 text-xs lg:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px] lg:min-h-[80px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {currentStep === 3 && (
                        <div className="space-y-4 lg:space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            {errors.general && (
                                <div className="p-2.5 bg-destructive-light border border-destructive-border rounded-lg lg:rounded-xl text-destructive text-[10px] lg:text-xs font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                    {errors.general}
                                </div>
                            )}
                            {errors.payment && (
                                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs font-medium text-destructive bg-destructive-light/50 px-2.5 py-1.5 rounded-lg border border-destructive/20 mt-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                    {errors.payment}
                                </div>
                            )}

                            <div className="flex items-center gap-2.5 p-2.5 bg-accent-50 text-accent-foreground rounded-lg lg:rounded-xl border border-accent-100 text-[10px] lg:text-xs font-bold">
                                <Clock className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-accent" />
                                <span>Slot locked for <strong className="text-accent italic">05:00</strong> mins</span>
                            </div>

                            <div className="bg-background p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-border/10 space-y-3 shadow-sm">
                                <h4 className="font-heading font-black text-[11px] lg:text-sm uppercase italic tracking-tighter border-b pb-2.5 lg:pb-3">Order Summary</h4>
                                <div className="space-y-2 lg:space-y-3">
                                    <div className="flex justify-between items-center text-[10px] lg:text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground italic">{sessionType} Session</span>
                                            <span className="text-[10px] lg:text-xs text-muted-foreground font-medium">{date} • {time}</span>
                                        </div>
                                        <span className="font-black text-primary">₹{payableAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] lg:text-xs font-bold text-muted-foreground border-t border-border/10 pt-2.5 lg:pt-3">
                                        <span>Subtotal</span>
                                        <span>₹{payableAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] lg:text-xs font-bold text-muted-foreground">
                                        <span>Tax/Fees</span>
                                        <span>Included</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1.5">
                                        <span className="font-black text-[11px] lg:text-sm italic uppercase">Total</span>
                                        <span className="text-base lg:text-xl font-heading font-black text-primary italic">₹{payableAmount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                {/* Step 4: Confirmation */}
                {currentStep === 4 && (
                    <div className="text-center py-4 space-y-4 lg:space-y-5 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-500 rounded-full lg:rounded-2xl flex items-center justify-center text-background text-lg lg:text-2xl shadow-lg shadow-green-500/20 rotate-3">✓</div>
                        <div className="space-y-1.5 lg:space-y-2">
                            <h2 className="text-lg lg:text-2xl font-heading font-black text-foreground italic uppercase">Confirmed!</h2>
                            <p className="text-muted-foreground text-[10px] lg:text-xs font-medium leading-relaxed max-w-[200px] mx-auto">
                                Successfully booked your <span className="text-primary italic font-bold">{sessionType}</span> session.
                            </p>
                        </div>
                        <div className="w-full bg-accent/5 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-accent/10 text-left">
                            <p className="text-[10px] lg:text-xs text-muted-foreground leading-relaxed font-medium">Check your email for the meeting link and calendar invite.</p>
                        </div>
                        {onComplete && (
                            <Button onClick={onComplete} className="w-full h-10 lg:h-11 rounded-lg lg:rounded-xl bg-primary text-background text-[10px] lg:text-xs font-black italic uppercase tracking-widest shadow-lg shadow-primary/20">Finish</Button>
                        )}
                    </div>
                )}
            </div>

                {/* Footer */}
                {currentStep < 4 && (
                    <div className="mt-auto sticky bottom-0 flex w-full shrink-0 items-center justify-between border-t border-border/10 bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:h-20 lg:bg-background/40 lg:px-8">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground lg:text-xs ${currentStep === 0 ? 'invisible' : ''}`}
                        >
                            ← Prev
                        </Button>

                        <div className="flex-1" />

                        <Button
                            onClick={handleNextStep}
                            disabled={processing || (currentStep === 1 && (!date || !time))}
                            loading={processing}
                            loadingText="Locking slot..."
                            className="flex items-center justify-center w-auto h-9 lg:h-11 rounded-lg lg:rounded-xl px-5 text-[10px] lg:text-xs font-black uppercase tracking-tight shadow-md transition-all sm:px-8 lg:px-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted-foreground/20 disabled:text-muted-foreground disabled:shadow-none"
                        >
                            {currentStep === 3 ? `Pay ₹${payableAmount}` : 'Next'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
