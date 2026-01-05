import React from 'react';
import { cn } from '../../utils';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
        primary: "bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-glow-primary hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-none",
        secondary: "bg-transparent border border-white/20 text-white/70 hover:bg-white/5 hover:border-white/30 hover:text-white transition-all duration-200",
        ghost: "bg-transparent border-none text-white/50 hover:text-white/80 transition-colors duration-200 p-0",
    };

    const sizes = {
        default: "px-8 py-4 rounded-xl text-base font-semibold",
        sm: "px-4 py-2 rounded-lg text-sm font-medium",
        lg: "px-10 py-5 rounded-2xl text-lg font-bold",
        icon: "p-2 rounded-lg",
    };

    // Ghost buttons usually don't have standard padding if they are just text links, 
    // but if they are actual buttons they might. The design system says "padding: 12px 0" for ghost.
    // Let's adjust based on variant.
    const variantStyles = variants[variant];
    const sizeStyles = variant === 'ghost' ? 'py-3 text-sm' : sizes[size];

    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
                variantStyles,
                sizeStyles,
                className
            )}
            {...props}
        />
    );
});

Button.displayName = "Button";

export { Button };
