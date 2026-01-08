import React, { useState, useEffect } from 'react';

// Deductly Diagnostic Reveal Flow
// A Spotify Wrapped-inspired sequence for LSAT skill diagnostics

const mockUserData = {
  name: "Ani",
  estimatedScore: { low: 168, high: 172, point: 170 },
  questionsAnalyzed: 32,
  strongestSkill: {
    name: "Conditional Reasoning",
    score: 174,
    range: { low: 171, high: 177 },
    description: "You parse if-then structures with ease"
  },
  weakestSkill: {
    name: "Parallel Flaw",
    score: 152,
    range: { low: 146, high: 158 },
    description: "Matching argument structures under pressure"
  },
  skillClusters: [
    { name: "Conditional & Formal Logic", score: 174, range: { low: 171, high: 177 }, category: "LR" },
    { name: "Assumption Family", score: 168, range: { low: 164, high: 172 }, category: "LR" },
    { name: "Evidence & Arguments", score: 165, range: { low: 160, high: 170 }, category: "LR" },
    { name: "Inference & Must Be True", score: 167, range: { low: 162, high: 172 }, category: "LR" },
    { name: "Passage Comprehension", score: 171, range: { low: 167, high: 175 }, category: "RC" },
    { name: "Parallel & Structure", score: 152, range: { low: 146, high: 158 }, category: "LR" },
  ],
  projectedGain: 4,
  focusModule: "Parallel Reasoning Foundations",
  scaleMin: 120,
  scaleMax: 180
};

const Card = ({ children, className = "" }) => (
  <div className={`card ${className}`}>
    {children}
  </div>
);

// Card 1: Score Range Reveal
const ScoreRevealCard = ({ data, onNext }) => {
  const [revealed, setRevealed] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Approximate LSAT percentile from score (based on typical distributions)
  const getPercentile = (score) => {
    const percentiles = {
      180: 99.9, 179: 99.9, 178: 99.8, 177: 99.6, 176: 99.4,
      175: 99.2, 174: 98.9, 173: 98.4, 172: 97.8, 171: 97.0,
      170: 96.0, 169: 94.8, 168: 93.4, 167: 91.7, 166: 89.7,
      165: 87.4, 164: 84.8, 163: 82.0, 162: 78.9, 161: 75.5,
      160: 71.9, 159: 68.0, 158: 64.0, 157: 59.8, 156: 55.6,
      155: 51.3, 154: 47.0, 153: 42.8, 152: 38.7, 151: 34.8,
      150: 31.1, 149: 27.6, 148: 24.4, 147: 21.4, 146: 18.7,
      145: 16.2, 144: 14.0, 143: 12.0, 142: 10.2, 141: 8.7,
      140: 7.3, 135: 3.4, 130: 1.4, 125: 0.5, 120: 0.1
    };
    const nearest = Object.keys(percentiles)
      .map(Number)
      .sort((a, b) => Math.abs(a - score) - Math.abs(b - score))[0];
    return percentiles[nearest];
  };

  const midScore = Math.round((data.estimatedScore.low + data.estimatedScore.high) / 2);
  const percentile = getPercentile(midScore);

  return (
    <Card className="score-card">
      <p className="card-label">Based on {data.questionsAnalyzed} questions analyzed</p>
      
      <div className={`score-reveal ${revealed ? 'revealed' : ''}`}>
        <p className="score-intro">Your estimated LSAT range</p>
        <div className="score-range">
          <span className="score-number">{data.estimatedScore.low}</span>
          <span className="score-dash">—</span>
          <span className="score-number">{data.estimatedScore.high}</span>
        </div>
        <p className="percentile-text">Top {Math.round(100 - percentile)}% of test takers</p>
      </div>
      
      <button className="next-button" onClick={onNext}>
        See what's driving this →
      </button>
    </Card>
  );
};

// Helper to convert score to percentage position on 120-180 scale
const scoreToPercent = (score, min = 120, max = 180) => {
  return ((score - min) / (max - min)) * 100;
};

