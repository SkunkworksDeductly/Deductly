import React, { useEffect, useState } from 'react';
import { cn, scoreToPercent, getScoreColor } from '../../utils';

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
    const color = getScoreColor(score);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex justify-between text-[11px] text-white/30 mb-2 font-medium uppercase tracking-wider">
                <span>{min}</span>
                <span>{max}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full relative">
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-out"
                    style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${color}22, ${color})`
                    }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-100 ease-out z-10"
                    style={{ left: `${percent}%`, transform: `translate(-50%, -50%)` }}
                >
                    <div
                        className="absolute inset-0 rounded-full opacity-50 animate-ping"
                        style={{ backgroundColor: color }}
                    />
                </div>
            </div>
        </div>
    );
};

export { ScaleBar };
