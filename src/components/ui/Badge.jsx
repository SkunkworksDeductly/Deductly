import React from 'react';
import { cn } from '../../utils';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-brand-primary/10 border-brand-primary/20 text-brand-tertiary",
        success: "bg-green-500/15 border-green-500/30 text-green-400",
        warning: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
        danger: "bg-red-500/15 border-red-500/30 text-red-400",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-medium tracking-wide",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});

Badge.displayName = "Badge";

export { Badge };
