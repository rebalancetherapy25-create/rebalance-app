'use client';
import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
    threshold?: number;
    rootMargin?: string;
}

export function useInView({ threshold = 0.12, rootMargin = '0px 0px -48px 0px' }: UseInViewOptions = {}) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return { ref, inView };
}
