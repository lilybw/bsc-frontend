import { css } from "@emotion/css"


export const titleBase = css({
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    letterSpacing: "1rem",
    textTransform: "uppercase",
    color: "white",
    fontSize: "8rem",
    pointerEvents: "none",
    textShadow: "0.75rem 0.3rem 0.3rem rgba(255, 255, 255, 0.3)",
    filter: "drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5))",
})

export const subTitleBase = css({
    textAlign: "center",
    fontFamily: "'Orbitron', sans-serif",

    fontWeight: 700,
    letterSpacing: 0,
    color: "hsla(0, 0%, 100%, 0.7)",

    fontSize: "2rem",
    textShadow: "0.15rem 0.15rem 0.3rem rgba(255, 255, 255, 0.3)",
    filter: "drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5))",
})