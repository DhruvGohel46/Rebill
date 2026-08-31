import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * DynamicAiMascot - Premium AI Character Avatar for InfoOS AI
 * 
 * Design Specifications:
 * - Outer shape: Rounded irregular/wavy organic squircle-circle, smooth curves, no ears
 * - Eyes: Optically positioned at Y=88 with dynamic micro-glance & blinking
 * - Nose: Small organic curved nose centered at Y=107
 * - Mouth: Small gentle curved smile at Y=126
 * - Equal visual spacing: Eyes (88) → Nose (107) → Mouth (126) [19px equal delta]
 * - No hair line on forehead
 * - Optically centered AI character avatar aesthetic
 * - Signature warm orange gradient & velvet glow
 */

// Distinct, smooth organic curvy outer contour (smooth continuous waves, no ears)
const ORGANIC_WAVY_SHAPE = 'M 100 16 C 114 16, 120 28, 128 34 C 136 40, 150 34, 160 41 C 170 48, 164 62, 167 73 C 170 84, 184 90, 184 100 C 184 110, 170 116, 167 127 C 164 138, 170 152, 160 159 C 150 166, 136 160, 128 166 C 120 172, 114 184, 100 184 C 86 184, 80 172, 72 166 C 64 160, 50 166, 40 159 C 30 152, 36 138, 33 127 C 30 116, 16 110, 16 100 C 16 90, 30 84, 33 73 C 36 62, 30 48, 40 41 C 50 34, 64 40, 72 34 C 80 28, 86 16, 100 16 Z';

