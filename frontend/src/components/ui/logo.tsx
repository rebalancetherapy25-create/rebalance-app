import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    showText?: boolean;
    textColorClass?: string;
}

export function Logo({ className = '', width = 180, height = 48, showText = true, textColorClass = 'text-primary' }: LogoProps) {
    return (
        <Link href="/" className={`flex items-center gap-2 ${className}`}>
            <Image
                src="/images/logo.svg"
                alt="Rebalance Therapy Logo"
                width={width}
                height={height}
                className="h-11 w-11 object-contain origin-center sm:h-16 sm:w-16 sm:scale-125 xl:scale-150"
                priority
            />
            {showText && <span className={`text-lg sm:text-3xl font-heading font-black tracking-tight ${textColorClass}`}>Rebalance Therapy</span>}
        </Link>
    );
}
