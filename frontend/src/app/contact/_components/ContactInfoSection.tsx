'use client';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';

const CONTACT_INFO = [
    {
        icon: Mail,
        title: "Email Us",
        detail: "rebalancetherapy25@gmail.com",
        subtext: "We aim to reply within 24 hours.",
        link: "mailto:rebalancetherapy25@gmail.com"
    },
    {
        icon: Phone,
        title: "Call Us",
        detail: "+1 (800) 123-4567",
        subtext: "Mon-Fri from 8am to 6pm.",
        link: "tel:+18001234567"
    },
    {
        icon: MapPin,
        title: "Visit Us",
        detail: "123 Therapy Lane, Suite 100",
        subtext: "New York, NY 10001",
        link: "#"
    },
    {
        icon: Clock,
        title: "Office Hours",
        detail: "Monday – Friday",
        subtext: "8:00 AM – 8:00 PM EST",
        link: "#"
    }
];

export function ContactInfoSection() {
    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CONTACT_INFO.map((info, idx) => {
                const Icon = info.icon;
                return (
                    <motion.a 
                        key={idx}
                        href={info.link}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 + (idx * 0.1) }}
                        className="group relative flex flex-col p-8 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-primary/5 hover:shadow-2xl hover:border-white/80 transition-all duration-500 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-500">
                                <Icon className="w-6 h-6 text-accent" />
                            </div>
                            
                            <h3 className="text-xl font-normal text-foreground mb-2 font-display">{info.title}</h3>
                            <p className="text-lg text-foreground font-medium mb-1">{info.detail}</p>
                            <p className="text-sm text-muted-foreground">{info.subtext}</p>
                        </div>
                    </motion.a>
                );
            })}
        </div>
    );
}
