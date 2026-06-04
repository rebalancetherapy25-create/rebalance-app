'use client';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    stagger?: number;    // seconds between children
    delay?: number;      // ms initial delay
    once?: boolean;
}

export function StaggerContainer({
    children,
    className,
    stagger = 0.12,
    delay = 0,
    once = true,
}: StaggerContainerProps) {
    const variants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: stagger,
                delayChildren: delay / 1000,
            },
        },
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: '-56px' }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}

interface StaggerItemProps {
    children: React.ReactNode;
    className?: string;
    distance?: number;
}

export function StaggerItem({ children, className, distance = 36 }: StaggerItemProps) {
    const variants: Variants = {
        hidden: { opacity: 0, y: distance },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: EASE },
        },
    };

    return (
        <motion.div variants={variants} className={cn(className)}>
            {children}
        </motion.div>
    );
}
