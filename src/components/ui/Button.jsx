import React from 'react';
import { cn } from '../../utils';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
        primary: "bg-terracotta text-white shadow-soft hover:bg-terracotta/90 transition-all duration-200 border-none",
        secondary: "bg-sage-soft text-sage-dark border border-sage/20 hover:bg-sage-soft/80 transition-all duration-200",
        outline: "bg-transparent border border-sand-dark dark:border-white/20 text-text-main dark:text-white hover:bg-sand/50 dark:hover:bg-white/5 transition-all duration-200",
        ghost: "bg-transparent border-none text-text-main/60 dark:text-white/60 hover:text-terracotta transition-colors duration-200 p-0",
    };

    const sizes = {
        default: "px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest",
        sm: "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest",
        lg: "px-8 py-4 rounded-xl text-base font-bold uppercase tracking-widest",
        icon: "p-2 rounded-lg",
    };

    const variantStyles = variants[variant];
    const sizeStyles = variant === 'ghost' ? 'py-2 text-sm' : sizes[size];

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
