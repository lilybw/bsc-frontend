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
  filter: blur(0.1em);  // Overall blur for more cohesive effect
`;

/**
 * Base style for stun particle effect
 */
// In ParticleStyles.ts
export const stunParticleStyle = css`
  position: absolute;
  bottom: 0;
  width: 3em;  // Base size
  height: 3em;
  border-radius: 50%;
  mix-blend-mode: screen;
  opacity: 0;
  z-index: 101;
  pointer-events: none;
  filter: blur(0.15em);  // Blur for softer edges
  background-image: radial-gradient(
    rgba(255, 200, 0, 1) 10%,    // Bright yellow core
    rgba(255, 100, 0, 0.8) 30%,  // Orange mid
    rgba(255, 50, 0, 0.6) 50%,   // Reddish outer
    rgba(255, 30, 0, 0) 70%
  );
  box-shadow: 
    0 0 1em 0.2em rgba(255, 200, 0, 0.5),  // Inner glow
    0 0 2em 0.5em rgba(255, 100, 0, 0.3);  // Outer glow

  @keyframes stunRise {
    0% {
      opacity: 0;
      transform: translateY(0) scale(1);
    }
    5% {
      opacity: 1;
    }
    70% {
      opacity: 0.9;
      transform: translateY(-500%) scale(0.8);
    }
    90% {
      opacity: 0.3;
      transform: translateY(-500%) scale(0.4);
    }
    100% {
      opacity: 0;
      transform: translateY(-500%) scale(0);
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