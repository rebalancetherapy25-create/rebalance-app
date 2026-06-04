'use client';
import { useRef } from 'react';
import { useScroll, useReducedMotion, type MotionValue } from 'framer-motion';
import type { RefObject } from 'react';

// useScroll offset accepts very specific string literal unions — cast via unknown to avoid TS errors
// while still keeping runtime correctness.
type ScrollOffsetEntry = string;

export function useScrollSection(offset: [ScrollOffsetEntry, ScrollOffsetEntry] = ['start end', 'end start']): {
    ref: RefObject<HTMLElement>;
    scrollYProgress: MotionValue<number>;
    reducedMotion: boolean;
} {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        offset: offset as any,
    });
    const reducedMotion = useReducedMotion() ?? false;
    return { ref, scrollYProgress, reducedMotion };
}
