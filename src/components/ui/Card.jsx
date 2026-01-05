import React from 'react';
import { cn } from '../../utils';

const Card = React.forwardRef(({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
        default: "bg-card-gradient border border-white/10 shadow-xl backdrop-blur-xl",
        elevated: "bg-card-gradient border border-white/10 shadow-2xl backdrop-blur-xl hover:scale-[1.01] transition-transform duration-300",
        interactive: "bg-card-gradient border border-white/10 shadow-xl backdrop-blur-xl hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer",
        featured: "bg-card-gradient border border-white/10 shadow-xl backdrop-blur-xl border-t-brand-primary/50",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-3xl p-8 animate-card-enter relative overflow-hidden",
                variants[variant],
                className
            )}
            {...props}
        >
            {/* Inner glow effect for all cards */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-50" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
});

Card.displayName = "Card";

export { Card };
