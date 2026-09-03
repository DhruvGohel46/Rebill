import React, { useRef, useState, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import DynamicAiMascot from '../common/DynamicAiMascot';

/**
 * AiHeaderButton
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom Keyhole / Matchstick Silhouette Button:
 *  • Strictly Zero-Header-Impact: Layout height is locked to 38px (matching
 *    standard header buttons), with zero margin and zero padding expansion.
 *  • Prominent Circular Head: 40px circular orb with enlarged 26px AI mascot face.
 *  • Sleek Horizontal Stem: 26px stem height, perfectly centered.
 *  • Single continuous closed SVG path matching the user's sketch.
 */
const AiHeaderButton = ({ onClick, isDark = true }) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(205);
    const [hovered, setHovered] = useState(false);

    useLayoutEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    }, []);

    // ── Geometry calculations: locked to 38px layout height ──
    const centerY = 19; // Center of standard 38px button height
    const circleR = 20; // 40px diameter orb (bulges slightly past 38px with overflow: visible)
    const stemHalfH = 13; // Stem height = 26px (from y=6 to y=32)
    const rightR = 13; // Rounded right end cap
    const w = Math.max(width, 185);

    // Intersection X where horizontal stem lines meet the circular orb
    // (x - 19)^2 + 13^2 = 20^2 => x = 19 + sqrt(400 - 169) ≈ 34.20
    const joinX = (19 + Math.sqrt(circleR * circleR - stemHalfH * stemHalfH)).toFixed(2);
    const topY = centerY - stemHalfH; // 6
    const botY = centerY + stemHalfH; // 32
    const rightCapX = (w - rightR - 2).toFixed(2);
    const rightApexX = (w - 2).toFixed(2);

    // Continuous outline path
    const outlinePath = `
        M ${joinX} ${topY}
        L ${rightCapX} ${topY}
        A ${rightR} ${rightR} 0 0 1 ${rightApexX} ${centerY}
        A ${rightR} ${rightR} 0 0 1 ${rightCapX} ${botY}
        L ${joinX} ${botY}
        A ${circleR} ${circleR} 0 1 1 ${joinX} ${topY}
        Z
    `.trim();

    return (
        <motion.button
            ref={containerRef}
            id="header-ai-btn"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            title="Ask Your Business AI"
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                height: '38px', // Fixed standard 38px button height (never stretches header)
                maxHeight: '38px',
                padding: '0 14px 0 0',
                margin: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                color: '#F97316',
                outline: 'none',
            }}
        >
            {/* ── CONTINUOUS OUTLINE SVG BACKGROUND ── */}
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible', // Allows 40px circle to render cleanly without pushing layout
                    pointerEvents: 'none',
                }}
            >
                <path
                    d={outlinePath}
                    fill={hovered
                        ? (isDark ? 'rgba(249, 115, 22, 0.22)' : 'rgba(255, 237, 213, 0.95)')
                        : (isDark ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 247, 237, 0.85)')
                    }
                    stroke={hovered ? '#FB923C' : 'rgba(249, 115, 22, 0.45)'}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{
                        filter: hovered
                            ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.45))'
                            : 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.20))',
                        transition: 'all 0.18s ease',
                    }}
                />
            </svg>

            {/* ── PROMINENT CIRCULAR ORB WITH ENLARGED AI MASCOT ── */}
            <div
                style={{
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Enlarged AI face by 1.2x (from 26px to 31px) */}
                <DynamicAiMascot size={31} glow={true} />
            </div>

            {/* ── STEM CONTENT (BUTTON LABEL) ── */}
            <span
                style={{
                    fontWeight: 650,
                    fontSize: '13px',
                    letterSpacing: '0.01em',
                    color: '#F97316',
                    whiteSpace: 'nowrap',
                    paddingLeft: '3px',
                    paddingRight: '6px',
                    position: 'relative',
                    zIndex: 1,
                    userSelect: 'none',
                }}
            >
                Ask Your Business AI
            </span>
        </motion.button>
    );
};

export default AiHeaderButton;
