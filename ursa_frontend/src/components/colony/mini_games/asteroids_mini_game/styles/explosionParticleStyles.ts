import { css } from "@emotion/css";

export const explosionParticleMovementStyle = css`
    animation: explodeOutwards 1s ease-out forwards;

    @keyframes explodeOutwards {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
        10% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: 
                translate(
                    calc(-50% + var(--spread-x)),
                    calc(-50% + var(--spread-y))
                ) 
                scale(0.5);
            opacity: 0;
        }
    }
`;
