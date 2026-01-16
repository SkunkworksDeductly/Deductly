import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScaleBar } from '../components/ui/ScaleBar';

const DesignDemo = () => {
    const [score, setScore] = useState(158);

    return (
        <div className="min-h-screen bg-bg-primary font-sans text-text-primary selection:bg-sage/30 selection:text-white overflow-x-hidden p-8">
            <div className="max-w-6xl mx-auto space-y-16">

                {/* Header */}
                <header className="text-center space-y-6">
                    <Badge variant="default">Design System v2.0</Badge>
                    <h1 className="font-display text-6xl md:text-8xl text-white">
                        Dark <span className="text-sage italic">Editorial</span>
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        A sophisticated diagnostic tool that feels approachable, not clinical.
                        High-end magazine meets data visualization.
                    </p>
                </header>

                {/* Components Grid */}
                <div className="grid md:grid-cols-2 gap-12">

                    {/* Buttons Section */}
                    <section className="space-y-8">
                        <h2 className="font-display text-3xl text-white border-b border-white/10 pb-4">Buttons</h2>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="primary">Primary Action</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="ghost">Ghost Button</Button>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="primary" size="sm">Small</Button>
                            <Button variant="primary" size="default">Default</Button>
                            <Button variant="primary" size="lg">Large</Button>
                        </div>
                    </section>

                    {/* Badges Section */}
                    <section className="space-y-8">
                        <h2 className="font-display text-3xl text-white border-b border-white/10 pb-4">Badges</h2>
                        <div className="flex flex-wrap gap-4">
                            <Badge variant="default">Default Badge</Badge>
                            <Badge variant="success">Success</Badge>
                            <Badge variant="warning">Warning</Badge>
                            <Badge variant="danger">Danger</Badge>
                        </div>
                    </section>
                </div>

                {/* Cards Section */}
                <section className="space-y-8">
                    <h2 className="font-display text-3xl text-white border-b border-white/10 pb-4">Cards</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <h3 className="font-display text-2xl mb-2">Default Card</h3>
                            <p className="text-text-secondary">Standard card for grouping content. Subtle gradient and border.</p>
                        </Card>
                        <Card variant="elevated">
                            <h3 className="font-display text-2xl mb-2">Elevated Card</h3>
                            <p className="text-text-secondary">Higher elevation, scales slightly on hover. Good for featured content.</p>
                        </Card>
                        <Card variant="interactive">
                            <h3 className="font-display text-2xl mb-2">Interactive Card</h3>
                            <p className="text-text-secondary">Clickable card with hover effects. Border highlight and lift.</p>
                        </Card>
                    </div>
                </section>

                {/* Data Visualization Section */}
                <section className="space-y-8">
                    <h2 className="font-display text-3xl text-white border-b border-white/10 pb-4">Data Visualization</h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <Card className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-text-muted text-sm uppercase tracking-wider font-bold mb-1">Current Score</div>
                                    <div className="font-display text-6xl">{score}</div>
                                </div>
                                <Badge variant={score >= 160 ? 'success' : 'warning'}>
                                    {score >= 160 ? 'On Track' : 'Needs Work'}
                                </Badge>
                            </div>

                            <ScaleBar score={score} />

                            <div className="pt-4 flex gap-4">
                                <Button size="sm" variant="secondary" onClick={() => setScore(Math.max(120, score - 5))}>-5</Button>
                                <Button size="sm" variant="secondary" onClick={() => setScore(Math.min(180, score + 5))}>+5</Button>
                            </div>
                        </Card>

                        <Card variant="featured" className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-sage/10 blur-[100px] rounded-full pointer-events-none" />
                            <h3 className="font-display text-3xl mb-4 relative z-10">Logical Reasoning</h3>
                            <p className="text-text-secondary mb-6 relative z-10">
                                Your strongest section. You're performing in the top 15% of students.
                            </p>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-2xl font-display mb-1">85%</div>
                                    <div className="text-xs text-text-muted uppercase tracking-wider">Accuracy</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-2xl font-display mb-1">1:24</div>
                                    <div className="text-xs text-text-muted uppercase tracking-wider">Avg Time</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Typography Scale */}
                <section className="space-y-8 pb-20">
                    <h2 className="font-display text-3xl text-white border-b border-white/10 pb-4">Typography</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 items-baseline gap-4">
                            <span className="text-text-muted text-sm">Display XL</span>
                            <span className="font-display text-7xl md:col-span-3">Instrument Serif</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-baseline gap-4">
                            <span className="text-text-muted text-sm">Display L</span>
                            <span className="font-display text-5xl md:col-span-3">The quick brown fox</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-baseline gap-4">
                            <span className="text-text-muted text-sm">Display M</span>
                            <span className="font-display text-4xl md:col-span-3">Jumps over the lazy dog</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-baseline gap-4">
                            <span className="text-text-muted text-sm">Body L</span>
                            <span className="text-xl md:col-span-3">Deductly's design communicates intelligence without intimidation.</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 items-baseline gap-4">
                            <span className="text-text-muted text-sm">Body M</span>
                            <span className="text-base md:col-span-3">We're a sophisticated diagnostic tool that feels approachable, not clinical. The aesthetic is dark editorial—think high-end magazine meets data visualization.</span>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default DesignDemo;
