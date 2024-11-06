import { css } from "@emotion/css";

export const explosionParticleMovementStyle = css`
    animation: explodeOutwards 1s ease-out forwards;

    @keyframes explodeOutwards {
        0% {
            transform: scale(1);
            opacity: 0;
        }
        10% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: 
                translate(
                    var(--spread-x),
                    var(--spread-y)
                ) 
                scale(0.5);
            opacity: 0;
        }
    }
`;