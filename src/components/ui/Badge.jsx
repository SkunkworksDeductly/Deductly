import React from 'react';
import { cn } from '../../utils';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-sand-dark/20 text-text-main dark:text-white border-sand-dark/30",
        primary: "bg-terracotta-soft text-terracotta border-terracotta/20",
        success: "bg-sage-soft text-sage border-sage/20",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-200", // Keep standard warning for now if no custom token
        danger: "bg-red-50 text-red-600 border-red-200",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});

Badge.displayName = "Badge";

export { Badge };
