'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const WORDS = ['Your', 'feelings', 'matter,', 'and', "we're", 'here', 'to', 'help.'];

// Each word lives in its own component so useTransform is called at component level (not in a loop)
function Word({
    word,
    progress,
    start,
    end,
    italic,
    accent,
}: {
    word: string;
    progress: MotionValue<number>;
    start: number;
    end: number;
    italic?: boolean;
    accent?: boolean;
}) {
    const opacity = useTransform(progress, [start, end], [0.15, 1]);
    const y = useTransform(progress, [start, end], [8, 0]);

    return (
        <motion.span
            style={{ opacity, y, display: 'inline-block' }}
            className={`mr-[0.22em] ${italic ? 'italic' : ''} ${accent ? 'text-accent' : ''}`}
        >
            {word}
        </motion.span>
    );
}

export function StatementSection() {
    const ref = useRef<HTMLElement>(null);

    // Pin the scroll range across the full height of the section
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start 0.85', 'end 0.35'],
    });

    const segmentSize = 1 / WORDS.length;

    return (
        <section
            ref={ref}
            className="py-16 md:py-24 bg-white border-b border-border/30 text-center"
        >
            <div className="container mx-auto px-6 max-w-4xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-primary leading-tight tracking-tight text-balance">
                    {WORDS.map((word, i) => (
                        <Word
                            key={i}
                            word={word}
                            progress={scrollYProgress}
                            start={i * segmentSize}
                            end={(i + 1) * segmentSize}
                            italic={i >= 4}
                            accent={i >= 4}
                        />
                    ))}
                </h2>
            </div>
        </section>
    );
}
