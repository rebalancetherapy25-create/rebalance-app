'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, ArrowLeft, Mail, Phone, HeartHandshake, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
    id: number;
    q: string;
    a: string;
    category: 'General' | 'Therapists' | 'Sessions' | 'Policies' | 'Safety';
}

const FAQ_LIST: FAQItem[] = [
    // General      
    { id: 1, category: 'General', q: "What is Rebalance Therapy?", a: "Rebalance Therapy is a modern therapy platform designed to make finding mental health support simple, approachable, and comfortable through carefully selected therapists and seamless online booking." },
    { id: 2, category: 'General', q: "How does Rebalance Therapy work?", a: "You can browse our network of therapists, choose the professional that feels right for you, and book sessions directly through our platform." },
    { id: 3, category: 'General', q: "Is therapy right for me?", a: "Therapy can help anyone navigating stress, anxiety, burnout, relationship challenges, life transitions, emotional overwhelm, or simply wanting personal growth and clarity." },
    { id: 4, category: 'General', q: "Do I need to be in crisis to start therapy?", a: "Not at all. Therapy is valuable for both difficult moments and everyday emotional wellbeing, self-awareness, and personal development." },
    { id: 30, category: 'General', q: "What if I’m unsure where to start?", a: "Our team is happy to guide you toward the right therapist or support option based on your needs." },
    { id: 32, category: 'General', q: "What makes Rebalance Therapy different?", a: "We focus on creating a calm, modern, and approachable therapy experience that removes the confusion and intimidation often associated with seeking mental health support." },

    // Therapists
    { id: 5, category: 'Therapists', q: "How do I choose the right therapist?", a: "You can explore therapist profiles based on their specialties, approaches, and experience. If you’re unsure, our team can guide you toward the best fit." },
    { id: 6, category: 'Therapists', q: "What if I don’t know what I’m feeling?", a: "That’s completely okay. You don’t need to have everything figured out before seeking support — therapy can help you understand your emotions better." },
    { id: 7, category: 'Therapists', q: "Are all therapists verified?", a: "Yes, every therapist on Rebalance Therapy is carefully reviewed and verified before joining our platform." },
    { id: 8, category: 'Therapists', q: "Can I switch therapists later?", a: "Absolutely. Finding the right connection matters, and you’re free to change therapists if you feel another professional may suit you better." },
    { id: 25, category: 'Therapists', q: "What issues can therapy help with?", a: "Therapy can support anxiety, stress, burnout, relationships, grief, low self-esteem, emotional overwhelm, work pressure, life transitions, and more." },
    { id: 26, category: 'Therapists', q: "What if I feel nervous before my first session?", a: "That’s completely normal. Many people feel unsure before starting therapy, and therapists are trained to create a comfortable, non-judgmental environment." },
    { id: 28, category: 'Therapists', q: "Do you offer couples therapy?", a: "Depending on therapist availability, couples or relationship therapy may also be offered." },
    { id: 38, category: 'Therapists', q: "Can therapists prescribe medication?", a: "No. Therapists on Rebalance Therapy do not prescribe medication, but they may recommend consulting a psychiatrist or medical professional if needed." },

    // Sessions
    { id: 9, category: 'Sessions', q: "Is online therapy effective?", a: "Yes. Many people find online therapy comfortable, flexible, and equally meaningful as in-person sessions." },
    { id: 10, category: 'Sessions', q: "Can I attend sessions from home?", a: "Yes, sessions can be attended comfortably from your own home or any private space where you feel safe and relaxed." },
    { id: 11, category: 'Sessions', q: "How do I book a session?", a: "Simply browse therapists, select your preferred time slot, and confirm your booking online." },
    { id: 12, category: 'Sessions', q: "How long is a therapy session?", a: "Most therapy sessions typically last between 45–60 minutes depending on the therapist and session type." },
    { id: 17, category: 'Sessions', q: "What happens during the first session?", a: "The first session is usually focused on understanding your concerns, goals, background, and what kind of support you’re looking for." },
    { id: 18, category: 'Sessions', q: "Do I have to turn my camera on?", a: "That depends on your comfort level and your therapist’s preferences, but most sessions work best with video enabled." },
    { id: 19, category: 'Sessions', q: "How often should I attend therapy?", a: "This varies from person to person. Some people attend weekly, while others prefer biweekly or monthly sessions." },
    { id: 20, category: 'Sessions', q: "Can I stop therapy anytime?", a: "Yes. Therapy is entirely your choice, and you can pause or stop whenever you feel ready." },
    { id: 29, category: 'Sessions', q: "Can students or working professionals use Rebalance Therapy?", a: "Absolutely. Our platform is designed to fit into modern lifestyles with flexible online sessions." },
    { id: 33, category: 'Sessions', q: "What if I’m running late for my session?", a: "If you join late, your session may still need to end at the originally scheduled time to respect the therapist’s availability and other appointments." },

    // Policies
    { id: 13, category: 'Policies', q: "Can I reschedule my therapy session?", a: "Yes, sessions can be rescheduled if requested at least 24 hours before your scheduled appointment time." },
    { id: 14, category: 'Policies', q: "Can I cancel my session and receive a refund?", a: "No, all bookings made through Rebalance Therapy are non-refundable once confirmed." },
    { id: 15, category: 'Policies', q: "What happens if I miss my session?", a: "Missed sessions or late cancellations may not be eligible for rescheduling or refunds, as your therapist has reserved that time specifically for you." },
    { id: 16, category: 'Policies', q: "How do I request a reschedule?", a: "To reschedule your session, please contact our support team at least 24 hours in advance via email at rebalancetherpy@gmail.com or call +91 9341210280." },
    { id: 39, category: 'Policies', q: "What happens if my therapist is unavailable?", a: "If a therapist is unexpectedly unavailable, our team will assist you with rescheduling or finding another suitable therapist where possible." },

    // Safety
    { id: 21, category: 'Safety', q: "Are my sessions confidential?", a: "Yes, confidentiality and emotional safety are extremely important to us and our therapists." },
    { id: 22, category: 'Safety', q: "Is my personal information secure?", a: "We take privacy seriously and handle personal information responsibly in line with our privacy practices." },
    { id: 23, category: 'Safety', q: "Will anyone know I’m using therapy?", a: "No. Your sessions and information remain private unless disclosure is legally required for safety reasons." },
    { id: 24, category: 'Safety', q: "Can I contact my therapist outside of sessions?", a: "No. To maintain professional boundaries and ensure the best quality of care, communication with therapists is limited to scheduled sessions only." },
    { id: 31, category: 'Safety', q: "How can I contact Rebalance Therapy?", a: "You can reach us anytime at [EMAIL_ADDRESS] or call +91 9341210280 for support and guidance." },
    { id: 34, category: 'Safety', q: "What happens if there are technical difficulties during my session?", a: "If technical issues interrupt your session, we’ll do our best to help reconnect you or coordinate with your therapist for the best possible resolution." },
    { id: 35, category: 'Safety', q: "What if my therapist believes I need urgent medical or psychiatric support?", a: "Therapists may recommend additional professional support, including psychiatric consultation or hospitalization, if they believe there is a serious risk to your safety or wellbeing." },
    { id: 36, category: 'Safety', q: "Is Rebalance Therapy a crisis or emergency service?", a: "No. Rebalance Therapy is not designed for emergency mental health situations. If you are experiencing a crisis or immediate danger, please contact local emergency services or a crisis support helpline immediately." },
    { id: 37, category: 'Safety', q: "What if I feel unsafe or emotionally distressed after a session?", a: "We encourage you to reach out to trusted emergency contacts, local healthcare providers, or emergency services if you require immediate support beyond therapy sessions." }
];

