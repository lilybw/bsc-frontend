import { css, injectGlobal } from "@emotion/css"

injectGlobal`
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
`


export const titleBase = css({
    fontFamily: '"Orbitron", sans-serif',
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
    fontFamily: '"Be Vietnam Pro", sans-serif',

    fontWeight: 400,
    letterSpacing: 0,
    color: "hsla(0, 0%, 100%, 0.7)",

    fontSize: "2rem",
    textShadow: "0.15rem 0.15rem 0.3rem rgba(255, 255, 255, 0.3)",
    filter: "drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5))",
})