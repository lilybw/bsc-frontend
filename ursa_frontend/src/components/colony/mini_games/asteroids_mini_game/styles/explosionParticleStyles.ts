import { css } from "@emotion/css";

export const explosionParticleMovementStyle = css`
    position: absolute;
    animation: explodeOutwards 1s ease-out forwards;

    @keyframes explodeOutwards {
        0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
        }
        5% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            /* --spread-x and --spread-y are set in inline styles */
            transform: 
                translate(
                    calc(-50% + var(--spread-x)), 
                    calc(-50% + var(--spread-y))
                ) 
                scale(0.2);
            opacity: 0;
        }
    }
`;