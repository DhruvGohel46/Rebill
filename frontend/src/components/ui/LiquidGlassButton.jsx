/**
 * =============================================================================
 * LIQUID GLASS BUTTON COMPONENT - LIQUID-GLASS-BUTTON.JSX
 * =============================================================================
 * 
 * ROLE: Premium glass morphism button component for the Liquid Glass Design System
 * 
 * RESPONSIBILITIES:
 * - Provide consistent button styling across the application
 * - Implement soft rounded shapes with proper border radius
 * - Add smooth hover animations and micro-interactions
 * - Support different button variants and sizes
 * - Ensure proper glass morphism effects
 * 
 * DESIGN FEATURES:
 * - Liquid glass appearance with backdrop blur
 * - Soft rounded corners (16px radius)
 * - Smooth hover lift and scale animations
 * - Theme-aware styling (light/dark modes)
 * - Proper focus states and accessibility
 * - Multiple variants: primary, secondary, ghost, outline
 * 
 * VARIANTS:
 * - primary: Orange brand color with glass effect
 * - secondary: Muted glass appearance
 * - ghost: Transparent with hover effect
 * - outline: Transparent with border
 * 
 * SIZES:
 * - sm: Small button for tight spaces
 * - md: Medium/default size
 * - lg: Large button for primary actions
 * 
 * USAGE:
 * <LiquidGlassButton variant="primary" size="lg" onClick={handleClick}>
 *   Button Text
 * </LiquidGlassButton>
 * =============================================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const LiquidGlassButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  style = {},
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const { isDark } = useTheme();

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary-500)',
      color: 'var(--text-inverse)',
      border: '1px solid var(--primary-500)',
      boxShadow: 'var(--shadow-button)',
    },
    secondary: {
      backgroundColor: 'var(--glass-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-button)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
      boxShadow: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary-500)',
      border: '1px solid var(--primary-500)',
      boxShadow: 'none',
    },
    error: {
      backgroundColor: 'var(--error-500)',
      color: 'var(--text-inverse)',
      border: '1px solid var(--error-500)',
      boxShadow: 'var(--shadow-button)',
    },
    success: {
      backgroundColor: 'var(--success-500)',
      color: 'var(--text-inverse)',
      border: '1px solid var(--success-500)',
      boxShadow: 'var(--shadow-button)',
    }
  };

  const sizeStyles = {
    sm: {
      padding: 'var(--spacing-2) var(--spacing-3)',
      fontSize: 'var(--text-sm)',
      minHeight: '32px',
    },
    md: {
      padding: 'var(--spacing-3) var(--spacing-4)',
      fontSize: 'var(--text-base)',
      minHeight: '40px',
    },
    lg: {
      padding: 'var(--spacing-4) var(--spacing-6)',
      fontSize: 'var(--text-lg)',
      minHeight: '48px',
    }
  };

  const hoverStyles = {
    primary: {
      backgroundColor: 'var(--primary-600)',
      boxShadow: 'var(--shadow-button-hover)',
    },
    secondary: {
      backgroundColor: 'var(--glass-header)',
      boxShadow: 'var(--shadow-button-hover)',
    },
    ghost: {
      backgroundColor: 'var(--glass-card)',
      color: 'var(--text-primary)',
    },
    outline: {
      backgroundColor: 'var(--primary-500)',
      color: 'var(--text-inverse)',
    },
    error: {
      backgroundColor: 'var(--error-600)',
      boxShadow: 'var(--shadow-button-hover)',
    },
    success: {
      backgroundColor: 'var(--success-600)',
      boxShadow: 'var(--shadow-button-hover)',
    }
  };

  const disabledStyles = {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  };

  const loadingStyles = {
    cursor: 'wait',
    pointerEvents: 'none',
  };

  const baseStyle = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    borderRadius: 'var(--radius-button)',
    fontWeight: 'var(--font-medium)',
    fontFamily: 'var(--font-primary)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    transition: 'all var(--transition-normal) var(--ease-out)',
    border: '1px solid var(--glass-border)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-2)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
    textDecoration: 'none',
    boxSizing: 'border-box',
    ...(disabled && disabledStyles),
    ...(loading && loadingStyles),
    ...style
  };

  const motionProps = !disabled && !loading ? {
    whileHover: {
      ...baseStyle,
      ...hoverStyles[variant],
      transform: 'var(--hover-lift)',
    },
    whileTap: {
      transform: 'var(--active-scale)',
    },
    whileFocus: {
      boxShadow: 'var(--focus-ring)',
    }
  } : {};

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: '1em',
          lineHeight: 1
        }}
      >
        {icon}
      </span>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </motion.div>
        </motion.div>
      );
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <span>{children}</span>
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <motion.button
      className={`liquid-glass-button rounded-button ${className}`}
      style={baseStyle}
      onClick={disabled || loading ? undefined : onClick}
      {...motionProps}
      {...props}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </motion.div>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          <span>{children}</span>
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </motion.button>
  );
};

export default LiquidGlassButton;
