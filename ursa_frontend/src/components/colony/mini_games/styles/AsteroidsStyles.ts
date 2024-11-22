// AsteroidsStyles.ts
import { css } from "@emotion/css";
import { Circle } from "@/ts/geometry";
import { Styles } from "@/styles/sharedCSS";
import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";

const LASER_DURATION_MS = 500;  // Could also move all game constants to a separate file
const PLAYER_DIMENSIONS = { width: "10vw", height: "10vw" };

export const AsteroidsStyles = {
    component: css({
        position: "absolute",
        width: "100%",
        height: "100%"
    }),

    planets: {
        system1: css({
            zIndex: -1,
            position: "absolute",
            width: "30vw",
            height: "30vw",
            right: "1vw"
        }),
        system2: css({
            zIndex: -1,
            position: "absolute",
            width: "20vw",
            height: "20vw",
            right: "-1vw",
            top: "25vh"
        })
    },

    laser: {
        container: css([
            Styles.POSITION.FULL_SCREEN,
            {
                filter: "drop-shadow(0 0 .5rem red)",
                zIndex: 2
            }
        ]),
        fadeAnimation: css`
            animation: laserFade ${LASER_DURATION_MS}ms forwards linear;
            @keyframes laserFade {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `
    },

    impact: {
        fadeAnimation: css`
            @keyframes laserImpactFade {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0;
                }
            }
        `,
        circles: css`
            &::before, &::after {
                content: '';
                position: absolute;
                left: 50%;
                top: 50%;
                border-radius: 50%;
            }
            &::before {
                transform: translate(-50%, -50%);
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,0,0,0.4) 50%, transparent 70%);
                box-shadow: 0 0 10px rgba(255,0,0,0.6);
            }
            &::after {
                transform: translate(-50%, -50%);
                background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,0,0,0.8) 50%, transparent 70%);
            }
        `
    },

    player: {
        container: (transform: TransformDTO) => css([
            PLAYER_DIMENSIONS,
            Styles.POSITION.transformToCSSVariables(transform),
            Styles.POSITION.TRANSFORM_APPLICATOR,
            { transform: `translate(-50%, -50%)` }
        ]),
        base: { zIndex: 1 },
        cannon: (rotation: number) => ({
            transform: `translate(-50%, -50%) rotate(${rotation - Math.PI / 2}rad)`,
            zIndex: 3
        }),
        emitter: { zIndex: 4 },
        button: (xOffset: number, yOffset: number, viewportHeight: number) => css([
            Styles.POSITION.TRANSFORM_CENTER_X,
            {
                position: "absolute",
                left: `${xOffset}px`,
                top: `${yOffset - (viewportHeight * 0.12)}px`,
                zIndex: 6
            }
        ])
    },

    getImpactStyle: (circle: Circle) => css([
        {
            zIndex: 5,
            position: 'absolute',
            left: `${circle.x}px`,
            top: `${circle.y}px`,
            pointerEvents: 'none',
            animation: `laserImpactFade ${LASER_DURATION_MS}ms forwards`
        },
        AsteroidsStyles.impact.fadeAnimation,
        AsteroidsStyles.impact.circles,
        css`
            &::before {
                width: ${circle.radius * 2}px;
                height: ${circle.radius * 2}px;
            }
            &::after {
                width: ${circle.radius}px;
                height: ${circle.radius}px;
            }
        `
    ])
};