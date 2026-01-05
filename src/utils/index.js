import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const scoreToPercent = (score, min = 120, max = 180) => {
    return ((score - min) / (max - min)) * 100;
};

export const getScoreColor = (score) => {
    if (score >= 170) return '#22c55e';
    if (score >= 160) return '#eab308';
    return '#ef4444';
};
