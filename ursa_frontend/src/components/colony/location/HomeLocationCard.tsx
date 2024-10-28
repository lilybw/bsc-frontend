import { Component } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css, keyframes } from "@emotion/css";
import NTAwait from "../../util/NoThrowAwait";
import BufferBasedButton from "../../base/BufferBasedButton";
import GraphicalAsset from "../../base/GraphicalAsset";

interface HomeLocationCardProps extends GenericLocationCardProps {}

const HomeLocationCard: Component<HomeLocationCardProps> = (props) => {
    return (
        <div class={cardContainerStyle} id={"location-card-home"}>
            <div class={cardContentStyle}>
                <div class={backgroundContainerStyle}>
                    <NTAwait func={() => props.backend.assets.getMetadata(props.info.appearances[0].splashArt)}>
                        {(asset) => (
                            <>
                                <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                                <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                            </>
                        )}
                    </NTAwait>
                </div>
                {props.text.Title(props.info.name)({styleOverwrite: titleStyleOverwrite})}
                <div class={contentGridStyle}>
                    <div class={imageContainerStyle}>
                        <NTAwait func={() => props.backend.assets.getMetadata(props.info.appearances[0].splashArt)}>
                            {(asset) =>
                                <GraphicalAsset styleOverwrite={imageStyle} backend={props.backend} metadata={asset} />
                            }
                        </NTAwait>
                    </div>
                    {props.text.SubTitle(props.info.description)({styleOverwrite: descriptionStyleOverwrite})}
                </div>
                <div class={buttonContainerStyle}>
                    <BufferBasedButton 
                        name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={props.closeCard}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomeLocationCard;

const moveBackground = keyframes`
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
`;

const cardContainerStyle = css`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
`;

const cardContentStyle = css`
    position: relative;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 20px;
    padding: 1.5rem;
    width: 80vw;
    max-width: 1000px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const backgroundContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 100%;
    display: flex;
    animation: ${moveBackground} 60s linear infinite;
`;

const backgroundImageStyle = css`
    width: 50%;
    height: 100%;
    object-fit: cover;
    opacity: 0.1;
`;

const titleStyleOverwrite = css`
    font-size: 2rem;
    color: #00ffff;
    text-align: center;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    position: relative;
    z-index: 1;
`;

const contentGridStyle = css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    height: 100%;
    position: relative;
    z-index: 1;
`;

const imageContainerStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`;

const imageStyle = css`
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`;

const descriptionStyleOverwrite = css`
    font-size: 0.9rem;
    color: #a0a0a0;
    margin: 0;
    max-height: 15vh;
    overflow-y: auto;
`;

const buttonContainerStyle = css`
    display: flex;
    justify-content: center;
    gap: 1rem;
    position: relative;
    z-index: 1;
`;