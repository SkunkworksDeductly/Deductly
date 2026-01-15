import React, { useEffect, useState } from 'react';
import { cn, scoreToPercent } from '../../utils';

const ScaleBar = ({ score, min = 120, max = 180, className }) => {
    const [animatedScore, setAnimatedScore] = useState(min);

    useEffect(() => {
        // Simple animation logic
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

            const current = min + (score - min) * ease;
            setAnimatedScore(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [score, min]);

    const percent = scoreToPercent(animatedScore, min, max);

    // Determine color based on ranges (example logic, can be refined)
    const getColor = (s) => {
        if (s >= 170) return '#5de619'; // Primary Green
        if (s >= 160) return '#81B29A'; // Sage
        if (s >= 150) return '#E07A5F'; // Terracotta
        return '#E07A5F';
    }

    const color = getColor(score);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex justify-between text-[10px] font-bold text-text-main/30 dark:text-white/30 mb-2 uppercase tracking-widest">
                <span>{min}</span>
                <span>{max}</span>
            </div>
            <div className="h-2 bg-sand-dark/20 dark:bg-white/10 rounded-full relative overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-out"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: color
                    }}
                />
            </div>
        </div>
    );
};

export { ScaleBar };
