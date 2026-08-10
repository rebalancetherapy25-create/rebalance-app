"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Video, Phone, MessageCircle, Lock, Globe, Clock,
    Loader2, CheckCircle2, Tag, ChevronDown, ShieldCheck, Calendar, User, Mail,
    Sunrise, Sun, Sunset, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import { getApiBaseUrl, unwrapApiData } from '@/lib/runtime';
import { CSRF_HEADER_NAME, ensureCsrfToken } from '@/lib/auth';
import { buildDateOptions, type DateOption, type LegacyAvailability } from '@/lib/booking';
import { formatSlotTime } from '@/lib/date';
import { emailPattern } from '@/lib/form-validation';

const STEPS = ['Date & Time', 'Details', 'Payment', 'Confirmed'];
const API_BASE = getApiBaseUrl();

const FORMAT_META: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
    Video: { icon: <Video className="w-4 h-4" />, label: 'Video Call', desc: 'Face-to-face via video' },
    Phone: { icon: <Phone className="w-4 h-4" />, label: 'Phone Call', desc: 'Voice-only consultation' },
    Chat:  { icon: <MessageCircle className="w-4 h-4" />, label: 'Chat', desc: 'Text-based session' },
};

const groupSlotsByPeriod = (slots: string[]) => {
    const morning: string[] = [], afternoon: string[] = [], evening: string[] = [];
    slots.forEach((s) => {
        const h = parseInt(s.split(':')[0], 10);
        if (h < 12) morning.push(s);
        else if (h < 17) afternoon.push(s);
        else evening.push(s);
    });
    return { morning, afternoon, evening };
};