// Card 2: Strength Reveal
const StrengthCard = ({ data, onNext }) => {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const { score, range } = data.strongestSkill;
  const scorePercent = scoreToPercent(score);
  const rangeStartPercent = scoreToPercent(range.low);
  const rangeWidthPercent = scoreToPercent(range.high) - scoreToPercent(range.low);

  return (
    <Card className="strength-card">
      <p className="card-label">Your superpower</p>
      
      <div className="strength-content">
        <h2 className="skill-name">{data.strongestSkill.name}</h2>
        <p className="skill-description">{data.strongestSkill.description}</p>
        
        <div className="score-display">
          <span className="score-number strength">{score}</span>
          <span className="score-sublabel">skill level</span>
        </div>
        
        <div className="score-range-text">
          {range.low} – {range.high} estimated range
        </div>
        
        <div className="scale-container">
          <div className="scale-labels">
            <span>120</span>
            <span>150</span>
            <span>180</span>
          </div>
          <div className="scale-bar">
            <div 
              className="range-band strength-range"
              style={{ 
                left: animated ? `${rangeStartPercent}%` : '50%',
                width: animated ? `${rangeWidthPercent}%` : '0%'
              }}
            />
            <div 
              className="score-marker strength-marker"
              style={{ left: animated ? `${scorePercent}%` : '50%' }}
            />
          </div>
        </div>
      </div>
      
      <button className="next-button" onClick={onNext}>
        Now the hard truth →
      </button>
    </Card>
  );
};

// Card 3: Weakness Reveal (The shareable one)
const WeaknessCard = ({ data, onNext }) => {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const { score, range } = data.weakestSkill;
  const strongScore = data.strongestSkill.score;
  const scorePercent = scoreToPercent(score);
  const strongScorePercent = scoreToPercent(strongScore);
  const rangeStartPercent = scoreToPercent(range.low);
  const rangeWidthPercent = scoreToPercent(range.high) - scoreToPercent(range.low);
  const gap = strongScore - score;

  return (
    <Card className="weakness-card">
      <p className="card-label">What's holding you back</p>
      
      <div className="weakness-content">
        <h2 className="skill-name">{data.weakestSkill.name}</h2>
        <p className="skill-description">{data.weakestSkill.description}</p>
        
        <div className="score-display">
          <span className="score-number weak">{score}</span>
          <span className="score-sublabel">skill level</span>
        </div>
        
        <div className="score-range-text weak-range-text">
          {range.low} – {range.high} estimated range
        </div>
        
        <div className="scale-container">
          <div className="scale-labels">
            <span>120</span>
            <span>150</span>
            <span>180</span>
          </div>
          <div className="scale-bar">
            <div 
              className="range-band weakness-range"
              style={{ 
                left: animated ? `${rangeStartPercent}%` : '50%',
                width: animated ? `${rangeWidthPercent}%` : '0%'
              }}
            />
            <div 
              className="score-marker weakness-marker"
              style={{ left: animated ? `${scorePercent}%` : '50%' }}
            />
            <div 
              className="score-marker ghost-marker"
              style={{ left: animated ? `${strongScorePercent}%` : '50%' }}
            />
          </div>
        </div>
        
        <p className="gap-text">
          {gap} point gap from your strongest skill
        </p>
        
        <div className="share-prompt">
          <button className="share-button">
            Share your diagnostic
          </button>
        </div>
      </div>
      
      <button className="next-button" onClick={onNext}>
        Here's your plan →
      </button>
    </Card>
  );
};

// Card 4: The Plan
const PlanCard = ({ data, onNext }) => {
  return (
    <Card className="plan-card">
      <p className="card-label">Your path forward</p>
      
      <div className="plan-content">
        <div className="projection">
          <span className="projection-label">Closing this gap could add</span>
          <span className="projection-number">+{data.projectedGain}</span>
          <span className="projection-unit">points to your score</span>
        </div>
        
        <div className="module-recommendation">
          <p className="module-label">Start here</p>
          <h3 className="module-name">{data.focusModule}</h3>
          <p className="module-time">~90 min • Video + Targeted Drills</p>
        </div>
        
        <button className="start-button">
          Begin Module
        </button>
      </div>
      
      <button className="secondary-button" onClick={onNext}>
        Explore full skill breakdown
      </button>
    </Card>
  );
};

