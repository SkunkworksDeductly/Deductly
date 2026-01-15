import React from 'react';
import { cn } from '../../utils';

const Card = React.forwardRef(({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
        default: "bg-white dark:bg-white/5 border border-sand-dark/40 dark:border-white/10 shadow-sm",
        elevated: "bg-white dark:bg-white/5 border border-sand-dark/40 dark:border-white/10 shadow-soft hover:shadow-soft-xl transition-shadow duration-300",
        interactive: "bg-white dark:bg-white/5 border border-sand-dark/40 dark:border-white/10 shadow-sm hover:border-terracotta/50 cursor-pointer transition-colors duration-200",
        flat: "bg-sand/30 dark:bg-white/5 border border-sand-dark/20 dark:border-white/5",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-3xl p-6 md:p-8 overflow-hidden",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = "Card";

export { Card };