interface OrderData { orderId: string; amount: number; currency: string; bookingId: string; }
interface RazorpayResponse { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }
interface BookingErrors { name?: string; email?: string; general?: string; payment?: string; }

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
    therapistId, therapistName, specialty, price, sessionTypes, availability, onComplete
}: BookingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [sessionType, setSessionType] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', reason: '', notes: '' });
    const [processing, setProcessing] = useState(false);
    const [liveSlots, setLiveSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errors, setErrors] = useState<BookingErrors>({});
    const [showCoupon, setShowCoupon] = useState(false);
    const [knownSlotsMap, setKnownSlotsMap] = useState<Record<string, string[]>>({});
    const dateScrollRef = useRef<HTMLDivElement>(null);
    const scrollDates = (direction: 'left' | 'right') => {
        if (dateScrollRef.current) {
            dateScrollRef.current.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
        }
    };

    const authFetched = useRef(false);

    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [appliedDiscountData, setAppliedDiscountData] = useState<{ discountPercentage: number; code: string } | null>(null);
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    
    const [activeCoupons, setActiveCoupons] = useState<{ code: string; discountPercentage: number }[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const hasFetchedCoupons = useRef(false);

    useEffect(() => {
        if (showCoupon && !hasFetchedCoupons.current) {
            hasFetchedCoupons.current = true;
            setLoadingCoupons(true);
            fetch(`${API_BASE}/coupons/active`)
                .then(res => res.json())
                .then(data => {
                    if (data.data) setActiveCoupons(data.data);
                })
                .catch(console.error)
                .finally(() => setLoadingCoupons(false));
        }
    }, [showCoupon]);

    const handleApplyCoupon = useCallback(async (codeToApply?: string | React.MouseEvent) => {
        const code = typeof codeToApply === 'string' ? codeToApply : couponCode;
        if (!code.trim()) return;
        setApplyingCoupon(true);
        setCouponStatus(null);
        if (typeof codeToApply === 'string') setCouponCode(codeToApply);
        try {
            const csrfToken = await ensureCsrfToken(API_BASE);
            if (orderData?.bookingId) {
                const res = await fetch(`${API_BASE}/bookings/${orderData.bookingId}/apply-coupon`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}) },
                    body: JSON.stringify({ code }),
                });
                const data = await res.json();
                if (res.ok) {
                    setOrderData(data.data);
                    setAppliedDiscountData({ discountPercentage: data.data.discountPercentage, code: data.data.code });
                    setCouponStatus({ type: 'success', message: `${data.data.discountPercentage}% discount applied!` });
                    
                    if (data.data.amount === 0) {
                        setCurrentStep(3); // Skip Razorpay for 100% off
                    }
                } else {
                    setAppliedDiscountData(null);
                    setCouponStatus({ type: 'error', message: data.error || 'Invalid coupon code' });
                }
            } else {
                const res = await fetch(`${API_BASE}/coupons/validate`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}) },
                    body: JSON.stringify({ code }),
                });
                const data = await res.json();
                if (res.ok) {
                    setAppliedDiscountData({ discountPercentage: data.data.discountPercentage, code: data.data.code });
                    setCouponStatus({ type: 'success', message: `${data.data.discountPercentage}% discount applied!` });
                } else {
                    setAppliedDiscountData(null);
                    setCouponStatus({ type: 'error', message: data.error || 'Invalid coupon code' });
                }
            }
        } catch {
            setAppliedDiscountData(null);
            setCouponStatus({ type: 'error', message: 'Failed to apply coupon' });
        } finally {
            setApplyingCoupon(false);
        }
    }, [couponCode, orderData]);

    useEffect(() => {
        const options = buildDateOptions(availability || []);
        setDateOptions(options);
        setSessionType(sessionTypes?.[0] ?? 'Video');
        const firstAvailable = options.find((o) => o.slots.length > 0) || options[0];
        if (firstAvailable) setDate(firstAvailable.date);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            const s = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (s) document.body.removeChild(s);
        };
    }, [sessionTypes, availability]);

    useEffect(() => {
        if (!therapistId || !dateOptions.length) return;
        let active = true;
        const prefetchAll = async () => {
            const resultMap: Record<string, string[]> = {};
            await Promise.all(
                dateOptions.map(async (opt) => {
                    try {
                        const res = await fetch(`${API_BASE}/availability/${therapistId}?date=${opt.date}&_t=${Date.now()}`, { cache: 'no-store' });
                        if (!res.ok) { resultMap[opt.date] = opt.slots; return; }
                        const hasRecord = res.headers.get('X-Availability-Record') === '1';
                        const data = unwrapApiData(await res.json()) as { time: string }[];
                        resultMap[opt.date] = data?.length > 0 ? data.map((s) => s.time).sort() : hasRecord ? [] : opt.slots;
                    } catch { resultMap[opt.date] = opt.slots; }
                })
            );
            if (!active) return;
            setKnownSlotsMap(resultMap);
            const firstAvailable = dateOptions.find((o) => (resultMap[o.date] ?? o.slots).length > 0) ?? dateOptions[0];
            if (firstAvailable && (!liveSlots.length || !date || (resultMap[date] ?? []).length === 0)) {
                setDate(firstAvailable.date);
                setLiveSlots(resultMap[firstAvailable.date] ?? firstAvailable.slots);
            } else if (dateOptions[0] && !liveSlots.length) {
                setLiveSlots(resultMap[dateOptions[0].date] ?? dateOptions[0].slots);
            }
        };
        prefetchAll();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [therapistId, dateOptions]);

    useEffect(() => {
        if (!therapistId || !date) return;
        let active = true;
        const controller = new AbortController();
        const fetchSlots = async (isPoll = false) => {
            if (!isPoll) setFetchingSlots(true);
            try {
                const res = await fetch(`${API_BASE}/availability/${therapistId}?date=${date}&_t=${Date.now()}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
                });
                if (res.ok && active) {
                    const hasRecord = res.headers.get('X-Availability-Record') === '1';
                    const data = unwrapApiData(await res.json()) as { time: string }[];
                    const slots = data?.length > 0 ? data.map((s) => s.time).sort() : hasRecord ? [] : dateOptions.find((o) => o.date === date)?.slots ?? [];
                    setKnownSlotsMap((prev) => ({ ...prev, [date]: slots }));
                    setLiveSlots(slots);
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError' && active) {
                    setLiveSlots(knownSlotsMap[date] ?? dateOptions.find((o) => o.date === date)?.slots ?? []);
                }
            } finally { if (!controller.signal.aborted && active) setFetchingSlots(false); }
        };
        fetchSlots(false);
        const pollInterval = setInterval(() => { fetchSlots(true); }, 15000);
        return () => { active = false; controller.abort(); clearInterval(pollInterval); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, therapistId, dateOptions]);

    useEffect(() => {
        if (currentStep !== 1 || authFetched.current) return;
        authFetched.current = true;
        const detectAuth = async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
                if (!response.ok) return;
                const me = unwrapApiData(await response.json());
                setIsAuthenticated(true);
                setBookingDetails((prev) => ({ ...prev, name: prev.name || me?.name || '', email: prev.email || me?.email || '' }));
            } catch { /* guest path */ }
        };
        detectAuth();
    }, [currentStep]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (currentStep === 2 && timeLeft !== null && timeLeft > 0)
            timer = setTimeout(() => setTimeLeft((p) => (p ? p - 1 : 0)), 1000);
        return () => clearTimeout(timer);
    }, [currentStep, timeLeft]);

    const validateDetails = () => {
        if (isAuthenticated) { setErrors((p) => ({ ...p, name: undefined, email: undefined })); return true; }
        const e: BookingErrors = {};
        if (!bookingDetails.name.trim()) e.name = 'Full name is required';
        else if (bookingDetails.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
        if (!bookingDetails.email.trim()) e.email = 'Email is required';
        else if (!emailPattern.test(bookingDetails.email)) e.email = 'Please enter a valid email';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleNextStep = async () => {
        if (currentStep === 0) {
            if (!date || !time) { setErrors({ ...errors, general: 'Please select a date and time' }); return; }
            setErrors({}); setCurrentStep(1); return;
        }
        if (currentStep === 1) {
            if (!validateDetails()) return;
            setProcessing(true);
            try {
                const csrfToken = await ensureCsrfToken(API_BASE);
                const createRes = await fetch(`${API_BASE}/bookings/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}) },
                    credentials: 'include',
                    body: JSON.stringify({
                        therapistId, date, time, sessionType,
                        bookingReason: bookingDetails.reason,
                        notes: bookingDetails.notes,
                        ...(appliedDiscountData ? { couponCode: appliedDiscountData.code } : {}),
                        ...(isAuthenticated ? {} : { name: bookingDetails.name, email: bookingDetails.email }),
                    }),
                });
                if (!createRes.ok) {
                    const errData = await createRes.json();
                    let msg = errData.error || "Something didn't go through — let's try again.";
                    if (errData.fields) { const f = Object.values(errData.fields)[0]; if (f) msg = `${msg}: ${f}`; }
                    setErrors({ ...errors, general: msg }); return;
                }
                setOrderData(unwrapApiData(await createRes.json()) as OrderData);
                setTimeLeft(300); setCurrentStep(2);
            } catch { setErrors({ ...errors, general: 'We hit a snag — please try again.' }); }
            finally { setProcessing(false); }
            return;
        }
        if (currentStep === 2) {
            if (!orderData) return;
            const opts = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mocked_key',
                amount: orderData.amount, currency: orderData.currency,
                name: 'Rebalance Therapy', description: `${sessionType} Session with ${therapistName}`,
                order_id: orderData.orderId,
                handler: async (response: RazorpayResponse) => {
                    try {
                        const csrfToken = await ensureCsrfToken(API_BASE);
                        const vRes = await fetch(`${API_BASE}/bookings/verify`, {
                            method: 'POST', credentials: 'include',
                            headers: { 'Content-Type': 'application/json', ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}) },
                            body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, bookingId: orderData.bookingId }),
                        });
                        if (vRes.ok) setCurrentStep(3);
                        else { const e = await vRes.json().catch(() => ({})); setErrors((p) => ({ ...p, payment: e?.error || 'Payment verification failed.' })); }
                    } catch { setErrors((p) => ({ ...p, payment: 'Payment verification failed. Contact support.' })); }
                },
                prefill: { name: bookingDetails.name, email: bookingDetails.email },
                theme: { color: '#059669' },
            };
            const RC = (window as unknown as { Razorpay?: new (o: object) => { open: () => void } }).Razorpay;
            if (!RC) { setErrors((p) => ({ ...p, general: 'Payment service unavailable' })); return; }
            new RC(opts).open(); return;
        }
        setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
    };

    const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 0));
    const payableAmount = orderData ? orderData.amount / 100 : price;
    const timerPct = timeLeft !== null ? (timeLeft / 300) * 100 : 100;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const SlotGroup = ({ label, icon, slots }: { label: string; icon: React.ReactNode; slots: string[] }) => {
        if (!slots.length) return null;
        return (
            <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {icon}{label}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-4">
                    {slots.map((slot) => {
                        const isSelected = time === slot;
                        return (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => { setTime(slot); setErrors({}); setTimeout(() => setCurrentStep(1), 180); }}
                                className={`relative flex items-center justify-center h-11 rounded-xl border-2 font-bold transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                    isSelected
                                        ? 'border-primary bg-primary text-background shadow-md shadow-primary/20 scale-[1.04]'
                                        : 'border-border/40 bg-background text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-95'
                                }`}
                            >
                                {isSelected && <CheckCircle2 className="absolute left-2 w-3 h-3 opacity-80" />}
                                {formatSlotTime(slot)}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="relative z-10 flex flex-1 h-full w-full min-w-0 flex-col overflow-hidden bg-background lg:border lg:border-border/10 lg:bg-background/80 lg:backdrop-blur-2xl lg:min-h-[550px] lg:flex-row lg:rounded-[1.5rem] lg:shadow-[0_32px_80px_rgba(0,0,0,0.1)]">

            {/* ── Sidebar ── */}
            <div className="relative flex w-full min-w-0 shrink-0 flex-col overflow-hidden bg-primary p-3 pb-2 text-background lg:w-[230px] lg:p-7">
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-background/5 rounded-full blur-3xl hidden lg:block" />
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/10 to-transparent hidden lg:block" />

                <div className="relative z-10 mb-2 pr-10 lg:mb-6 lg:pr-0">
                    <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/15 text-background/90 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <Lock className="w-3 h-3" /> Secure Booking
                    </div>
                    <h2 className="truncate text-base font-heading font-bold tracking-tight lg:text-lg">{therapistName}</h2>
                    <p className="truncate text-[10px] font-medium italic text-background/70 lg:text-xs mt-0.5">{specialty}</p>
                </div>

                {/* Steps */}
                <div className="relative z-10 flex w-full gap-2 overflow-x-auto pb-1 pt-1 lg:flex-1 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x">
                    {STEPS.map((step, i) => {
                        const isActive = i === currentStep;
                        const isPast = i < currentStep;
                        return (
                            <div key={step} className={`flex shrink-0 items-center gap-2 lg:gap-3 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`flex h-6 w-6 lg:h-7 lg:w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[9px] lg:text-[10px] font-black transition-all duration-300 ${
                                    isPast ? 'border-background bg-background text-primary scale-105 shadow-sm'
                                    : isActive ? 'border-background bg-background/20 text-background scale-110 shadow-sm'
                                    : 'border-background/25 bg-transparent text-background/70'
                                }`}>
                                    {isPast ? '✓' : i + 1}
                                </div>
                                <span className={`whitespace-nowrap text-[9px] lg:text-xs font-bold uppercase tracking-wider ${isActive ? 'text-background' : 'text-background/70'}`}>{step}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="relative z-10 hidden lg:flex mt-auto flex-col gap-1 pt-5 border-t border-background/15">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-background/50">Session Fee</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-heading font-black text-background">₹{price}</span>
                        <span className="text-[10px] text-background/50 font-medium">/ session</span>
                    </div>
                </div>
            </div>

            {/* ── Right Content ── */}
            <div className="relative flex flex-1 flex-col bg-background min-h-0 overflow-hidden">

                {/* Header */}
                <div className="flex h-13 shrink-0 items-center justify-between border-b border-border/10 px-4 sm:px-6 lg:h-15 lg:px-8 py-3">
                    <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-primary">
                            {currentStep + 1}/{STEPS.length}
                        </span>
                        <h3 className="font-heading text-sm font-black tracking-tight text-foreground lg:text-base">
                            {currentStep === 3 ? '🎉 Booking Confirmed' : STEPS[currentStep]}
                        </h3>
                    </div>
                    {currentStep === 0 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-bold text-muted-foreground">IST (GMT+5:30)</span>
                        </div>
                    )}
                    {currentStep === 2 && timeLeft !== null && (
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${timeLeft < 60 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <Clock className={`w-3 h-3 ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`} />
                            <span className={`text-[10px] font-black tabular-nums ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`}>
                                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Timer progress bar on payment step */}
                {currentStep === 2 && timeLeft !== null && (
                    <div className="h-0.5 w-full bg-border/20 shrink-0">
                        <div
                            className={`h-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${timerPct}%` }}
                        />
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">

                    {/* ── Step 0: Date & Time ── */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">

                            {/* Format selector */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Format</p>
                                <div className="flex gap-2 flex-wrap">
                                    {(sessionTypes?.length ? sessionTypes : ['Video', 'Phone']).map((fmt) => {
                                        const meta = FORMAT_META[fmt];
                                        const isSelected = sessionType === fmt;
                                        return (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setSessionType(fmt)}
                                                className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl border-2 text-xs font-bold transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                                        : 'border-border/40 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                                }`}
                                            >
                                                <span className={`${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {meta?.icon ?? <MessageCircle className="w-4 h-4" />}
                                                </span>
                                                <span>{meta?.label ?? fmt}</span>
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-0.5" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rolling 30-Day Date Strip */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Date</p>
                                        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">30-Day Rolling Window</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => scrollDates('left')}
                                            className="p-1 rounded-lg border border-border/40 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                            title="Scroll Left"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollDates('right')}
                                            className="p-1 rounded-lg border border-border/40 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                            title="Scroll Right"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div ref={dateScrollRef} className="flex gap-2 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                                    {dateOptions.map((opt) => {
                                        const isSelected = date === opt.date;
                                        const isToday = opt.date === today;
                                        const isTomorrow = opt.date === tomorrow;
                                        const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : opt.label.split(' ')[0];
                                        const day = isToday || isTomorrow ? opt.label.split(' ')[1] : opt.label.split(' ')[1];
                                        const slotCount = (knownSlotsMap[opt.date] ?? opt.slots).length;
                                        const hasSlots = slotCount > 0;
                                        return (
                                            <button
                                                key={opt.date}
                                                type="button"
                                                disabled={!hasSlots}
                                                onClick={() => { if (hasSlots) { setDate(opt.date); setTime(''); } }}
                                                className={`group relative flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl border-2 transition-all duration-200 min-w-[76px] lg:min-w-[84px] shrink-0 focus:outline-none ${
                                                    !hasSlots
                                                        ? 'border-border/20 bg-muted/20 text-muted-foreground/40 cursor-not-allowed opacity-50'
                                                        : isSelected
                                                        ? 'border-primary bg-primary text-background shadow-lg shadow-primary/25 cursor-pointer'
                                                        : isToday
                                                        ? 'border-primary/50 bg-primary/5 text-foreground hover:border-primary hover:-translate-y-0.5 shadow-sm cursor-pointer'
                                                        : 'border-border/30 bg-background text-foreground hover:border-primary/50 hover:-translate-y-0.5 shadow-sm cursor-pointer'
                                                }`}
                                            >
                                                {isToday && (
                                                    <span className={`absolute -top-2 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider rounded-full shadow-sm ${
                                                        isSelected ? 'bg-background text-primary' : 'bg-primary text-background'
                                                    }`}>
                                                        Today
                                                    </span>
                                                )}
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-background/80' : isToday && hasSlots ? 'text-primary font-black' : 'text-muted-foreground'}`}>
                                                    {label}
                                                </span>
                                                <span className={`text-lg font-heading font-black leading-none ${isSelected ? 'text-background' : 'text-foreground'}`}>
                                                    {day}
                                                </span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${!hasSlots ? 'bg-red-400/50' : isSelected ? 'bg-background' : 'bg-emerald-400'}`} />
                                                    <span className={`text-[8px] font-bold tracking-tight ${!hasSlots ? 'text-red-500/70' : isSelected ? 'text-background/90' : 'text-muted-foreground'}`}>
                                                        {!hasSlots ? 'Full' : `${slotCount} slots`}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {/* 30-Day limit indicator */}
                                    <div className="flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border-2 border-dashed border-border/40 bg-muted/10 text-muted-foreground min-w-[110px] shrink-0 text-center select-none">
                                        <Calendar className="w-4 h-4 text-primary/60" />
                                        <span className="text-[9px] font-bold leading-tight">Max 30 days<br />in advance</span>
                                    </div>
                                </div>
                            </div>

                            {/* Time slots grouped */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Available Times
                                        {!fetchingSlots && liveSlots.length > 0 && (
                                            <span className="ml-1.5 text-[9px] font-medium normal-case text-muted-foreground/60 italic">tap to continue</span>
                                        )}
                                    </p>
                                    {fetchingSlots && (
                                        <span className="flex items-center gap-1 text-[10px] text-primary font-bold">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                                        </span>
                                    )}
                                </div>

                                {fetchingSlots ? (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-xl" />)}
                                    </div>
                                ) : liveSlots.length > 0 ? (
                                    <div className="space-y-4">
                                        {(() => {
                                            const { morning, afternoon, evening } = groupSlotsByPeriod(liveSlots);
                                            return (
                                                <>
                                                    <SlotGroup label="Morning" icon={<Sunrise className="w-3 h-3" />} slots={morning} />
                                                    <SlotGroup label="Afternoon" icon={<Sun className="w-3 h-3" />} slots={afternoon} />
                                                    <SlotGroup label="Evening" icon={<Sunset className="w-3 h-3" />} slots={evening} />
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-10 text-center rounded-2xl border border-dashed border-border/40 bg-muted/20">
                                        <Calendar className="w-8 h-8 text-muted-foreground/40 mb-3" />
                                        <p className="text-sm font-bold text-foreground">No slots on this day</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try selecting another date →</p>
                                    </div>
                                )}

                                {errors.general && (
                                    <p className="text-xs font-bold text-destructive">{errors.general}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Details ── */}
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">

                            {/* Ticket-style booking summary */}
                            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-full" />
                                <div className="flex items-center gap-3 pl-5 pr-4 py-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-primary">
                                        {FORMAT_META[sessionType]?.icon ?? <MessageCircle className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground leading-snug">
                                            {FORMAT_META[sessionType]?.label ?? sessionType} with {therapistName}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {formatSlotTime(time)} IST
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(0)}
                                        className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            {errors.general && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-bold text-destructive">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                                    {errors.general}
                                </div>
                            )}

                            {/* Form card */}
                            <div className="rounded-2xl border border-border/25 overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/20">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">Your Details</h3>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {isAuthenticated ? 'Pre-filled from your account.' : "We'll send your session link here."}
                                        </p>
                                    </div>
                                    {isAuthenticated && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="bg-background p-4 space-y-3">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <User className="w-3 h-3" /> Full Name
                                        </label>
                                        <Input
                                            placeholder="Your full name"
                                            value={bookingDetails.name}
                                            onChange={e => { setBookingDetails({ ...bookingDetails, name: e.target.value }); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
                                            className={`h-11 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background transition-colors ${errors.name ? 'border-destructive bg-destructive/5' : ''}`}
                                        />
                                        {errors.name && <p className="text-xs text-destructive font-semibold">{errors.name}</p>}
                                    </div>
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <Mail className="w-3 h-3" /> Email Address
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="you@email.com"
                                            value={bookingDetails.email}
                                            onChange={e => { setBookingDetails({ ...bookingDetails, email: e.target.value }); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                                            className={`h-11 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background transition-colors ${errors.email ? 'border-destructive bg-destructive/5' : ''}`}
                                        />
                                        {errors.email && <p className="text-xs text-destructive font-semibold">{errors.email}</p>}
                                    </div>
                                    {/* Reason */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <MessageCircle className="w-3 h-3" />
                                            Reason <span className="font-medium normal-case tracking-normal ml-1">(optional)</span>
                                        </label>
                                        <textarea
                                            placeholder="What would you like to discuss?"
                                            value={bookingDetails.reason}
                                            onChange={e => setBookingDetails({ ...bookingDetails, reason: e.target.value })}
                                            className="w-full rounded-xl bg-muted/30 border border-border/30 focus:bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all min-h-[68px] resize-none"
                                        />
                                    </div>
                                    {/* Notes */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <FileText className="w-3 h-3" />
                                            Notes <span className="font-medium normal-case tracking-normal ml-1">(optional)</span>
                                        </label>
                                        <textarea
                                            placeholder="Any additional notes for the therapist?"
                                            value={bookingDetails.notes}
                                            onChange={e => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                                            className="w-full rounded-xl bg-muted/30 border border-border/30 focus:bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all min-h-[68px] resize-none"
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>
                    )}

                    {/* ── Step 2: Payment ── */}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">
                            {errors.general && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-bold text-destructive">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" /> {errors.general}
                                </div>
                            )}
                            {errors.payment && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-medium text-destructive">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" /> {errors.payment}
                                </div>
                            )}
                            {timeLeft === 0 && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-bold text-destructive">
                                    <Clock className="w-3.5 h-3.5 shrink-0" /> Slot expired — please go back and select a new time.
                                </div>
                            )}

                            {/* Coupon accordion */}
                            <div className={`rounded-2xl border overflow-hidden transition-colors ${appliedDiscountData ? 'border-emerald-300 dark:border-emerald-700' : 'border-border/30'}`}>
                                <button
                                    type="button"
                                    onClick={() => setShowCoupon(!showCoupon)}
                                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${appliedDiscountData ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                            <Tag className="w-3.5 h-3.5" />
                                        </div>
                                        {appliedDiscountData ? (
                                            <span className="text-xs font-bold text-emerald-600">
                                                {appliedDiscountData.discountPercentage}% off applied!
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold text-muted-foreground">Have a promo code?</span>
                                        )}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showCoupon ? 'rotate-180' : ''}`} />
                                </button>
                                {showCoupon && (
                                    <div className="px-4 pb-4 pt-2 border-t border-border/20 bg-muted/20 space-y-2.5">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="PROMO CODE"
                                                value={couponCode}
                                                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); }}
                                                className="h-10 rounded-xl text-xs font-bold uppercase tracking-widest bg-background"
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => handleApplyCoupon()}
                                                disabled={applyingCoupon || !couponCode.trim()}
                                                className="h-10 rounded-xl px-5 text-xs font-bold shrink-0"
                                            >
                                                {applyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                                            </Button>
                                        </div>
                                        {couponStatus && (
                                            <p className={`text-xs font-bold ${couponStatus.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
                                                {couponStatus.type === 'success' ? '✓ ' : '✕ '}{couponStatus.message}
                                            </p>
                                        )}
                                        {loadingCoupons && !appliedDiscountData && (
                                            <div className="pt-2 flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Finding offers...</span>
                                            </div>
                                        )}
                                        
                                        {!loadingCoupons && activeCoupons.length > 0 && !appliedDiscountData && (
                                            <div className="pt-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Available Offers</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeCoupons.map(coupon => (
                                                        <button
                                                            key={coupon.code}
                                                            type="button"
                                                            onClick={() => handleApplyCoupon(coupon.code)}
                                                            disabled={applyingCoupon}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                                                        >
                                                            <Tag className="w-3 h-3 text-primary" />
                                                            <span className="text-xs font-bold text-primary">{coupon.code}</span>
                                                            <span className="text-[10px] font-semibold text-primary/70">{coupon.discountPercentage}% OFF</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Order card */}
                            <div className="rounded-2xl border border-border/20 overflow-hidden shadow-sm">
                                <div className="bg-muted/30 px-5 py-4 border-b border-border/15">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Booking Summary</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            {FORMAT_META[sessionType]?.icon ?? <Video className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{FORMAT_META[sessionType]?.label ?? sessionType} Session</p>
                                            <p className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatSlotTime(time)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-4 space-y-2.5">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Session fee</span><span>₹{price}</span>
                                    </div>
                                    {appliedDiscountData && (
                                        <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                            <span>Discount ({appliedDiscountData.code})</span>
                                            <span>−₹{price - payableAmount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Taxes & fees</span><span>Included</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2.5 border-t border-border/20">
                                        <span className="text-base font-black text-foreground">Total</span>
                                        <span className="text-xl font-heading font-black text-primary">₹{payableAmount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust badge */}
                            <div className="flex items-center justify-center gap-2 py-2">
                                <ShieldCheck className="w-4 h-4 text-muted-foreground/50" />
                                <span className="text-[10px] text-muted-foreground/60 font-medium">Secured by Razorpay · 256-bit SSL encryption</span>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Confirmed ── */}
                    {currentStep === 3 && (
                        <div className="flex flex-col items-center text-center py-6 space-y-5 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 rotate-3">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading font-black text-foreground">You&apos;re booked!</h2>
                                <p className="text-sm text-muted-foreground mt-1">Your session is confirmed.</p>
                            </div>

                            {/* Booking details card */}
                            <div className="w-full rounded-2xl border border-border/20 overflow-hidden text-left shadow-sm">
                                <div className="bg-primary/5 px-4 py-3 border-b border-border/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Session Details</p>
                                </div>
                                <div className="divide-y divide-border/10">
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <User className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Therapist</p>
                                            <p className="text-sm font-bold text-foreground">{therapistName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <Calendar className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Date & Time</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {formatSlotTime(time)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        {FORMAT_META[sessionType]?.icon
                                            ? <span className="text-muted-foreground/60 shrink-0 w-4 h-4 flex items-center">{FORMAT_META[sessionType].icon}</span>
                                            : <Video className="w-4 h-4 text-muted-foreground/60 shrink-0" />}
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Format</p>
                                            <p className="text-sm font-bold text-foreground">{FORMAT_META[sessionType]?.label ?? sessionType}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                                A confirmation with the meeting link has been sent to your email.
                            </p>

                            {onComplete && (
                                <Button onClick={onComplete} className="w-full h-11 rounded-xl bg-primary text-background text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                                    Done
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {currentStep < 3 && (
                    <div className="mt-auto sticky bottom-0 flex w-full shrink-0 items-center justify-between border-t border-border/10 bg-background/98 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8 lg:py-4">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`h-10 text-xs font-bold text-muted-foreground hover:text-foreground ${currentStep === 0 ? 'invisible' : ''}`}
                        >
                            ← Back
                        </Button>

                        <div className="flex-1" />

                        {currentStep === 0 && time && (
                            <Button onClick={handleNextStep} disabled={fetchingSlots} className="h-10 lg:h-11 rounded-xl px-6 text-xs font-black uppercase tracking-wide shadow-md">
                                Continue →
                            </Button>
                        )}
                        {currentStep === 1 && (
                            <Button
                                onClick={handleNextStep}
                                disabled={processing}
                                loading={processing}
                                loadingText="Locking slot…"
                                className="h-10 lg:h-11 rounded-xl px-6 text-xs font-black uppercase tracking-wide shadow-md disabled:opacity-50"
                            >
                                Review & Pay
                            </Button>
                        )}
                        {currentStep === 2 && (
                            <Button
                                onClick={handleNextStep}
                                disabled={timeLeft === 0}
                                className="h-10 lg:h-11 rounded-xl px-6 text-xs font-black uppercase tracking-wide shadow-md disabled:opacity-50"
                            >
                                Pay ₹{payableAmount}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
