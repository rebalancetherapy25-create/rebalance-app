'use client';
import { motion } from 'framer-motion';

const values = [
    {
        step: '01',
        title: "Our Mission",
        desc: "Our mission is to make mental health support feel approachable, safe, and deeply human. We are committed to removing the fear, confusion, and stigma often associated with therapy by creating a calm, modern, and accessible experience for everyone seeking support."
    },
    {
        step: '02',
        title: "Our Philosophy",
        desc: "We believe therapy is not only for moments of crisis it is a space for growth, self-awareness, healing, and balance. At ReBalance Therapy, we focus on creating meaningful therapeutic relationships where clients feel heard without judgment and supported at every step of their journey."
    },
    {
        step: '03',
        title: "Our Values",
        desc: "At ReBalance Therapy, we value authenticity, meaningful human connection, and creating experiences that feel calm, intentional, and deeply personal. We are committed to building a modern approach to therapy that prioritises trust, simplicity, and a sense of comfort from the very first interaction."
    }
];

export function AboutValuesSection() {
    return (
        <section className="bg-primary px-4 py-32 sm:px-6 sm:py-48 text-background relative overflow-hidden">
            {/* Ambient Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
            
            <div className="container mx-auto max-w-7xl relative z-10">
                <div className="mb-24 md:mb-40 text-center">
                 

                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-display text-background leading-[0.9] tracking-tight"
                    >
                        Who we <span className="text-accent italic">are.</span>
                    </motion.h2>
                </div>

                <div className="space-y-32 md:space-y-48">
                    {values.map((value, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className={`relative flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 lg:gap-24`}
                        >
                            {/* Giant Background Number / Foreground Element */}
                            <div className="w-full md:w-1/2 relative flex justify-center items-center">
                                <span className="text-[15rem] sm:text-[20rem] lg:text-[25rem] leading-none font-display font-light text-white/5 select-none absolute">
                                    {value.step}
                                </span>
                                <h3 className="text-4xl sm:text-5xl md:text-6xl font-display text-white relative z-10 drop-shadow-xl text-center md:text-left">
                                    {value.title}
                                </h3>
                            </div>
                            
                            <div className="w-full md:w-1/2 relative z-10">
                                <p className="text-lg sm:text-xl md:text-2xl text-background/80 leading-relaxed font-medium">
                                    {value.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
