import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, Phone } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms & Conditions | Rebalance',
    description: 'Review the Terms & Conditions and legal agreements for using Rebalance Therapy. Learn about booking rules, rescheduling policies, and telehealth consent.',
};

const LAST_UPDATED = 'May 14, 2026';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#FDFBFB] font-sans pb-24 relative overflow-x-hidden">
            
            {/* Soft Background Mesh Glow */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#FAF2F5]/90 via-[#FAF8F8]/50 to-transparent pointer-events-none -z-10" />

            {/* Back Button Navigation */}
            <div className="mx-auto max-w-4xl px-6 pt-24 sm:pt-28">
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline group">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Home
                </Link>
            </div>

            {/* Main Content Layout */}
            <main className="mx-auto max-w-4xl px-6 mt-6 sm:mt-10 space-y-12 relative z-10">
                
                {/* Editorial Header */}
                <div className="space-y-4 text-center md:text-left border-b border-primary/5 pb-8">
                    <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-accent/15 text-primary border border-accent/20 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                        Official Legal Policy
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-foreground font-medium tracking-tight">
                        Terms & Conditions
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
                        Last Updated: {LAST_UPDATED}
                    </p>
                </div>

                {/* Terms Sections */}
                <div className="space-y-10 leading-relaxed text-foreground/80 text-sm sm:text-base">
                    
                    {/* Section 1 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
                            Introduction
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            Welcome to Rebalance Therapy. By accessing our website, booking sessions, or using our services, you agree to comply with and be bound by the following Terms & Conditions. These terms constitute a legally binding agreement between you and Rebalance Therapy.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
                            About Rebalance Therapy
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            Rebalance Therapy is an online platform that connects individuals with independent mental health professionals and therapists. We act as a facilitator and do not provide clinical therapy services directly. The therapeutic relationship is strictly between the client and the independent professional.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
                            Eligibility & Jurisdictional Limits
                        </h2>
                        <div className="pl-0 sm:pl-10 text-muted-foreground font-medium space-y-3">
                            <p>By using our services, you confirm that:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You are at least 18 years old, or have express parental/guardian consent where applicable.</li>
                                <li>You are providing accurate, truthful, and complete registration information.</li>
                                <li><strong className="text-foreground">Jurisdiction:</strong> You are physically located in a region where the therapist is legally licensed to practice. You agree to disclose your location at the start of any session.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">4</span>
                            Booking, Rescheduling & Non-Refundable Policy
                        </h2>
                        <div className="pl-0 sm:pl-10 text-muted-foreground font-medium space-y-3">
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-foreground">Non-Refundable:</strong> All payments made through Rebalance Therapy are final and non-refundable.</li>
                                <li><strong className="text-foreground">Rescheduling:</strong> Sessions may be rescheduled only if requested at least 24 hours before the appointment. Requests made with less than 24 hours&apos; notice are ineligible for rescheduling.</li>
                                <li><strong className="text-foreground">No-Shows:</strong> Missed sessions without prior notice will not be refunded or rescheduled.</li>
                            </ul>
                        </div>  
                    </section>

                    {/* Section 5 (styled as an eye-catching warning block) */}
                    <section className="bg-accent/10 border border-accent/20 rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-accent text-white text-xs font-black flex items-center justify-center shrink-0">5</span>
                            MEDICAL & CRISIS DISCLAIMER
                        </h2>
                        <div className="space-y-4 text-xs sm:text-sm text-foreground/80 font-semibold leading-relaxed">
                            <p className="text-accent uppercase tracking-wider font-extrabold flex items-center gap-2">
                                <Bell className="w-4.5 h-4.5 animate-bounce shrink-0" />
                                Rebalance Therapy is NOT a crisis intervention or emergency service.
                            </p>
                            <p>
                                If you are experiencing suicidal thoughts, severe emotional distress, or a medical emergency, please seek immediate help. Do not wait for a telehealth appointment. Contact emergency numbers immediately:
                            </p>
                            <div className="grid sm:grid-cols-3 gap-4 pt-2">
                                <div className="bg-white p-4 rounded-2xl border border-accent/15 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Local Emergency</span>
                                    <span className="text-base font-extrabold text-foreground mt-1">112 or 100</span>
                                    <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">India Emergency Services</span>
                                </div>
                                <a href="tel:9999666555" className="bg-white p-4 rounded-2xl border border-accent/15 hover:border-accent hover:shadow-xs transition-all flex flex-col justify-between group">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider flex justify-between items-center">
                                        Vandrevala Helpline
                                        <Phone className="w-3 h-3 text-accent group-hover:scale-110 transition-transform" />
                                    </span>
                                    <span className="text-base font-extrabold text-foreground mt-1">9999 666 555</span>
                                    <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">24x7 Helpline Support</span>
                                </a>
                                <a href="tel:+919820466726" className="bg-white p-4 rounded-2xl border border-accent/15 hover:border-accent hover:shadow-xs transition-all flex flex-col justify-between group">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider flex justify-between items-center">
                                        Aasra 24x7 Helpline
                                        <Phone className="w-3 h-3 text-accent group-hover:scale-110 transition-transform" />
                                    </span>
                                    <span className="text-base font-extrabold text-foreground mt-1">+91 98204 66726</span>
                                    <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">Instant Call Responder</span>
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">6</span>
                            Communication & Professional Boundaries
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            <strong className="text-foreground">Off-Platform Communication:</strong> No therapist is permitted to meet or communicate with clients outside of scheduled sessions via personal phone, email, or social media. Rebalance Therapy strictly prohibits &ldquo;dual relationships&rdquo; (social, business, or personal connections outside of therapy) to maintain the highest professional, objective, and ethical standards of care.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">7</span>
                            Informed Consent for Telehealth
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            By booking a session, you provide informed consent for telehealth services. You acknowledge that while telehealth is highly convenient, it has inherent limitations compared to in-person therapy, including potential technical disruptions and the absence of physical presence. You agree to use a private, secure environment for all video and voice consultations.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">8</span>
                            Confidentiality & Mandatory Reporting
                        </h2>
                        <div className="pl-0 sm:pl-10 text-muted-foreground font-medium space-y-3">
                            <p>Information shared during clinical sessions is treated as strictly confidential. However, you acknowledge that confidentiality is legally and ethically limited in the following circumstances:</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>If there is a risk of imminent, severe harm to yourself or to others.</li>
                                <li>In cases of suspected child, elder, or dependent adult abuse.</li>
                                <li>If required by a valid, legally binding court order or legal mandate.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">9</span>
                            Therapist Credentials
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            Rebalance  Therapy performs reasonable verification of the professional licenses and credentials of therapists during their onboarding. However, the responsibility for specific clinical advice, treatment programs, and therapeutic outcomes remains solely with the independent therapist.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">10</span>
                            Technical Requirements & Liability
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            Clients are responsible for maintaining a stable internet connection and compatible device. Rebalance Therapy is not liable for session interruptions caused by technical failures or device malfunctions. Our liability is strictly limited to the platform&apos;s booking facilitation and does not extend to clinical outcomes or dissatisfaction with specific therapy advice.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="space-y-3.5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">11</span>
                            Data Protection
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            We comply with applicable data protection laws. While we facilitate digital video and voice connections, clinical notes and medical records are maintained solely by the independent therapists in accordance with their professional obligations and local health data regulations.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="space-y-5 pt-4 border-t border-primary/5">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">12</span>
                            Contact Us
                        </h2>
                        <p className="pl-0 sm:pl-10 text-muted-foreground font-medium">
                            If you have any questions regarding these Terms & Conditions, please contact us directly:
                        </p>
                        <div className="pl-0 sm:pl-10 grid sm:grid-cols-2 gap-4">
                            <a href="mailto:rebalancetherapy25@gmail.com" className="bg-[#FAF8F8] p-5 rounded-2xl border border-primary/5 hover:border-primary/20 hover:shadow-xs transition-all flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Email Inquiry</span>
                                    <p className="text-sm font-extrabold text-foreground mt-0.5 truncate">rebalancetherapy25@gmail.com</p>
                                </div>
                            </a>
                            <a href="tel:+919341210280" className="bg-[#FAF8F8] p-5 rounded-2xl border border-primary/5 hover:border-primary/20 hover:shadow-xs transition-all flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Direct Dial</span>
                                    <p className="text-sm font-extrabold text-foreground mt-0.5 truncate">+91 9341210280</p>
                                </div>
                            </a>
                        </div>
                    </section>

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
