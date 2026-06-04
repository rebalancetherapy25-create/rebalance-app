'use client';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Ease used throughout — ease-out-quart, feels snappy without overshooting
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

function buildVariants(direction: Direction, distance: number, duration: number): Variants {
    const from: Record<string, number> = {};
    if (direction === 'up')    from.y = distance;
    if (direction === 'down')  from.y = -distance;
    if (direction === 'left')  from.x = -distance;
    if (direction === 'right') from.x = distance;

    return {
        hidden: { opacity: 0, ...from },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration, ease: EASE },
        },
    };
}

interface AnimateInProps {
    children: React.ReactNode;
    className?: string;
    direction?: Direction;
    delay?: number;       // milliseconds
    duration?: number;    // seconds
    distance?: number;    // px
    once?: boolean;
}

export function AnimateIn({
    children,
    className,
    direction = 'up',
    delay = 0,
    duration = 0.65,
    distance = 44,
    once = true,
}: AnimateInProps) {
    const variants = buildVariants(direction, distance, duration);

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: '-56px' }}
            transition={{ delay: delay / 1000 }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
