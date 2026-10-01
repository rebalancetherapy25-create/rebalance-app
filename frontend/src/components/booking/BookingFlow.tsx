"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Video, Phone, MessageCircle, Lock, Globe, Clock,
    Loader2, CheckCircle2, Tag, ChevronDown, ShieldCheck, Calendar, User, Mail,
    Sunrise, Sun, Sunset, ChevronLeft, ChevronRight, FileText,
    AlertCircle, RotateCcw, Sparkles, LogIn, UserPlus, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import { getApiBaseUrl, unwrapApiData } from '@/lib/runtime';
import { CSRF_HEADER_NAME, ensureCsrfToken } from '@/lib/auth';
import { buildDateOptions, filterPastSlots, isSlotInPast, type DateOption, type LegacyAvailability } from '@/lib/booking';
import { formatSlotTime } from '@/lib/date';
import { emailPattern } from '@/lib/form-validation';
import api from '@/lib/api';

export type BookingStep = 'datetime' | 'auth' | 'details' | 'payment' | 'confirmed';

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

interface OrderData { orderId: string; amount: number; currency: string; bookingId: string; keyId?: string; }
interface RazorpayResponse { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }
interface BookingErrors { name?: string; email?: string; general?: string; payment?: string; }
interface ApiAuthError {
    response?: {
        data?: {
            error?: string;
            message?: string;
            unverified?: boolean;
            data?: { unverified?: boolean };
        };
    };
}

interface BookingFlowProps {
    therapistId: string;
    therapistName: string;
    specialty: string;
    price: number;
    sessionTypes: string[];
    availability: LegacyAvailability[];
    weeklyAvailability?: { dayOfWeek: number; slots: string[] }[];
    onComplete?: () => void;
}