export default function DynamicAiMascot({
  size = 24,
  state = 'idle', // 'idle' | 'hover' | 'thinking' | 'speaking' | 'listening' | 'happy' | 'alert'
  interactive = true,
  primaryColor = '#FF6B1A',
  secondaryColor = '#FF8A3D',
  glow = false,
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const containerRef = useRef(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [talkFrame, setTalkFrame] = useState(0);

  // Eye gaze offsets (dx, dy)
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  // Effective state combining hover and explicit state
  const currentState = isHovered && state === 'idle' ? 'hover' : state;

  // ── Natural Autonomous Blinking ──────────────────────────────────────────
  useEffect(() => {
    let blinkTimeout;
    let doubleBlinkTimeout;

    const triggerBlink = () => {
      if (currentState === 'happy') {
        scheduleNextBlink();
        return;
      }

      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);

        // 25% chance of playful double blink
        if (Math.random() < 0.25) {
          doubleBlinkTimeout = setTimeout(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 90);
          }, 110);
        }
      }, 120);

      scheduleNextBlink();
    };

    const scheduleNextBlink = () => {
      const delay = 2200 + Math.random() * 2800;
      blinkTimeout = setTimeout(triggerBlink, delay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(doubleBlinkTimeout);
    };
  }, [currentState]);

  // ── Mouse & Cursor Gaze Tracking ─────────────────────────────────────────
  useEffect(() => {
    if (!interactive) return;

    let idleGazeTimer;

    const scheduleIdleGaze = () => {
      const delays = [2000, 3200, 4000];
      const randomDelay = delays[Math.floor(Math.random() * delays.length)];

      idleGazeTimer = setTimeout(() => {
        if (currentState === 'thinking') {
          setGaze({ x: 2.2, y: -2.8 });
        } else if (currentState === 'speaking') {
          setGaze({ x: (Math.random() - 0.5) * 1.8, y: (Math.random() - 0.5) * 1.2 });
        } else if (currentState === 'idle') {
          const glances = [
            { x: 0, y: 0 },
            { x: -1.8, y: 0.4 },
            { x: 1.8, y: -0.4 },
            { x: 0, y: -1.5 },
            { x: 1.2, y: 1.0 },
            { x: 0, y: 0 },
          ];
          const chosen = glances[Math.floor(Math.random() * glances.length)];
          setGaze(chosen);
        }
        scheduleIdleGaze();
      }, randomDelay);
    };

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      if (currentState === 'thinking') return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const diffX = e.clientX - centerX;
      const diffY = e.clientY - centerY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);

      if (distance < 750) {
        const maxOffset = 3.2;
        const normX = Math.max(-1, Math.min(1, diffX / 280));
        const normY = Math.max(-1, Math.min(1, diffY / 280));

        setGaze({
          x: normX * maxOffset,
          y: normY * maxOffset * 0.85,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    scheduleIdleGaze();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(idleGazeTimer);
    };
  }, [interactive, currentState]);

  // ── Talking Mouth Oscillation ────────────────────────────────────────────
  useEffect(() => {
    if (currentState !== 'speaking') return;
    const interval = setInterval(() => {
      setTalkFrame((prev) => (prev + 1) % 4);
    }, 170);
    return () => clearInterval(interval);
  }, [currentState]);

  // ── Thinking State Gaze ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentState === 'thinking') {
      setGaze({ x: 2.2, y: -2.8 });
    }
  }, [currentState]);

  const gradientId = useMemo(() => `ai_mascot_grad_${Math.random().toString(36).substr(2, 7)}`, []);
  const bgGradId = useMemo(() => `ai_mascot_bg_${Math.random().toString(36).substr(2, 7)}`, []);

  // ── Optically Centered Facial Coordinates ──
  // Eyes (Y = 88), Nose (Y = 107), Mouth (Y = 126) → Equal 19px visual spacing!
  const leftEyeX = 74 + gaze.x;
  const leftEyeY = 88 + gaze.y;
  const rightEyeX = 126 + gaze.x;
  const rightEyeY = 88 + gaze.y;

  // Small curved organic nose centered at (100, 107)
  const noseX = 100 + gaze.x * 0.35;
  const noseY = 107 + gaze.y * 0.35;

  // Smile centered at (100, 126)
  const mouthX = 100 + gaze.x * 0.25;
  const mouthY = 126 + gaze.y * 0.25;

  // Dynamic Mouth Path based on expression state (Prominent & Expressive)
  let mouthPath = `M ${mouthX - 18} ${mouthY} Q ${mouthX} ${mouthY + 14} ${mouthX + 18} ${mouthY}`;
  if (currentState === 'happy' || currentState === 'hover') {
    mouthPath = `M ${mouthX - 20} ${mouthY - 2} Q ${mouthX} ${mouthY + 18} ${mouthX + 20} ${mouthY - 2}`;
  } else if (currentState === 'thinking') {
    mouthPath = `M ${mouthX - 10} ${mouthY + 1} Q ${mouthX} ${mouthY - 4} ${mouthX + 10} ${mouthY + 1}`;
  } else if (currentState === 'alert') {
    mouthPath = `M ${mouthX - 10} ${mouthY + 1} Q ${mouthX} ${mouthY + 10} ${mouthX + 10} ${mouthY + 1}`;
  } else if (currentState === 'speaking') {
    if (talkFrame === 1) {
      mouthPath = `M ${mouthX - 16} ${mouthY - 1} Q ${mouthX} ${mouthY + 16} ${mouthX + 16} ${mouthY - 1}`;
    } else if (talkFrame === 2) {
      mouthPath = `M ${mouthX - 11} ${mouthY} Q ${mouthX} ${mouthY + 8} ${mouthX + 11} ${mouthY}`;
    } else if (talkFrame === 3) {
      mouthPath = `M ${mouthX - 18} ${mouthY - 2} Q ${mouthX} ${mouthY + 14} ${mouthX + 18} ${mouthY - 2}`;
    }
  }

  // Floating Micro-Animation
  const mascotVariants = {
    idle: {
      y: [0, -1.5, 0],
      rotate: [0, 0.3, -0.3, 0],
      transition: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' },
    },
    thinking: {
      y: [0, -2, 0],
      rotate: [-1, 1.5, -1],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    },
    speaking: {
      y: [0, -1.5, 0],
      scale: [1, 1.03, 1],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
    },
    listening: {
      scale: [1, 1.05, 1],
      y: [0, -2, 0],
      transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
    },
    happy: {
      y: [0, -3.5, 0],
      scale: [1, 1.06, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
    },
    hover: {
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className={`dynamic-ai-mascot ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'inherit',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      variants={mascotVariants}
      animate={currentState}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          overflow: 'visible',
          filter: glow || currentState === 'thinking' || currentState === 'listening'
            ? 'drop-shadow(0 4px 14px rgba(255, 107, 26, 0.45))'
            : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))',
          transition: 'filter 0.3s ease',
        }}
      >
        <defs>
          {/* Vibrant Signature Brand Gradient */}
          <linearGradient id={gradientId} x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Translucent Soft Velvet Inner Badge Tint */}
          <radialGradient id={bgGradId} cx="100" cy="100" r="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255, 107, 26, 0.12)" />
            <stop offset="70%" stopColor="rgba(255, 107, 26, 0.03)" />
            <stop offset="100%" stopColor="rgba(255, 107, 26, 0.0)" />
          </radialGradient>
        </defs>

        {/* Outer Living Pulse Aura (Thinking/Listening) */}
        {(currentState === 'thinking' || currentState === 'listening') && (
          <motion.path
            d={ORGANIC_WAVY_SHAPE}
            fill="none"
            stroke={primaryColor}
            strokeWidth="3.5"
            opacity="0.5"
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            style={{ transformOrigin: '100px 100px' }}
          />
        )}

        {/* Soft Background Fill for Figure-Ground Separation */}
        <path
          d={ORGANIC_WAVY_SHAPE}
          fill={`url(#${bgGradId})`}
        />

        {/* ── Outer Rounded Organic Wavy Badge Contour (No Ears, Non-flower) ── */}
        <motion.path
          d={ORGANIC_WAVY_SHAPE}
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          animate={{
            strokeWidth: currentState === 'hover' ? 10 : 9,
          }}
          transition={{ duration: 0.2 }}
        />

        {/* ── EYES (Left & Right - Prominent, Expressive & Optically Centered) ── */}
        {currentState === 'happy' ? (
          /* Cheerful Crescent Eyes (^ ^) */
          <g>
            <path
              d={`M ${leftEyeX - 10} ${leftEyeY + 2} Q ${leftEyeX} ${leftEyeY - 8} ${leftEyeX + 10} ${leftEyeY + 2}`}
              stroke={`url(#${gradientId})`}
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M ${rightEyeX - 10} ${rightEyeY + 2} Q ${rightEyeX} ${rightEyeY - 8} ${rightEyeX + 10} ${rightEyeY + 2}`}
              stroke={`url(#${gradientId})`}
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ) : (
          /* Expressive Dot Eyes with Gaze & Blink */
          <g>
            {/* Left Eye Dot */}
            <motion.circle
              cx={leftEyeX}
              cy={leftEyeY}
              r={currentState === 'listening' ? 11.5 : 10.5}
              fill={`url(#${gradientId})`}
              animate={{
                scaleY: isBlinking ? 0.08 : 1,
                scaleX: isBlinking ? 1.25 : 1,
              }}
              transition={{ duration: 0.07 }}
              style={{ transformOrigin: `${leftEyeX}px ${leftEyeY}px` }}
            />

            {/* Right Eye Dot */}
            <motion.circle
              cx={rightEyeX}
              cy={rightEyeY}
              r={currentState === 'listening' ? 11.5 : 10.5}
              fill={`url(#${gradientId})`}
              animate={{
                scaleY: isBlinking ? 0.08 : 1,
                scaleX: isBlinking ? 1.25 : 1,
              }}
              transition={{ duration: 0.07 }}
              style={{ transformOrigin: `${rightEyeX}px ${rightEyeY}px` }}
            />
          </g>
        )}

        {/* ── Prominent Organic Nose (Centered at Y=107) ── */}
        <motion.path
          d={`M ${noseX} ${noseY - 5} Q ${noseX + 4.5} ${noseY + 2} ${noseX - 3.5} ${noseY + 8}`}
          stroke={`url(#${gradientId})`}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ── Expressive Curved Smile (Centered at Y=126) ── */}
        <motion.path
          d={mouthPath}
          stroke={`url(#${gradientId})`}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
}

