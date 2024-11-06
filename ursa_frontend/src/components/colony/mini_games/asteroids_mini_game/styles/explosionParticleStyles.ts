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

export const explosionParticleContentStyle = css`
    width: var(--particle-size);
    height: var(--particle-size);
    border-radius: 50%;
    mix-blend-mode: screen;
    z-index: 1000;
    pointer-events: none;
    filter: blur(var(--blur-amount));
    background-image: radial-gradient(var(--glow-color) 10%, var(--mid-color) 30%, var(--outer-color) 50%, rgba(255, 30, 0, 0) 70%);
    box-shadow:
        0 0 1em 0.2em rgba(255, 200, 0, 0.5),
        0 0 2em 0.5em rgba(255, 100, 0, 0.3);
`;