import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import PageLayout from '../../components/layout/PageLayout';

const sections = [
    {
        num: '01',
        title: 'Investment Philosophy',
        content: [
            'CapitalLens is designed as a decision-support framework for long-term investors focused on Indian equities.',
            'India represents a structurally growing economy with favorable demographic, consumption, and infrastructure tailwinds.',
            'The objective is to systematically identify durable compounders and avoid permanent capital impairment.',
        ],
        bullets: ['Business quality', 'Financial discipline', 'Structural price confirmation', 'Sector context', 'Qualitative risk validation'],
        closing: 'This system prioritizes consistency over excitement.',
    },
    {
        num: '02',
        title: 'Macro Context',
        label: 'INDIA-ADJUSTED THRESHOLDS',
        content: [
            "India's expected nominal GDP growth and moderate inflation environment influence the framework thresholds.",
        ],
        bullets: ['Nominal GDP growth expectations', 'Inflation pass-through capability', 'Cost of capital in emerging markets', 'Policy and regulatory sensitivity'],
        closing: 'A compounder in India should grow faster than the economy while maintaining capital discipline.',
    },
    {
        num: '03',
        title: 'Durable Business Quality',
        label: 'LAYER 1',
        content: ['The first filter evaluates whether a company possesses sustainable compounding characteristics.'],
        metrics: [
            { heading: 'Capital Efficiency', items: ['ROCE ≥ 20%', 'ROE ≥ 20%', 'Stable or rising over 5Y'] },
            { heading: 'Growth Quality', items: ['Sales CAGR ≥ 12–15%', 'Profit CAGR ≥ 15–18%', 'Exceeding nominal GDP'] },
            { heading: 'Balance Sheet', items: ['D/E ≤ 0.6', 'CFO/EBITDA ≥ 75%', 'Healthy interest coverage'] },
        ],
    },
    {
        num: '04',
        title: 'Valuation Discipline',
        label: 'LAYER 2',
        content: ['Quality alone does not justify any price.'],
        bullets: ['PE relative to 5-year historical range', 'PEG ≤ 1.5 (context-dependent)', 'Valuation justified by growth consistency'],
        closing: 'The framework favors reasonable entry points over chasing momentum.',
    },
    {
        num: '05',
        title: 'Structural Trend Confirmation',
        label: 'LAYER 3',
        content: ['Price is treated as confirmation, not prediction.'],
        bullets: ['Price above 200-day moving average', 'Upward-sloping long-term trend', 'Higher highs and higher lows', 'Positive relative strength vs index'],
        closing: 'The framework avoids initiating positions in structural downtrends.',
    },
    {
        num: '06',
        title: 'Sector & Capital Flow',
        label: 'LAYER 4',
        content: ['Even strong businesses are influenced by sector cycles.'],
        bullets: ['Sector relative strength vs index', 'Institutional flow trends', 'Policy or regulatory headwinds'],
        closing: 'Position sizing may be adjusted based on sector tailwinds or headwinds.',
    },
    {
        num: '07',
        title: 'Qualitative Risk Validation',
        label: 'LAYER 5 — AI-AUGMENTED',
        content: ['Financial metrics do not capture narrative shifts.'],
        bullets: ['Summarize management commentary', 'Detect tone changes across quarters', 'Identify capital allocation risks', 'Highlight emerging red flags'],
        closing: 'AI augments judgment but does not replace independent analysis.',
    },
    {
        num: '08',
        title: 'Position Sizing & Holding',
        content: ['Positions are initiated only when multiple layers align.'],
        bullets: ['Strong alignment → Full allocation', 'Sector weakness → Reduced allocation', 'Structural breakdown → No new entry'],
        closing: 'Designed for a 5–10 year holding horizon. Temporary volatility does not trigger exit. Structural deterioration does.',
    },
    {
        num: '09',
        title: 'What This Does Not Do',
        content: [],
        bullets: ['Predict short-term prices', 'Provide investment advice', 'Guarantee outcomes', 'Replace independent due diligence'],
        closing: 'It is a structured decision-support system.',
    },
    {
        num: '10',
        title: 'Core Principle',
        content: [
            'Buy high-quality Indian businesses at reasonable valuations, in confirmed structural uptrends, and hold them through volatility unless fundamentals deteriorate.',
        ],
        closing: 'Compounding requires discipline, not excitement.',
        isHighlight: true,
    },
];

function ProgressDots({ active, total, onDotClick }) {
    return (
        <div className="snap-dots">
            {Array.from({ length: total }).map((_, i) => (
                <button
                    key={i}
                    className={`snap-dot ${i === active ? 'active' : ''}`}
                    onClick={() => onDotClick(i)}
                    aria-label={`Go to section ${i + 1}`}
                />
            ))}
        </div>
    );
}

