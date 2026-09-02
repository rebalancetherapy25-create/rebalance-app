'use client';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/ui/Stagger';

const STEPS = [
    { step: '1', title: 'Find your match', desc: 'Answer a few questions so we can match you with the right therapist.' },
    { step: '2', title: 'Book instantly', desc: 'Choose a time that works for you and book your session.' },
    { step: '3', title: 'Begin your session', desc: 'Join your session online and start feeling better.' },
];

export function HowItWorksSection() {
    return (
        <section className="py-12 md:py-16 px-6 bg-primary text-white rounded-t-3xl sm:rounded-none">
            <div className="container mx-auto max-w-5xl">

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl md:text-4xl lg:text-5xl text-center font-display mb-12 md:mb-16 text-white text-balance"
                >
                    Therapy in three simple <span className="italic text-white/90">steps</span>
                </motion.h2>

                {/* Steps */}
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
            </div>
        </section>
    );
}

