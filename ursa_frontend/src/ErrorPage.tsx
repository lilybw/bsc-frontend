import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import SectionTitle from "./components/SectionTitle";
import SectionSubTitle from "./components/SectionSubTitle";
import { IInternationalized } from "./ts/types";

interface ErrorPageProps{
    title?: string;
    content: any;
    children?: JSX.Element;
}

export default function ErrorPage(props: ErrorPageProps): JSX.Element {
    return (
        <div class={errorPageStyle}>
            <div class={backgroundImage}/>
            <SectionTitle styleOverwrite={titleOverwrite}>{props.title ?? "Oh no!"}</SectionTitle>
            <SectionSubTitle styleOverwrite={subTitleOverwrite}>{props.content}</SectionSubTitle>
            <div class={childrenContainer}>
                {props.children}
            </div>
        </div>
    )
}

const childrenContainer = css`
position: absolute;
left: 50%;
top: 70%;
width: 100%;
transform: translate(-50%, -50%);
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
z-index: 1000;
background-color: rgba(0, 0, 0, 0.4);
`

const titleOverwrite = css`position: absolute; left: 12vw; top: 10vh;`

const subTitleOverwrite = css`position: absolute; right: 0; top: 20vh; width: 50%;`


const backgroundImage = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;

    background-image: url('https://astrocamp.org/app/uploads/2015/12/IS-BH-1024x576-1.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;

`

const errorPageStyle = css`
    display: flex;
    flex-direction: column; 
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
`