import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import SectionTitle from "./components/SectionTitle";
import SectionSubTitle from "./components/SectionSubTitle";

interface ErrorPageProps {
    title?: string;
    content: any;
}

export default function ErrorPage(props: ErrorPageProps): JSX.Element {
    return (
        <div class={errorPageStyle}>
            <div class={backgroundImage}/>
            <SectionTitle styleOverwrite={titleOverwrite}>{props.title ?? "Oh no!"}</SectionTitle>
            <SectionSubTitle styleOverwrite={subTitleOverwrite}>{props.content}</SectionSubTitle>
        </div>
    )
}

const titleOverwrite = css`position: absolute; left: 15vw; top: 20vh;`

const subTitleOverwrite = css`position: absolute; right: 0; top: 30vh;`


const backgroundImage = css`
    position: absolute;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;

    background-image: url('https://images.aeonmedia.co/images/78ba87e7-7198-4468-81b5-500c505d5bc8/essay-gettyimages-1237093074.jpg?width=3840&quality=75&format=auto');
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