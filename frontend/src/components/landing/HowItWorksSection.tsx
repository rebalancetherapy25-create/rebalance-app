'use client';
import { motion, useTransform, useSpring, type MotionValue } from 'framer-motion';
import { useScrollSection } from '@/hooks/useScrollSection';
import { StaggerContainer, StaggerItem } from '@/components/ui/Stagger';

function AnimatedConnectorLine({ progress }: { progress: MotionValue<number> }) {
    const scaleX = useTransform(progress, [0.12, 0.60], [0, 1]);
    const lineScaleX = useSpring(scaleX, { stiffness: 60, damping: 18, mass: 1 });
    return (
        <div className="hidden md:block absolute top-[24px] left-[16.67%] right-[16.67%] h-[2px] overflow-hidden">
            <motion.div
                style={{ scaleX: lineScaleX, transformOrigin: 'left' }}
                className="absolute inset-0 bg-white/60 rounded-full origin-left"
            />
        </div>
    );
}

// Each step is its own component so useTransform is called at component level (not in a loop)
// — mirrors the Word component pattern from StatementSection
function HowItWorksStep({
    step, title, desc, progress, start, end,
}: {
    step: string; title: string; desc: string;
    progress: MotionValue<number>; start: number; end: number;
}) {
    const opacity = useTransform(progress, [start, end], [0, 1]);
    const y = useTransform(progress, [start, end], [36, 0]);
    const scale = useTransform(progress, [start, end], [0.88, 1]);
    const circleScale = useTransform(progress, [start, start + 0.1], [0.6, 1]);
    const circleOpacity = useTransform(progress, [start, start + 0.08], [0, 1]);

    return (
        <motion.div
            style={{ opacity, y, scale }}
            className="flex md:flex-col gap-6 md:gap-8 items-start md:items-center text-left md:text-center relative z-10"
        >
            <motion.div
                style={{ scale: circleScale, opacity: circleOpacity }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-primary flex items-center justify-center shrink-0 font-bold text-xl md:text-2xl shadow-lg border-4 border-primary"
            >
                {step}
            </motion.div>
            <div className="pt-2 md:pt-0">
                <h3 className="font-bold text-white text-base md:text-xl mb-2">{title}</h3>
                <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xs">{desc}</p>
            </div>
        </motion.div>
    );
}

const STEPS = [
    { step: '1', title: 'Find your match', desc: 'Answer a few questions so we can match you with the right therapist.' },
    { step: '2', title: 'Book instantly', desc: 'Choose a time that works for you and book your session.' },
    { step: '3', title: 'Begin your session', desc: 'Join your session online and start feeling better.' },
];

// Step scroll windows: [0.15–0.4], [0.30–0.55], [0.45–0.70]
const STEP_WINDOWS: [number, number][] = [[0.15, 0.4], [0.30, 0.55], [0.45, 0.70]];

export function HowItWorksSection() {
    const { ref, scrollYProgress, reducedMotion } = useScrollSection(['start 0.9', 'end 0.3']);

    const rawTitleY = useTransform(scrollYProgress, [0, 0.2], [40, 0]);
    const rawTitleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
    const titleY = useSpring(rawTitleY, { stiffness: 100, damping: 20 });

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-12 md:py-16 px-6 bg-primary text-white rounded-t-3xl sm:rounded-none">
            <div className="container mx-auto max-w-5xl">

                {/* Title */}
                {reducedMotion ? (
                    <motion.h2
                        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-2xl md:text-4xl lg:text-5xl text-center font-display mb-12 md:mb-16 text-white text-balance"
                    >
                        Therapy in three simple <span className="italic text-white/90">steps</span>
                    </motion.h2>
                ) : (
                    <motion.h2
                        style={{ y: titleY, opacity: rawTitleOpacity }}
                        className="text-2xl md:text-4xl lg:text-5xl text-center font-display mb-12 md:mb-16 text-white text-balance"
                    >
                        Therapy in three simple <span className="italic text-white/90">steps</span>
                    </motion.h2>
                )}

                {/* Steps */}
                {reducedMotion ? (
                    <StaggerContainer className="grid md:grid-cols-3 gap-12 relative" stagger={0.15} delay={100}>
                        <div className="hidden md:block absolute top-[24px] left-[16.67%] right-[16.67%] h-[2px] bg-white/20" />
                        <div className="md:hidden absolute left-[23px] top-6 bottom-6 w-[2px] bg-white/20" />
                        {STEPS.map((item, i) => (
                            <StaggerItem key={i} className="flex md:flex-col gap-6 md:gap-8 items-start md:items-center text-left md:text-center relative z-10">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-primary flex items-center justify-center shrink-0 font-bold text-xl md:text-2xl shadow-lg border-4 border-primary">
                                    {item.step}
                                </div>
                                <div className="pt-2 md:pt-0">
                                    <h3 className="font-bold text-white text-base md:text-xl mb-2">{item.title}</h3>
                                    <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xs">{item.desc}</p>
                                </div>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                ) : (
                    <div className="grid md:grid-cols-3 gap-12 relative">
                        <AnimatedConnectorLine progress={scrollYProgress} />
                        <div className="md:hidden absolute left-[23px] top-6 bottom-6 w-[2px] bg-white/20" />
                        {STEPS.map((item, i) => (
                            <HowItWorksStep
                                key={i}
                                {...item}
                                progress={scrollYProgress}
                                start={STEP_WINDOWS[i][0]}
                                end={STEP_WINDOWS[i][1]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
