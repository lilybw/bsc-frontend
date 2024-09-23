import { JSX } from "solid-js/jsx-runtime";
import SectionTitle from "../../src/components/SectionTitle";
import StarryBackground from "../../src/components/StarryBackground";
import { css, keyframes } from "@emotion/css";
import { IBackendBased } from "../../src/ts/types";
import ManagedAsset from "../../src/components/ManagedAsset";

interface WelcomePageProps extends IBackendBased {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function WelcomePage(props: WelcomePageProps): JSX.Element {
    setTimeout(() => {
        props.onSlideCompleted();
    }, 5000);
    return (
        <div class="welcome-tutorial-page">
            <StarryBackground styleOverwrite={backgroundStyleOverwrite} />
            <div class={starStyle} id="moving-star"/>
            <div class={planetContainerStyle} id="shadow-container">
                <div class={solarPlanetShadowStyle} id="planet-shadow"/>
            </div>
            <ManagedAsset asset={5} backend={props.backend} styleOverwrite={gasGiantStyleOverwrite} />

            <div class={planetAtmosphereStyle} />
            <SectionTitle styleOverwrite={titleStyle}>WELCOME</SectionTitle>
            <SectionTitle styleOverwrite={titleFrontShadow}>WELCOME</SectionTitle>
        </div>
    )
}
const sunMoveSpeedS = 30

const planetContainerStyle = css`
position: absolute;
object-fit: none;

border-radius: 50%;

width: 122%;
height: 100%;
bottom: -69%;
left: 50%;
transform: translateX(-50%);

overflow: hidden;
`

const gasGiantStyleOverwrite = css`
${planetContainerStyle}
z-index: -1;
filter: contrast(2) hue-rotate(80deg);
`
const solarPlanetShadowStyle = css`
position: relative;
z-index: 1;
background-image: radial-gradient(black 50%, transparent 70%);
width: 120%;
height: 120%;
--lr-offset: 30%;
animation: matchSunMovement ${sunMoveSpeedS}s linear infinite;

@keyframes matchSunMovement {
    0% {
        left: var(--lr-offset);
    }
    50% {
        left: 0%;
    }    
    100% {
        left: calc(var(--lr-offset) * -1);
    }
}
`;

const animMovingStars = keyframes`
0% {
    transform: scale(2) translateX(25%);
}
100% {
    transform: scale(2.5) translateX(-25%);
}
`
const animSunMovement = keyframes`
0% {
    top: 33%;
    left: -5%;
    filter: drop-shadow(0 0 3rem white);
}  
50% {
    top: 26.5%;
    left: 50%;
    filter: drop-shadow(0 0 .5rem white);
}
100% {
    top: 30%;
    left: 105%;
    filter: drop-shadow(0 0 3rem white);
}
`

const backgroundStyleOverwrite = css`
filter:  contrast(1.2);
transform: scale(2) translateX(25%);
opacity: .5;
animation: ${animMovingStars} ${sunMoveSpeedS * 2}s linear infinite;
`

const starStyle = css`
position: absolute;
border-radius: 50%;
top: 20%;
left: 10%;
--star-size: 3rem;
width: var(--star-size);
height: var(--star-size);
background-image: radial-gradient(circle, hsla(0, 0%, 100%, 1) 50%, hsla(30, 80%, 50%, .9) 75%, transparent 100%);
filter: drop-shadow(0 0 2rem white);
animation: ${animSunMovement} ${sunMoveSpeedS}s linear infinite;
`

const planetAtmosphereStyle = css`
z-index: 1;
position: absolute;
border-radius: 50%;
width: 200%;
height: 200%;
bottom: -140%;
transform: translateX(-25%);
--solid-edge: 50%;
background-image: radial-gradient(ellipse, 
    transparent calc(var(--solid-edge) - 5.5%), 
    hsla(0, 0%, 0%, .3) calc(var(--solid-edge) - 1.5%),
    hsla(0, 100%, 100%, 1) var(--solid-edge), 
    hsla(190, 100%, 50%, .7) calc(var(--solid-edge) + 5%), 
    hsla(206, 100%, 45%, .8) calc(var(--solid-edge) + 10%), 
    hsla(226, 100%, 45%, .7) calc(var(--solid-edge) + 15%), 
    hsla(226, 100%, 45%, .0) calc(var(--solid-edge) + 20%), 
    transparent 100%
);
`
const animTitleHighlight = keyframes`
0% {
    filter: drop-shadow(-.5rem -.5rem .5rem hsla(0, 0%, 100%, .5));
}
100% {
    filter: drop-shadow(.5rem -.5rem .5rem hsla(0, 0%, 100%, .5));
}
`

const titleStyle = css`
z-index: 2;
position: absolute;
left: 50%;
bottom: 33%;
font-size: 10rem;
text-shadow: none;
filter: drop-shadow(-.5rem -.5rem .5rem hsla(0, 0%, 100%, .5));
transform: translateX(-50%);
animation: ${animTitleHighlight} ${sunMoveSpeedS}s linear infinite;
`

const animFrontShadow = keyframes`
0% {
    left: 50.3%;
    bottom: 32.5%;
}
50% {
    left: 50%;
    bottom: 32.25%;
}
100% {
    left: 49.7%;
    bottom: 32.5%;
}
`

const titleFrontShadow = css`
z-index: 3;
color: hsla(0, 0%, 0%, .8);
position: absolute;
left: 50.3%;
bottom: 32.5%;
font-size: 10rem;
text-shadow: none;
transform: translateX(-50%);
filter: blur(.25rem);
animation: ${animFrontShadow} ${sunMoveSpeedS}s linear infinite;
`