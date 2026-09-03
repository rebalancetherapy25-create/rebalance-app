'use client';
import { useEffect, useState } from 'react';
import { ReactLenis } from 'lenis/react';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        setIsTouch(isTouchDevice);
    }, []);

    if (isTouch) {
        return <>{children}</>;
    }

    return (
        <ReactLenis
            root
            options={{
                lerp: 0.08,
                smoothWheel: true,
                syncTouch: false,
            }}
        >
            {children}
        </ReactLenis>
    );
}

