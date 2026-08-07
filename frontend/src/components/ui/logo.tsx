import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    showText?: boolean;
    textColorClass?: string;
}

export function Logo({ className = '', width = 220, height = 64, showText = true, textColorClass = 'text-primary' }: LogoProps) {
    return (
        <Link href="/" className={`flex items-center gap-2 sm:gap-3 ${className}`}>
            <Image
                src="/images/logo.svg"
                alt="Rebalance Therapy Logo"
                width={width}
                height={height}
                className="h-10 w-10 object-contain origin-left sm:h-12 sm:w-12 sm:scale-110 xl:scale-125"
                priority
            />
            {showText && <span className={`text-lg sm:text-2xl lg:text-3xl font-bold font-sans tracking-tight whitespace-nowrap ${textColorClass}`}>Rebalance Therapy</span>}
        </Link>
    );
}
