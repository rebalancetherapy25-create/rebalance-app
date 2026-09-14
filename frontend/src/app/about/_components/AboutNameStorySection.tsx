export function AboutNameStorySection() {
    return (
        <section className="bg-primary px-6 py-24 sm:py-32 md:py-36 text-background relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div aria-hidden="true" className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent/10 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw] pointer-events-none" />
            
            <div className="container mx-auto max-w-7xl relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    {/* Left Column: Heading & Brand Badge */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="text-xs font-black uppercase tracking-widest text-accent/80">Our Purpose</div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[1.05] text-background tracking-tight">
                            The story behind the <span className="italic text-accent">NAME.</span>
                        </h2>
                    </div>

                    {/* Right Column: Narrative */}
                    <div className="lg:col-span-7 space-y-6 text-lg sm:text-xl text-background/85 font-medium leading-relaxed lg:pt-2">
                        <p className="border-l-2 border-accent/60 pl-5 sm:pl-6 text-background font-semibold">
                            The name &ldquo;ReBalance Therapy&rdquo; was inspired by the idea that life naturally moves through periods of imbalance. Stress, anxiety, burnout, grief, and personal struggles which can slowly pull people away from themselves, leaving them disconnected emotionally, mentally, and even physically.
                        </p>
                        <p className="pl-5 sm:pl-6 text-background/80">
                            Rather than focusing on &ldquo;fixing&rdquo; people, the founders wanted the brand to reflect the belief that healing is about gently finding your way back to balance, reconnecting with clarity, stability, and peace. The &ldquo;RE&rdquo; symbolises renewal, restoration, and rediscovery, the idea that no matter where someone is in their journey, they can always begin again. Combined with &ldquo;Balance,&rdquo; which represents a compassionate approach to therapy that supports individuals in rebuilding harmony within themselves and their lives.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