export default function BookingFlow({
    therapistId, therapistName, specialty, price, sessionTypes, availability, weeklyAvailability, onComplete
}: BookingFlowProps) {
    const [step, setStep] = useState<BookingStep>('datetime');
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

    // Auth & Guest choice state
    const [authTab, setAuthTab] = useState<'signup' | 'login' | 'guest'>('signup');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupError, setSignupError] = useState('');

    const [otpActive, setOtpActive] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const activeStepsList: { key: BookingStep; label: string }[] = isAuthenticated
        ? [
            { key: 'datetime', label: 'Date & Time' },
            { key: 'details', label: 'Details' },
            { key: 'payment', label: 'Payment' },
            { key: 'confirmed', label: 'Confirmed' },
          ]
        : [
            { key: 'datetime', label: 'Date & Time' },
            { key: 'auth', label: 'Account' },
            { key: 'details', label: 'Details' },
            { key: 'payment', label: 'Payment' },
            { key: 'confirmed', label: 'Confirmed' },
          ];

    const currentStepIndex = Math.max(0, activeStepsList.findIndex((s) => s.key === step));

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
                        setStep('confirmed'); // Skip Razorpay for 100% off
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
        const sourceAvailability = weeklyAvailability?.length ? weeklyAvailability : availability || [];
        const options = buildDateOptions(sourceAvailability);
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
    }, [sessionTypes, availability, weeklyAvailability]);

    // Periodically re-evaluate date options and slots as time advances
    useEffect(() => {
        const sourceAvailability = weeklyAvailability?.length ? weeklyAvailability : availability || [];
        const interval = setInterval(() => {
            const freshOptions = buildDateOptions(sourceAvailability);
            setDateOptions(freshOptions);
            if (date) {
                setKnownSlotsMap((prev) => {
                    const currentSlots = prev[date];
                    if (!currentSlots) return prev;
                    const filtered = filterPastSlots(date, currentSlots);
                    return { ...prev, [date]: filtered };
                });
                setLiveSlots((prev) => filterPastSlots(date, prev));
                setTime((prevTime) => (prevTime && isSlotInPast(date, prevTime) ? '' : prevTime));
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [availability, weeklyAvailability, date]);

    useEffect(() => {
        if (!therapistId || !dateOptions.length) return;
        let active = true;
        const prefetchAll = async () => {
            const resultMap: Record<string, string[]> = {};
            await Promise.all(
                dateOptions.map(async (opt) => {
                    try {
                        const res = await fetch(`${API_BASE}/availability/${therapistId}?date=${opt.date}&_t=${Date.now()}`, { cache: 'no-store' });
                        if (!res.ok) { resultMap[opt.date] = filterPastSlots(opt.date, opt.slots); return; }
                        const hasRecord = res.headers.get('X-Availability-Record') === '1';
                        const data = unwrapApiData(await res.json()) as { time: string }[];
                        const rawSlots = data?.length > 0 ? data.map((s) => s.time).sort() : hasRecord ? [] : opt.slots;
                        resultMap[opt.date] = filterPastSlots(opt.date, rawSlots);
                    } catch { resultMap[opt.date] = filterPastSlots(opt.date, opt.slots); }
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
                    const rawSlots = data?.length > 0 ? data.map((s) => s.time).sort() : hasRecord ? [] : dateOptions.find((o) => o.date === date)?.slots ?? [];
                    const slots = filterPastSlots(date, rawSlots);
                    setKnownSlotsMap((prev) => ({ ...prev, [date]: slots }));
                    setLiveSlots(slots);
                    // Clear selected time if it has passed or is no longer available
                    setTime((prevTime) => (prevTime && !slots.includes(prevTime) ? '' : prevTime));
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError' && active) {
                    const fallback = knownSlotsMap[date] ?? dateOptions.find((o) => o.date === date)?.slots ?? [];
                    const slots = filterPastSlots(date, fallback);
                    setLiveSlots(slots);
                    setTime((prevTime) => (prevTime && !slots.includes(prevTime) ? '' : prevTime));
                }
            } finally { if (!controller.signal.aborted && active) setFetchingSlots(false); }
        };
        fetchSlots(false);
        const pollInterval = setInterval(() => { fetchSlots(true); }, 15000);
        return () => { active = false; controller.abort(); clearInterval(pollInterval); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, therapistId, dateOptions]);

    useEffect(() => {
        if (authFetched.current) return;
        authFetched.current = true;
        const detectAuth = async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
                if (!response.ok) return;
                const me = unwrapApiData(await response.json());
                if (me?._id || me?.email) {
                    setIsAuthenticated(true);
                    setBookingDetails((prev) => ({
                        ...prev,
                        name: prev.name || me?.name || '',
                        email: prev.email || me?.email || '',
                    }));
                }
            } catch { /* guest path */ }
        };
        detectAuth();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'payment' && timeLeft !== null && timeLeft > 0)
            timer = setTimeout(() => setTimeLeft((p) => (p ? p - 1 : 0)), 1000);
        return () => clearTimeout(timer);
    }, [step, timeLeft]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((p) => p - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleAuthLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoginError('');
        const trimmedEmail = loginEmail.trim();
        if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
            setLoginError('Please enter a valid email address.');
            return;
        }
        if (!loginPassword) {
            setLoginError('Password is required.');
            return;
        }

        setLoginLoading(true);
        try {
            const res = await api.post('/auth/login', {
                email: trimmedEmail,
                password: loginPassword,
            });
            const user = unwrapApiData(res.data) as { name?: string; email?: string };
            setIsAuthenticated(true);
            setBookingDetails((prev) => ({
                ...prev,
                name: user?.name || prev.name || '',
                email: user?.email || trimmedEmail,
            }));
            setStep('details');
        } catch (err: unknown) {
            const apiErr = err as ApiAuthError;
            if (apiErr?.response?.data?.unverified || apiErr?.response?.data?.data?.unverified) {
                setOtpEmail(trimmedEmail);
                setOtpActive(true);
                setAuthTab('signup');
                setSignupError('Your email is not verified yet. We sent a verification code to your inbox.');
                try {
                    await api.post('/auth/resend-otp', { email: trimmedEmail });
                } catch {}
                return;
            }
            const msg = apiErr?.response?.data?.error || apiErr?.response?.data?.message || 'Invalid email or password. Please try again.';
            setLoginError(msg);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleAuthRegister = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSignupError('');
        const trimmedName = signupName.trim();
        const trimmedEmail = signupEmail.trim();

        if (!trimmedName || trimmedName.length < 2) {
            setSignupError('Full name must be at least 2 characters.');
            return;
        }
        if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
            setSignupError('Please enter a valid email address.');
            return;
        }
        if (!signupPassword || signupPassword.length < 8) {
            setSignupError('Password must be at least 8 characters long.');
            return;
        }

        setSignupLoading(true);
        try {
            await api.post('/auth/register', {
                name: trimmedName,
                email: trimmedEmail,
                password: signupPassword,
            });
            setOtpEmail(trimmedEmail);
            setOtpActive(true);
            setOtpCode('');
            setResendCooldown(60);
        } catch (err: unknown) {
            const apiErr = err as ApiAuthError;
            const msg = apiErr?.response?.data?.error || apiErr?.response?.data?.message || 'Failed to create account. Please try again.';
            setSignupError(msg);
        } finally {
            setSignupLoading(false);
        }
    };

    const handleAuthVerifyOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setOtpError('');
        if (!otpCode.trim() || otpCode.trim().length !== 6) {
            setOtpError('Please enter the 6-digit verification code.');
            return;
        }

        setOtpLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', {
                email: otpEmail.trim(),
                otp: otpCode.trim(),
            });
            const user = unwrapApiData(res.data) as { name?: string; email?: string };
            setIsAuthenticated(true);
            setBookingDetails((prev) => ({
                ...prev,
                name: user?.name || signupName.trim() || prev.name,
                email: user?.email || otpEmail.trim(),
            }));
            setOtpActive(false);
            setStep('details');
        } catch (err: unknown) {
            const apiErr = err as ApiAuthError;
            const msg = apiErr?.response?.data?.error || apiErr?.response?.data?.message || 'Invalid or expired code. Please try again.';
            setOtpError(msg);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !otpEmail) return;
        try {
            await api.post('/auth/resend-otp', { email: otpEmail });
            setResendCooldown(60);
            setOtpError('');
        } catch {
            setOtpError('Unable to resend verification code right now. Please try again shortly.');
        }
    };

    const handleContinueAsGuest = () => {
        const name = bookingDetails.name.trim() || signupName.trim();
        const email = bookingDetails.email.trim() || signupEmail.trim() || loginEmail.trim();
        setBookingDetails((prev) => ({
            ...prev,
            name: name || prev.name,
            email: email || prev.email,
        }));
        setStep('details');
    };

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
        if (step === 'datetime') {
            if (!date || !time) { setErrors({ ...errors, general: 'Please select a date and time' }); return; }
            setErrors({});
            if (isAuthenticated) {
                setStep('details');
            } else {
                setStep('auth');
            }
            return;
        }
        if (step === 'auth') {
            if (authTab === 'guest') {
                handleContinueAsGuest();
            } else if (authTab === 'login') {
                await handleAuthLogin();
            } else if (authTab === 'signup') {
                if (otpActive) {
                    await handleAuthVerifyOtp();
                } else {
                    await handleAuthRegister();
                }
            }
            return;
        }
        if (step === 'details') {
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
                setTimeLeft(300);
                setStep('payment');
            } catch { setErrors({ ...errors, general: 'We hit a snag — please try again.' }); }
            finally { setProcessing(false); }
            return;
        }
        if (step === 'payment') {
            if (!orderData) return;
            const razorpayKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mocked_key';
            const opts = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Rebalance Therapy',
                description: `${sessionType} Session with ${therapistName}`,
                order_id: orderData.orderId,
                handler: async (response: RazorpayResponse) => {
                    setProcessing(true);
                    setErrors({});
                    try {
                        let csrfToken: string | null = null;
                        try {
                            csrfToken = await ensureCsrfToken(API_BASE);
                        } catch {
                            // Non-fatal if CSRF cookie is blocked on cross-origin setup
                        }

                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: orderData.bookingId,
                        };

                        let vRes = await fetch(`${API_BASE}/bookings/verify`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
                            },
                            body: JSON.stringify(verifyPayload),
                        });

                        // Retry once on network glitch / 5xx error
                        if (!vRes.ok && vRes.status >= 500) {
                            await new Promise((resolve) => setTimeout(resolve, 1500));
                            vRes = await fetch(`${API_BASE}/bookings/verify`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
                                },
                                body: JSON.stringify(verifyPayload),
                            });
                        }

                        if (vRes.ok) {
                            setStep('confirmed');
                        } else {
                            const e = await vRes.json().catch(() => ({}));
                            // If backend confirms it is already confirmed, transition to success
                            if (e?.error?.toLowerCase().includes('already confirmed') || e?.code === 'BOOKING_ALREADY_CONFIRMED') {
                                setStep('confirmed');
                            } else {
                                setErrors((p) => ({
                                    ...p,
                                    payment: e?.error || `Payment received (ID: ${response.razorpay_payment_id}), but confirmation was delayed. Please contact support.`,
                                }));
                            }
                        }
                    } catch (err) {
                        console.error('Payment verification error:', err);
                        setErrors((p) => ({
                            ...p,
                            payment: `Payment received (ID: ${response.razorpay_payment_id}), but network verification was interrupted. Please check your email or contact support.`,
                        }));
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: { name: bookingDetails.name, email: bookingDetails.email },
                theme: { color: '#059669' },
                modal: {
                    ondismiss: () => {
                        setProcessing(false);
                    },
                },
            };
            type RazorpayFailureResponse = {
                error?: {
                    code?: string;
                    description?: string;
                    source?: string;
                    step?: string;
                    reason?: string;
                };
            };
            const RC = (window as unknown as {
                Razorpay?: new (o: object) => {
                    open: () => void;
                    on: (event: string, handler: (data: RazorpayFailureResponse) => void) => void;
                };
            }).Razorpay;
            if (!RC) {
                setErrors((p) => ({ ...p, general: 'Payment service unavailable' }));
                setProcessing(false);
                return;
            }
            const rzpInstance = new RC(opts);
            rzpInstance.on('payment.failed', function (response: RazorpayFailureResponse) {
                setProcessing(false);
                const failureMsg = response?.error?.description || response?.error?.reason || 'Payment was declined or cancelled. Please try again or use another payment method.';
                setErrors((p) => ({
                    ...p,
                    payment: failureMsg,
                }));
            });
            rzpInstance.open();
            return;
        }
    };

    const prevStep = () => {
        if (step === 'auth') {
            setStep('datetime');
        } else if (step === 'details') {
            if (isAuthenticated) {
                setStep('datetime');
            } else {
                setStep('auth');
            }
        } else if (step === 'payment') {
            setStep('details');
        }
    };
    const payableAmount = orderData ? orderData.amount / 100 : price;
    const timerPct = timeLeft !== null ? (timeLeft / 300) * 100 : 100;
    const today = dateOptions[0]?.date || new Date().toISOString().split('T')[0];
    const tomorrow = dateOptions[1]?.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
                                onClick={() => {
                                    setTime(slot);
                                    setErrors({});
                                    setTimeout(() => {
                                        if (isAuthenticated) {
                                            setStep('details');
                                        } else {
                                            setStep('auth');
                                        }
                                    }, 180);
                                }}
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
                    {activeStepsList.map((s, i) => {
                        const isActive = i === currentStepIndex;
                        const isPast = i < currentStepIndex;
                        return (
                            <div key={s.key} className={`flex shrink-0 items-center gap-2 lg:gap-3 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`flex h-6 w-6 lg:h-7 lg:w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[9px] lg:text-[10px] font-black transition-all duration-300 ${
                                    isPast ? 'border-background bg-background text-primary scale-105 shadow-sm'
                                    : isActive ? 'border-background bg-background/20 text-background scale-110 shadow-sm'
                                    : 'border-background/25 bg-transparent text-background/70'
                                }`}>
                                    {isPast ? '✓' : i + 1}
                                </div>
                                <span className={`whitespace-nowrap text-[9px] lg:text-xs font-bold uppercase tracking-wider ${isActive ? 'text-background' : 'text-background/70'}`}>{s.label}</span>
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
                            {currentStepIndex + 1}/{activeStepsList.length}
                        </span>
                        <h3 className="font-heading text-sm font-black tracking-tight text-foreground lg:text-base">
                            {step === 'confirmed'
                                ? '🎉 Booking Confirmed'
                                : step === 'auth'
                                ? 'Sign In or Continue'
                                : activeStepsList[currentStepIndex]?.label ?? 'Booking'}
                        </h3>
                    </div>
                    {step === 'datetime' && (
                        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-bold text-muted-foreground">IST (GMT+5:30)</span>
                        </div>
                    )}
                    {step === 'payment' && timeLeft !== null && (
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${timeLeft < 60 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <Clock className={`w-3 h-3 ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`} />
                            <span className={`text-[10px] font-black tabular-nums ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`}>
                                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Timer progress bar on payment step */}
                {step === 'payment' && timeLeft !== null && (
                    <div className="h-0.5 w-full bg-border/20 shrink-0">
                        <div
                            className={`h-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${timerPct}%` }}
                        />
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">

                    {/* ── Step: Date & Time ── */}
                    {step === 'datetime' && (
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
                                    <div className="flex flex-col items-center py-10 px-4 text-center rounded-2xl border border-dashed border-border/40 bg-muted/20">
                                        <Calendar className="w-8 h-8 text-muted-foreground/40 mb-3" />
                                        <p className="text-sm font-bold text-foreground">
                                            {date === today ? 'All slots for today have already passed' : 'No slots on this day'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                            {date === today
                                                ? 'Please choose tomorrow or an upcoming date to schedule your session.'
                                                : 'Try selecting another date from the calendar →'}
                                        </p>
                                        {date === today && tomorrow && (
                                            <button
                                                type="button"
                                                onClick={() => { setDate(tomorrow); setTime(''); }}
                                                className="mt-4 px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
                                            >
                                                View Tomorrow&apos;s Slots →
                                            </button>
                                        )}
                                    </div>
                                )}

                                {errors.general && (
                                    <p className="text-xs font-bold text-destructive">{errors.general}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Step: Auth / Account / Guest ── */}
                    {step === 'auth' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">
                            {/* Ticket-style booking summary */}
                            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-full" />
                                <div className="flex items-center gap-3 pl-5 pr-4 py-3.5">
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
                                        onClick={() => setStep('datetime')}
                                        className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            {/* Account Benefits Hint Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wide text-foreground">
                                                Why create an account with us?
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground">
                                                Unlock client perks or continue as a guest anytime
                                            </p>
                                        </div>
                                    </div>
                                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/15 px-2 py-0.5 rounded-full shrink-0">
                                        Recommended
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/80">
                                    <div className="flex items-start gap-2 bg-background/60 dark:bg-background/40 backdrop-blur-xs p-2 rounded-xl border border-border/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-[11px] leading-tight"><strong>Client Dashboard:</strong> Track sessions & 1-click video joins</span>
                                    </div>
                                    <div className="flex items-start gap-2 bg-background/60 dark:bg-background/40 backdrop-blur-xs p-2 rounded-xl border border-border/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-[11px] leading-tight"><strong>Easy Invoices:</strong> Official GST receipts for reimbursement</span>
                                    </div>
                                    <div className="flex items-start gap-2 bg-background/60 dark:bg-background/40 backdrop-blur-xs p-2 rounded-xl border border-border/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-[11px] leading-tight"><strong>Self-Rescheduling:</strong> Manage bookings easily anytime</span>
                                    </div>
                                    <div className="flex items-start gap-2 bg-background/60 dark:bg-background/40 backdrop-blur-xs p-2 rounded-xl border border-border/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-[11px] leading-tight"><strong>100% Confidential:</strong> Bank-grade encryption & privacy</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3-Way Choice Selector */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/25 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => { setAuthTab('signup'); setSignupError(''); setLoginError(''); }}
                                    className={`py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                        authTab === 'signup'
                                            ? 'bg-background text-foreground shadow-sm font-extrabold border border-border/30'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <UserPlus className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate">Sign Up</span>
                                    <span className="hidden md:inline-block text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">Free</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthTab('login'); setSignupError(''); setLoginError(''); }}
                                    className={`py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                        authTab === 'login'
                                            ? 'bg-background text-foreground shadow-sm font-extrabold border border-border/30'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <LogIn className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate">Log In</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthTab('guest'); setSignupError(''); setLoginError(''); }}
                                    className={`py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                        authTab === 'guest'
                                            ? 'bg-background text-foreground shadow-sm font-extrabold border border-border/30'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate">Guest</span>
                                </button>
                            </div>

                            {/* Tab Panel: Sign Up */}
                            {authTab === 'signup' && (
                                !otpActive ? (
                                    <div className="rounded-2xl border border-border/25 overflow-hidden shadow-sm bg-background p-4 space-y-3.5">
                                        <div className="border-b border-border/15 pb-2.5">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Create Your Account</h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Quick setup — takes less than 30 seconds</p>
                                        </div>

                                        {signupError && (
                                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-semibold text-destructive">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{signupError}</span>
                                            </div>
                                        )}

                                        <form onSubmit={handleAuthRegister} className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <User className="w-3 h-3" /> Full Name
                                                </label>
                                                <Input
                                                    placeholder="e.g. Priya Sharma"
                                                    value={signupName}
                                                    onChange={(e) => { setSignupName(e.target.value); if (signupError) setSignupError(''); }}
                                                    className="h-10 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <Mail className="w-3 h-3" /> Email Address
                                                </label>
                                                <Input
                                                    type="email"
                                                    placeholder="you@email.com"
                                                    value={signupEmail}
                                                    onChange={(e) => { setSignupEmail(e.target.value); if (signupError) setSignupError(''); }}
                                                    className="h-10 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <Lock className="w-3 h-3" /> Password
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type={showSignupPassword ? 'text' : 'password'}
                                                        placeholder="At least 8 characters"
                                                        value={signupPassword}
                                                        onChange={(e) => { setSignupPassword(e.target.value); if (signupError) setSignupError(''); }}
                                                        className="h-10 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                                        tabIndex={-1}
                                                    >
                                                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground/80">We&apos;ll send a 6-digit verification code to your email.</p>
                                            </div>

                                            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                                                <Button
                                                    type="submit"
                                                    disabled={signupLoading || !signupName.trim() || !signupEmail.trim() || signupPassword.length < 8}
                                                    loading={signupLoading}
                                                    loadingText="Creating account…"
                                                    className="w-full sm:flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide bg-primary text-background shadow-sm hover:opacity-90"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                                    Sign Up & Continue
                                                </Button>
                                                <button
                                                    type="button"
                                                    onClick={handleContinueAsGuest}
                                                    className="text-xs font-bold text-muted-foreground hover:text-foreground underline decoration-dotted transition-colors py-1 px-2"
                                                >
                                                    Skip for now & continue as Guest →
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border-2 border-primary/30 overflow-hidden shadow-md bg-background p-5 space-y-4 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Verify Your Email</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    We sent a 6-digit code to <strong className="text-foreground">{otpEmail}</strong>
                                                </p>
                                            </div>
                                        </div>

                                        {otpError && (
                                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-semibold text-destructive">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{otpError}</span>
                                            </div>
                                        )}

                                        <form onSubmit={handleAuthVerifyOtp} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                                                    6-Digit Verification Code
                                                </label>
                                                <Input
                                                    type="text"
                                                    maxLength={6}
                                                    autoFocus
                                                    placeholder="123456"
                                                    value={otpCode}
                                                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); if (otpError) setOtpError(''); }}
                                                    className="h-12 rounded-xl text-center text-xl font-mono font-bold tracking-[0.5em] bg-muted/20 border-border/40 focus:bg-background"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <button
                                                    type="button"
                                                    disabled={resendCooldown > 0}
                                                    onClick={handleResendOtp}
                                                    className="text-primary font-bold hover:underline disabled:text-muted-foreground disabled:no-underline"
                                                >
                                                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setOtpActive(false); setOtpError(''); }}
                                                    className="text-muted-foreground hover:text-foreground text-[11px]"
                                                >
                                                    Change Email
                                                </button>
                                            </div>

                                            <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                                                <Button
                                                    type="submit"
                                                    disabled={otpLoading || otpCode.trim().length !== 6}
                                                    loading={otpLoading}
                                                    loadingText="Verifying…"
                                                    className="w-full sm:flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide bg-primary text-background shadow-sm"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                    Verify & Continue
                                                </Button>
                                                <button
                                                    type="button"
                                                    onClick={handleContinueAsGuest}
                                                    className="text-xs font-bold text-muted-foreground hover:text-foreground underline decoration-dotted transition-colors py-1 px-2"
                                                >
                                                    Skip verification & book as Guest →
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )
                            )}

                            {/* Tab Panel: Log In */}
                            {authTab === 'login' && (
                                <div className="rounded-2xl border border-border/25 overflow-hidden shadow-sm bg-background p-4 space-y-3.5">
                                    <div className="border-b border-border/15 pb-2.5">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Welcome Back</h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Sign in to book with your saved account</p>
                                    </div>

                                    {loginError && (
                                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-semibold text-destructive">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{loginError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleAuthLogin} className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <Mail className="w-3 h-3" /> Email Address
                                            </label>
                                            <Input
                                                type="email"
                                                placeholder="you@email.com"
                                                value={loginEmail}
                                                onChange={(e) => { setLoginEmail(e.target.value); if (loginError) setLoginError(''); }}
                                                className="h-10 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    <Lock className="w-3 h-3" /> Password
                                                </label>
                                                <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline">
                                                    Forgot?
                                                </a>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showLoginPassword ? 'text' : 'password'}
                                                    placeholder="Your password"
                                                    value={loginPassword}
                                                    onChange={(e) => { setLoginPassword(e.target.value); if (loginError) setLoginError(''); }}
                                                    className="h-10 rounded-xl text-sm bg-muted/30 border-border/30 focus:bg-background pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                                    tabIndex={-1}
                                                >
                                                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                                            <Button
                                                type="submit"
                                                disabled={loginLoading || !loginEmail.trim() || !loginPassword}
                                                loading={loginLoading}
                                                loadingText="Signing in…"
                                                className="w-full sm:flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide bg-primary text-background shadow-sm hover:opacity-90"
                                            >
                                                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                                Log In & Continue
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={handleContinueAsGuest}
                                                className="text-xs font-bold text-muted-foreground hover:text-foreground underline decoration-dotted transition-colors py-1 px-2"
                                            >
                                                Continue as Guest instead →
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Tab Panel: Continue as Guest */}
                            {authTab === 'guest' && (
                                <div className="rounded-2xl border border-border/25 overflow-hidden shadow-sm bg-background p-4 space-y-3.5">
                                    <div className="border-b border-border/15 pb-2.5">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Fast Guest Booking</h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">No password required · Instant session confirmation</p>
                                    </div>

                                    <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5 border border-border/20">
                                        <p className="font-semibold text-foreground">How guest booking works:</p>
                                        <ul className="space-y-1 text-[11px] list-disc list-inside">
                                            <li>We will email your private video call link and calendar invite directly to you.</li>
                                            <li>No password needed. Enter your details on the next step.</li>
                                            <li>You can always create a password later anytime with the same email.</li>
                                        </ul>
                                    </div>

                                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                                        <Button
                                            type="button"
                                            onClick={handleContinueAsGuest}
                                            className="w-full sm:flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wide bg-primary text-background shadow-sm hover:opacity-90"
                                        >
                                            <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                                            Continue to Details →
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setAuthTab('signup')}
                                            className="text-xs font-bold text-primary hover:underline transition-colors py-1 px-2"
                                        >
                                            Want an account? Sign up instead
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step: Details ── */}
                    {step === 'details' && (
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
                                        onClick={() => setStep('datetime')}
                                        className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            {/* Account vs Guest Status Badge */}
                            {!isAuthenticated ? (
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/20 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                        <span className="text-muted-foreground text-[11px]">
                                            Booking as <strong className="text-foreground">Guest</strong>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStep('auth')}
                                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        Log in or Sign up →
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="text-emerald-900 dark:text-emerald-200 text-[11px]">
                                            Logged in as <strong className="font-bold">{bookingDetails.email}</strong>
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                                        Linked to Dashboard
                                    </span>
                                </div>
                            )}

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

                    {/* ── Step: Payment ── */}
                    {step === 'payment' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">
                            {errors.general && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-bold text-destructive">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" /> {errors.general}
                                </div>
                            )}
                            {errors.payment && (
                                <div className="p-4 bg-destructive/10 border-2 border-destructive/25 rounded-2xl space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-destructive">Payment Unsuccessful</h4>
                                            <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">{errors.payment}</p>
                                            <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                                                No booking has been finalized. If your account was debited, your bank will automatically reverse the transaction within 3–5 business days.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-destructive/15">
                                        {timeLeft !== null && timeLeft > 0 ? (
                                            <Button
                                                type="button"
                                                onClick={handleNextStep}
                                                disabled={processing}
                                                size="sm"
                                                className="h-8 rounded-lg px-3.5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry Payment
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={() => { setErrors({}); setStep('datetime'); }}
                                                size="sm"
                                                className="h-8 rounded-lg px-3.5 text-xs font-bold bg-primary text-background hover:bg-primary/90 shadow-sm"
                                            >
                                                <Calendar className="w-3.5 h-3.5 mr-1.5" /> Choose Another Slot
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setErrors({}); setStep('datetime'); }}
                                            className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                                        >
                                            Change Time Slot
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {timeLeft === 0 && !errors.payment && (
                                <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <span>Slot reservation expired. Please pick another time slot.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setErrors({}); setStep('datetime'); }}
                                        className="font-bold underline ml-2 hover:opacity-80 shrink-0"
                                    >
                                        Select Time
                                    </button>
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

                    {/* ── Step: Confirmed ── */}
                    {step === 'confirmed' && (
                        <div className="flex flex-col items-center text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <CheckCircle2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl lg:text-2xl font-heading font-black text-foreground">You&apos;re booked!</h2>
                                <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    Payment Successful · Session Confirmed
                                </p>
                            </div>

                            {/* Booking details card */}
                            <div className="w-full rounded-2xl border border-border/20 overflow-hidden text-left shadow-sm">
                                <div className="bg-primary/5 px-4 py-2.5 border-b border-border/10 flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Session Details</p>
                                    {!isAuthenticated ? (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            Guest Booking
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            Linked to Account
                                        </span>
                                    )}
                                </div>
                                <div className="divide-y divide-border/10 text-xs">
                                    <div className="flex items-center gap-3 px-4 py-2.5">
                                        <User className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                        <div>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Therapist</p>
                                            <p className="text-xs sm:text-sm font-bold text-foreground">{therapistName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-2.5">
                                        <Calendar className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                        <div>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Date & Time</p>
                                            <p className="text-xs sm:text-sm font-bold text-foreground">
                                                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {formatSlotTime(time)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-2.5">
                                        {FORMAT_META[sessionType]?.icon
                                            ? <span className="text-muted-foreground/60 shrink-0 w-4 h-4 flex items-center">{FORMAT_META[sessionType].icon}</span>
                                            : <Video className="w-4 h-4 text-muted-foreground/60 shrink-0" />}
                                        <div>
                                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Format</p>
                                            <p className="text-xs sm:text-sm font-bold text-foreground">{FORMAT_META[sessionType]?.label ?? sessionType}</p>
                                        </div>
                                    </div>
                                    {bookingDetails.email && (
                                        <div className="flex items-center gap-3 px-4 py-2.5">
                                            <Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Confirmation Sent To</p>
                                                <p className="text-xs sm:text-sm font-bold text-foreground">{bookingDetails.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {orderData?.bookingId && (
                                        <div className="flex items-center gap-3 px-4 py-2 bg-muted/20">
                                            <Tag className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Booking Reference</p>
                                                <p className="text-[11px] font-mono font-bold text-muted-foreground">{orderData.bookingId}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informational callout */}
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3.5 text-left text-xs space-y-1.5 w-full">
                                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                    <span>Confirmation email sent!</span>
                                </div>
                                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                                    We&apos;ve emailed your booking receipt and meeting details to <strong className="font-bold text-emerald-900 dark:text-emerald-200">{bookingDetails.email}</strong>. Please check your inbox (and spam/promotions folder).
                                </p>
                                {!isAuthenticated && (
                                    <p className="text-[10px] text-muted-foreground pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                                        💡 You don&apos;t need an account to join. Just click the meeting link in your email at the scheduled session time!
                                    </p>
                                )}
                            </div>

                            {/* Post-booking Account Hint Card for Guests */}
                            {!isAuthenticated && bookingDetails.email && (
                                <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20 p-4 text-left space-y-2.5 w-full">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wide text-foreground">Save this session to your account</h4>
                                            <p className="text-[11px] text-muted-foreground">View upcoming bookings, session notes & invoices</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Create a free account with <strong className="text-foreground">{bookingDetails.email}</strong> anytime. This booking will automatically sync to your client dashboard!
                                    </p>
                                    <div className="pt-1">
                                        <a
                                            href={`/register?email=${encodeURIComponent(bookingDetails.email)}&name=${encodeURIComponent(bookingDetails.name)}`}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Create Free ReBalance Account →
                                        </a>
                                    </div>
                                </div>
                            )}

                            {onComplete && (
                                <Button onClick={onComplete} className="w-full h-11 rounded-xl bg-primary text-background text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                                    Done
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {step !== 'confirmed' && (
                    <div className="mt-auto sticky bottom-0 flex w-full shrink-0 items-center justify-between border-t border-border/10 bg-background/98 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8 lg:py-4">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={step === 'datetime'}
                            className={`h-10 text-xs font-bold text-muted-foreground hover:text-foreground ${step === 'datetime' ? 'invisible' : ''}`}
                        >
                            ← Back
                        </Button>

                        <div className="flex-1" />

                        {step === 'datetime' && time && (
                            <Button onClick={handleNextStep} disabled={fetchingSlots} className="h-10 lg:h-11 rounded-xl px-6 text-xs font-black uppercase tracking-wide shadow-md">
                                Continue →
                            </Button>
                        )}
                        {step === 'auth' && (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                disabled={
                                    authTab === 'signup'
                                        ? (otpActive ? otpLoading || otpCode.trim().length !== 6 : signupLoading || !signupName.trim() || !signupEmail.trim() || signupPassword.length < 8)
                                        : authTab === 'login'
                                        ? loginLoading || !loginEmail.trim() || !loginPassword
                                        : false
                                }
                                loading={authTab === 'signup' ? (otpActive ? otpLoading : signupLoading) : authTab === 'login' ? loginLoading : false}
                                loadingText={authTab === 'signup' ? (otpActive ? 'Verifying…' : 'Creating…') : 'Signing in…'}
                                className="h-10 lg:h-11 rounded-xl px-6 text-xs font-black uppercase tracking-wide shadow-md"
                            >
                                {authTab === 'guest'
                                    ? 'Continue as Guest →'
                                    : authTab === 'login'
                                    ? 'Log In & Continue →'
                                    : otpActive
                                    ? 'Verify Code →'
                                    : 'Create Account & Continue →'}
                            </Button>
                        )}
                        {step === 'details' && (
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
                        {step === 'payment' && (
                            <Button
                                onClick={handleNextStep}
                                disabled={timeLeft === 0 || processing}
                                loading={processing}
                                loadingText="Verifying payment…"
                                className="h-10 lg:h-11 rounded-xl px-6 text-xs font-black uppercase tracking-wide shadow-md disabled:opacity-50"
                            >
                                {errors.payment ? `Retry Pay ₹${payableAmount}` : `Pay ₹${payableAmount}`}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
