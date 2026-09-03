import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    imageClassName?: string;
    textClassName?: string;
    width?: number;
    height?: number;
    showText?: boolean;
    textColorClass?: string;
}

export function Logo({
    className = '',
    imageClassName = 'w-8 h-8 sm:w-9 sm:h-9',
    textClassName = 'text-base sm:text-lg font-bold',
    width = 36,
    height = 36,
    showText = true,
    textColorClass = 'text-primary'
}: LogoProps) {
    return (
        <Link href="/" className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
            <Image
                src="/images/logo.svg"
                alt="Rebalance Therapy Logo"
                width={width}
                height={height}
                className={`object-contain shrink-0 ${imageClassName}`}
                priority
            />
            {showText && (
                <span className={`${textClassName} font-sans tracking-tight whitespace-nowrap leading-none ${textColorClass}`}>
                    Rebalance Therapy
                </span>
            )}
        </Link>
    );
}
