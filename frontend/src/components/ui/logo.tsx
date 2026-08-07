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
        <Link href="/" className={`flex items-center gap-3 ${className}`}>
            <Image
                src="/images/logo.svg"
                alt="Rebalance Therapy Logo"
                width={width}
                height={height}
                className="h-14 w-14 object-contain origin-center sm:h-20 sm:w-20 sm:scale-125 xl:scale-150"
                priority
            />
            {showText && <span className={`text-2xl sm:text-4xl font-bold font-sans tracking-tight ${textColorClass}`}>Rebalance Therapy</span>}
        </Link>
    );
}
