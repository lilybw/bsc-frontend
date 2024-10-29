import { css } from '@emotion/css';

/**
 * Container style for all particle effects
 */
export const particleContainerStyle = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  overflow: visible;
`;

/**
 * Base style for stun particle effect
 */
export const stunParticleStyle = css`
  position: absolute;
  bottom: 0;
  width: 2.5em;
  height: 2.5em;
  border-radius: 50%;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 101;
  pointer-events: none;
  background-image: radial-gradient(
    rgba(255, 255, 0, 0.8) 20%,
    rgba(255, 255, 150, 0.4) 40%,
    rgba(255, 255, 0, 0) 70%
  );

  @keyframes stunRise {
    0% {
      opacity: 0;
      transform: translateY(0) scale(1);
    }
    5% {
      opacity: 1;
    }
    70% {
      opacity: 0.8;
      transform: translateY(-1000%) scale(0.8);
    }
    90% {
      opacity: 0.2;
      transform: translateY(-1100%) scale(0.4);
    }
    100% {
      opacity: 0;
      transform: translateY(-1200%) scale(0);
    }
  }
`;

/**
 * Function to generate rotating animation style
 */
export const rotatingStyle = (speedSeconds: number) => css`
  animation: rotate ${speedSeconds}s linear infinite;

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

/**
 * Animation duration constants
 */
export const PARTICLE_ANIMATION_DURATIONS = {
    STUN: 6000, // 6 seconds
    FADE_IN: 150,  // 0.15 seconds
    FADE_OUT: 300  // 0.3 seconds
} as const;

/**
 * Utility function to generate blur style
 */
export const getBlurStyle = (amount: number) => css`
  filter: blur(${amount}em);
`;

/**
 * Utility function for dynamic particle size
 */
export const getParticleSizeStyle = (baseSize: number, variance: number = 0.5) => {
    const size = baseSize + (Math.random() * variance);
    return css`
    width: ${size}em;
    height: ${size}em;
  `;
};

/**
 * Z-index constants for proper layering
 */
export const PARTICLE_Z_INDICES = {
    CONTAINER: 10,
    PARTICLE_BASE: 100,
    PARTICLE_EFFECT: 101
} as const;