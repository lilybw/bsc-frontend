import { css } from "@emotion/css";

export const fireParticleStyle = css`
    border-radius: 50%;
    background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.95) 0%,    /* Bright white core */
        rgba(255, 200, 50, 0.9) 20%,     /* Bright yellow */
        rgba(255, 120, 20, 0.8) 40%,     /* Orange */
        rgba(255, 60, 20, 0.7) 60%,      /* Deep orange */
        rgba(255, 20, 0, 0.6) 80%,       /* Red */
        rgba(100, 0, 0, 0) 100%          /* Fade to transparent */
    );
    filter: blur(2px) brightness(1.2);
    box-shadow: 
        0 0 10px rgba(255, 200, 50, 0.5),
        0 0 20px rgba(255, 100, 20, 0.3);
`;