function SnapSection({ section }) {
    return (
        <div className="snap-section">
            {/* Ghost number */}
            <span className="section-number">{section.num}</span>

            <div className="snap-section-inner">
                {/* Label */}
                {section.label && (
                    <Typography
                        sx={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#06b6d4',
                            letterSpacing: '0.14em',
                            mb: 1,
                        }}
                    >
                        {section.label}
                    </Typography>
                )}

                {/* Title */}
                <Typography
                    sx={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        color: '#e8e8ed',
                        mb: 3,
                    }}
                >
                    {section.title}
                </Typography>

                {/* Content paragraphs */}
                {section.content?.map((para, i) => (
                    <Typography key={i} sx={{ fontSize: '1rem', color: '#8a8a9a', lineHeight: 1.8, mb: 2, maxWidth: 680 }}>
                        {para}
                    </Typography>
                ))}

                {/* Metrics grid (Layer 1) */}
                {section.metrics && (
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2 }}>
                        {section.metrics.map((m, i) => (
                            <Box
                                key={i}
                                sx={{
                                    flex: '1 1 240px',
                                    p: 2.5,
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#06b6d4', letterSpacing: '0.12em', mb: 1.5 }}>
                                    {m.heading.toUpperCase()}
                                </Typography>
                                {m.items.map((item, j) => (
                                    <Typography key={j} sx={{ fontSize: '0.9rem', color: '#8a8a9a', mb: 0.4 }}>
                                        {item}
                                    </Typography>
                                ))}
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Bullets */}
                {section.bullets && !section.metrics && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                        {section.bullets.map((b, i) => (
                            <Typography
                                key={i}
                                sx={{
                                    fontSize: '0.95rem',
                                    color: '#8a8a9a',
                                    mb: 0.8,
                                    pl: 2.5,
                                    position: 'relative',
                                    '&::before': {
                                        content: '"—"',
                                        position: 'absolute',
                                        left: 0,
                                        color: '#2a2a3e',
                                    },
                                }}
                            >
                                {b}
                            </Typography>
                        ))}
                    </Box>
                )}

                {/* Closing */}
                {section.closing && (
                    <Typography
                        sx={{
                            mt: 3,
                            fontSize: section.isHighlight ? '1.1rem' : '0.95rem',
                            fontWeight: section.isHighlight ? 600 : 500,
                            color: section.isHighlight ? '#e8e8ed' : '#5a5a6e',
                            fontStyle: section.isHighlight ? 'italic' : 'normal',
                            borderLeft: section.isHighlight ? '2px solid #06b6d4' : 'none',
                            pl: section.isHighlight ? 2.5 : 0,
                            maxWidth: 640,
                        }}
                    >
                        {section.closing}
                    </Typography>
                )}
            </div>
        </div>
    );
}

function MethodologyPage() {
    const containerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const scrollTop = container.scrollTop;
        const sectionHeight = container.clientHeight;
        const index = Math.round(scrollTop / sectionHeight);
        setActiveIndex(Math.min(index, sections.length - 1));
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const scrollToSection = (index) => {
        const container = containerRef.current;
        if (!container) return;
        const sectionHeight = container.clientHeight;
        container.scrollTo({ top: index * sectionHeight, behavior: 'smooth' });
    };

    return (
        <PageLayout fullBleed>
            {/* Hero snap section */}
            <div ref={containerRef} className="snap-container">
                {/* Hero */}
                <div className="snap-section">
                    <div className="snap-section-inner" style={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#5a5a6e', letterSpacing: '0.14em', mb: 2 }}>
                            METHODOLOGY
                        </Typography>
                        <Typography
                            className="gradient-text"
                            sx={{
                                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                fontWeight: 700,
                                letterSpacing: '-0.04em',
                                lineHeight: 1.05,
                            }}
                        >
                            Compounder
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                                fontWeight: 700,
                                letterSpacing: '-0.04em',
                                lineHeight: 1.05,
                                color: '#1e1e2e',
                            }}
                        >
                            Framework
                        </Typography>
                        <Typography sx={{ mt: 3, fontSize: '1rem', color: '#5a5a6e', maxWidth: 440, mx: 'auto' }}>
                            India-focused. Rule-based. Multi-layer.
                            Ten pillars that drive every decision.
                        </Typography>
                    </div>

                    <div className="scroll-hint">
                        <Typography sx={{ fontSize: '0.6rem', color: '#3a3a4e', letterSpacing: '0.15em' }}>
                            SCROLL
                        </Typography>
                        <div className="scroll-hint-line" />
                    </div>
                </div>

                {/* Content sections */}
                {sections.map((section) => (
                    <SnapSection key={section.num} section={section} />
                ))}

                {/* Footer section */}
                <div className="snap-section">
                    <div className="snap-section-inner" style={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#2a2a3e' }}>
                            &copy; 2026 CapitalLens. Systematic analysis for NSE equity markets.
                        </Typography>
                    </div>
                </div>
            </div>

            <ProgressDots
                active={activeIndex}
                total={sections.length + 2}
                onDotClick={scrollToSection}
            />
        </PageLayout>
    );
}

export default MethodologyPage;