const CATEGORIES = ['All', 'General', 'Therapists', 'Sessions', 'Policies', 'Safety'] as const;
type Category = (typeof CATEGORIES)[number];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    // Toggles a single accordion item
    const toggleExpand = (id: number) => {
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(item => item !== id));
        } else {
            setExpandedIds([...expandedIds, id]);
        }
    };

    // Filter FAQs based on category select AND real-time query
    const filteredFAQs = useMemo(() => {
        return FAQ_LIST.filter(item => {
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.a.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen bg-[#FDFBFB] font-sans pb-24 relative overflow-x-hidden">
            
            {/* Premium Soft Background Mesh Glow */}
            <div className="absolute top-0 inset-x-0 h-[560px] bg-gradient-to-b from-[#FAF2F5]/90 via-[#FAF8F8]/50 to-transparent pointer-events-none -z-10" />

            {/* Back Button Navigation */}
            <div className="mx-auto max-w-4xl px-6 pt-24 sm:pt-28">
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline group">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Home
                </Link>
            </div>

            {/* Main Content Layout Container */}
            <main className="mx-auto max-w-4xl px-6 mt-6 sm:mt-10 space-y-10 relative z-10">
                
                {/* Editorial Heading */}
                <div className="space-y-4 text-center md:text-left border-b border-primary/5 pb-8">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-accent/15 text-primary border border-accent/20 font-medium text-[10px] sm:text-xs uppercase tracking-wider gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent fill-accent" />
                        Platform Knowledge Base
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground font-medium tracking-tight">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
                        Search or filter through our complete database of 39 frequently asked platform questions.
                    </p>
                </div>

                {/* Search & Categories Console Panel */}
                <div className="space-y-6">
                    {/* Floating Search Pill */}
                    <div className="relative w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-full overflow-hidden border border-primary/10 bg-white">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Type a keyword or question (e.g. refund, reschedule, privacy)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-6 bg-transparent text-sm sm:text-base font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none border-none focus:ring-0"
                        />
                    </div>

                    {/* Swipable Category Filters (Pills Selector) */}
                    <div className="flex overflow-x-auto pb-2 gap-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-nowrap w-full scroll-smooth">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 shadow-2xs border outline-none",
                                    selectedCategory === cat
                                        ? "bg-primary text-white border-primary shadow-xs"
                                        : "bg-white text-muted-foreground border-primary/15 hover:border-primary/30 hover:text-foreground"
                                )}
                            >
                                {cat === 'Safety' ? 'Safety & Help' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQs Expandable Accordions Stack */}
                <div className="space-y-3 pt-2">
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq) => {
                            const isExpanded = expandedIds.includes(faq.id);
                            return (
                                <div 
                                    key={faq.id}
                                    className="bg-white border border-primary/10 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-primary/20 transition-all duration-300 w-full"
                                >
                                    <button
                                        onClick={() => toggleExpand(faq.id)}
                                        className="w-full flex items-center justify-between text-left select-none outline-none focus:outline-none"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="w-5.5 h-5.5 rounded-md bg-primary/5 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                                Q
                                            </span>
                                            <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground leading-snug">
                                                {faq.q}
                                            </h4>
                                        </div>
                                        <span className={cn(
                                            "w-7 h-7 rounded-full bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-muted-foreground transition-all duration-300 shrink-0 ml-4",
                                            isExpanded ? "bg-accent/15 border-accent/20 text-accent" : "hover:bg-primary/5"
                                        )}>
                                            <ChevronRight className={cn(
                                                "w-4 h-4 transition-transform duration-300",
                                                isExpanded ? "rotate-90" : ""
                                            )} />
                                        </span>
                                    </button>

                                    {/* Expanded Answer with smooth entry */}
                                    {isExpanded && (
                                        <div className="mt-4 border-t border-primary/5 pt-3.5 pl-0 sm:pl-8.5 text-xs sm:text-sm leading-relaxed text-muted-foreground/80 font-semibold animate-in slide-in-from-top-1 duration-200">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        /* Empty Search State */
                        <div className="bg-white rounded-3xl p-10 border border-dashed border-primary/20 text-center space-y-4 shadow-2xs">
                            <ShieldAlert className="w-12 h-12 text-accent mx-auto animate-pulse" />
                            <h3 className="text-lg font-bold text-foreground">No questions found</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground font-semibold max-w-md mx-auto">
                                We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try browsing a specific category above or search using general keywords.
                            </p>
                        </div>
                    )}
                </div>

                {/* Additional Guidance Contact Block */}
                <div className="bg-accent/10 border border-accent/20 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xs">
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                            <HeartHandshake className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-foreground text-sm sm:text-base mb-1">Need personal support or guidance?</h3>
                            <p className="text-xs text-foreground/80 leading-relaxed font-semibold max-w-xl">
                                If you&apos;re unsure where to start, have questions about your billing, or need help matching with the right therapist, please contact our support concierge directly:
                            </p>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 pt-2">
                        <a href="mailto:rebalancetherpy@gmail.com" className="bg-white p-4.5 rounded-2xl border border-accent/15 hover:border-accent hover:shadow-xs transition-all flex items-center gap-4 group">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                                <Mail className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">Email Concierge</span>
                                <p className="text-xs sm:text-sm font-extrabold text-foreground mt-0.5 truncate">rebalancetherpy@gmail.com</p>
                            </div>
                        </a>
                        <a href="tel:+919341210280" className="bg-white p-4.5 rounded-2xl border border-accent/15 hover:border-accent hover:shadow-xs transition-all flex items-center gap-4 group">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF8F8] border border-border/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                                <Phone className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">Phone Support</span>
                                <p className="text-xs sm:text-sm font-extrabold text-foreground mt-0.5 truncate">+91 9341210280</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Footer Back Link */}
                <div className="pt-8 border-t border-primary/5 flex justify-between items-center text-xs text-muted-foreground font-semibold">
                    <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Home
                    </Link>
                    <span>© 2026 Rebalance Therapy. All rights reserved.</span>
                </div>          
            </main>
        </div>
    );
}
