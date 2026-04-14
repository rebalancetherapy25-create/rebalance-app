import * as React from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'rounded-[1.25rem] bg-[linear-gradient(110deg,rgba(96,58,72,0.08),rgba(255,255,255,0.86),rgba(96,58,72,0.08))] bg-[length:200%_100%] motion-safe:animate-[shimmer_1.8s_linear_infinite]',
                className,
            )}
            {...props}
        />
    );
}
