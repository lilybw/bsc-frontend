import { JSX } from "solid-js/jsx-runtime";
import { IBackendBased, IStyleOverwritable } from "../../src/ts/types";
import { Component, createMemo } from "solid-js";
import { css } from "@emotion/css";
import ManagedAsset from "../../src/components/ManagedAsset";

interface VideoDemoFrameStyleProps extends IStyleOverwritable, IBackendBased {
    children: JSX.Element;
}

const VideoFrame: Component<VideoDemoFrameStyleProps> = (props) => {
    
    const computedStyle = createMemo(() => css`${colonyListBackgroundStyle} ${props.styleOverwrite}`);

    return (
        <div>
            <div class={computedStyle()}>
                <ManagedAsset asset={9} backend={props.backend} styleOverwrite={videoIconStyleOverwrite} />
                {props.children}
            </div>
        </div>
    );
}
export default VideoFrame;

const videoIconStyleOverwrite = css`
position: relative;
top: 0;
left: 50%;
width: 10vw;
height: 5vw;
transform: translateX(-50%);
font-size: 2rem;
filter: drop-shadow(0 0 .5rem white);
cursor: help;
`

const colonyListBackgroundStyle = css`
display: flex;
flex-direction: column;

position: absolute;
width: 66vw;
height: 60vh;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
padding: 1rem;
gap: 1rem;

border-radius: 5%;
border: .25rem solid white;
border-left: 0px;
border-right: 0px;

backdrop-filter: blur(.5rem) drop-shadow(0 0 .5rem black);
-webkit-backdrop-filter: blur(.5rem) drop-shadow(0 0 .5rem black);  // For Safari support
box-shadow: 0 0 1rem rgba(255, 255, 255, 1) inset;
`