// Card 5: Full Skill Breakdown (the deep layer)
const BreakdownCard = ({ data }) => {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const sortedSkills = [...data.skillClusters].sort((a, b) => b.score - a.score);
  
  // Color based on LSAT scale position
  const getScoreColor = (score) => {
    if (score >= 170) return '#22c55e';
    if (score >= 160) return '#eab308';
    return '#ef4444';
  };
  
  return (
    <Card className="breakdown-card">
      <p className="card-label">Skill cluster breakdown</p>
      
      <div className="breakdown-header">
        <span className="overall-label">Overall estimate</span>
        <span className="overall-score">{data.estimatedScore.low}–{data.estimatedScore.high}</span>
      </div>
      
      <div className="breakdown-list">
        {sortedSkills.map((skill, index) => (
          <div 
            key={skill.name} 
            className={`skill-row ${animated ? 'animated' : ''}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="skill-info">
              <span className="skill-row-name">{skill.name}</span>
              <span className="skill-category">{skill.category}</span>
            </div>
            <div className="skill-scale-container">
              <div className="skill-scale-bar">
                <div 
                  className="skill-range-band"
                  style={{ 
                    left: animated ? `${scoreToPercent(skill.range.low)}%` : '50%',
                    width: animated ? `${scoreToPercent(skill.range.high) - scoreToPercent(skill.range.low)}%` : '0%',
                    backgroundColor: `${getScoreColor(skill.score)}33`
                  }}
                />
                <div 
                  className="skill-score-marker"
                  style={{ 
                    left: animated ? `${scoreToPercent(skill.score)}%` : '50%',
                    backgroundColor: getScoreColor(skill.score)
                  }}
                />
              </div>
            </div>
            <span className="skill-score" style={{ color: getScoreColor(skill.score) }}>
              {skill.score}
            </span>
          </div>
        ))}
      </div>
      
      <div className="scale-legend">
        <span>120</span>
        <span>150</span>
        <span>180</span>
      </div>
      
      <button className="start-button">
        Start Studying
      </button>
    </Card>
  );
};

// Progress dots
const ProgressDots = ({ current, total }) => (
  <div className="progress-dots">
    {Array.from({ length: total }, (_, i) => (
      <div 
        key={i} 
        className={`dot ${i === current ? 'active' : ''} ${i < current ? 'completed' : ''}`}
      />
    ))}
  </div>
);

// Main App
export default function DiagnosticReveal() {
  const [currentCard, setCurrentCard] = useState(0);
  
  const nextCard = () => setCurrentCard(prev => Math.min(prev + 1, 4));
  
  const cards = [
    <ScoreRevealCard key={0} data={mockUserData} onNext={nextCard} />,
    <StrengthCard key={1} data={mockUserData} onNext={nextCard} />,
    <WeaknessCard key={2} data={mockUserData} onNext={nextCard} />,
    <PlanCard key={3} data={mockUserData} onNext={nextCard} />,
    <BreakdownCard key={4} data={mockUserData} />
  ];

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .app-container {
          min-height: 100vh;
          background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d1117 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .app-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
                      radial-gradient(circle at 70% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 40%);
          pointer-events: none;
        }
        
        .card {
          width: 100%;
          max-width: 420px;
          min-height: 520px;
          background: linear-gradient(165deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 28, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          position: relative;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          animation: cardEnter 0.5s ease-out;
        }
        
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .card-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 32px;
          font-weight: 500;
        }
        
        /* Score Card */
        .score-card .score-reveal {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .score-card .score-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        .score-intro {
          font-family: 'Instrument Serif', serif;
          font-size: 20px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
          font-style: italic;
        }
        
        .score-range {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .score-number {
          font-family: 'Instrument Serif', serif;
          font-size: 72px;
          color: #fff;
          line-height: 1;
          text-shadow: 0 0 60px rgba(99, 102, 241, 0.4);
        }
        
        .score-dash {
          font-size: 48px;
          color: rgba(255, 255, 255, 0.3);
        }
        
        .percentile-text {
          font-size: 15px;
          color: rgba(99, 102, 241, 0.9);
          font-weight: 500;
        }
        
        /* Strength Card */
        .strength-card .strength-content,
        .weakness-card .weakness-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .skill-name {
          font-family: 'Instrument Serif', serif;
          font-size: 36px;
          color: #fff;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        
        .skill-description {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 32px;
          line-height: 1.5;
        }
        
        /* Score Display - LSAT Scale */
        .score-display {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .score-display .score-number {
          font-family: 'Instrument Serif', serif;
          font-size: 64px;
          line-height: 1;
        }
        
        .score-display .score-number.strength {
          color: #22c55e;
          text-shadow: 0 0 40px rgba(34, 197, 94, 0.4);
        }
        
        .score-display .score-number.weak {
          color: #ef4444;
          text-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
        }
        
        .score-sublabel {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: lowercase;
        }
        
        .score-range-text {
          font-size: 14px;
          color: rgba(34, 197, 94, 0.7);
          margin-bottom: 24px;
        }
        
        .score-range-text.weak-range-text {
          color: rgba(239, 68, 68, 0.7);
        }
        
        /* Scale visualization */
        .scale-container {
          margin-bottom: 20px;
        }
        
        .scale-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 8px;
          padding: 0 2px;
        }
        
        .scale-bar {
          height: 12px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          position: relative;
          overflow: visible;
        }
        
        .range-band {
          position: absolute;
          top: 0;
          height: 100%;
          border-radius: 6px;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .strength-range {
          background: rgba(34, 197, 94, 0.25);
        }
        
        .weakness-range {
          background: rgba(239, 68, 68, 0.25);
        }
        
        .score-marker {
          position: absolute;
          top: 50%;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .strength-marker {
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
        }
        
        .weakness-marker {
          background: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
        }
        
        .ghost-marker {
          background: transparent;
          border: 2px dashed rgba(34, 197, 94, 0.5);
          box-shadow: none;
        }

        .gap-text {
          font-size: 14px;
          color: rgba(239, 68, 68, 0.8);
          font-weight: 500;
          margin-top: 4px;
        }
        
        .share-prompt {
          margin-top: 24px;
        }
        
        .share-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          padding: 12px 24px;
          border-radius: 100px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        
        .share-button:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
        }
        
        /* Plan Card */
        .plan-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .projection {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .projection-label {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
        }
        
        .projection-number {
          font-family: 'Instrument Serif', serif;
          font-size: 80px;
          color: #a78bfa;
          line-height: 1;
          text-shadow: 0 0 60px rgba(167, 139, 250, 0.4);
        }
        
        .projection-unit {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 8px;
        }
        
        .module-recommendation {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .module-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(99, 102, 241, 0.8);
          margin-bottom: 8px;
        }
        
        .module-name {
          font-family: 'Instrument Serif', serif;
          font-size: 24px;
          color: #fff;
          margin-bottom: 8px;
        }
        
        .module-time {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .start-button {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }
        
        .start-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(99, 102, 241, 0.4);
        }
        
        /* Breakdown Card */
        .breakdown-card {
          min-height: 620px;
        }
        
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 16px 20px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        
        .overall-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .overall-score {
          font-family: 'Instrument Serif', serif;
          font-size: 28px;
          color: #fff;
        }
        
        .breakdown-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
          overflow-y: auto;
        }
        
        .skill-row {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          transform: translateX(-10px);
        }
        
        .skill-row.animated {
          animation: slideIn 0.4s ease-out forwards;
        }
        
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .skill-info {
          width: 130px;
          flex-shrink: 0;
        }
        
        .skill-row-name {
          display: block;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.3;
        }
        
        .skill-category {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .skill-scale-container {
          flex: 1;
        }
        
        .skill-scale-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          position: relative;
          overflow: visible;
        }
        
        .skill-range-band {
          position: absolute;
          top: 0;
          height: 100%;
          border-radius: 4px;
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .skill-score-marker {
          position: absolute;
          top: 50%;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .skill-score {
          width: 36px;
          text-align: right;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Instrument Serif', serif;
        }
        
        .scale-legend {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.25);
          padding: 0 130px 0 142px;
          margin-bottom: 20px;
        }
        
        /* Navigation */
        .next-button {
          margin-top: auto;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          cursor: pointer;
          padding: 12px 0;
          transition: color 0.2s ease;
          font-family: inherit;
        }
        
        .next-button:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .secondary-button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.6);
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        
        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
        }
        
        .progress-dots {
          display: flex;
          gap: 8px;
          margin-top: 24px;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
        }
        
        .dot.active {
          background: #6366f1;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
        }
        
        .dot.completed {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
      
      {cards[currentCard]}
      <ProgressDots current={currentCard} total={5} />
    </div>
  );
}
