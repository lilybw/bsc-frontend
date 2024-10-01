import { Component, createMemo, mergeProps } from "solid-js";
import BufferBasedButton, { BufferBasedButtonProps } from "./BufferBasedButton";
import { AddRetainRemoveFunc } from "../ts/wrappedStore";
import { BufferSubscriber } from "../ts/actionContext";
import { IBackendBased, IBufferBased, IRegistering, IStyleOverwritable } from "../ts/types";
import { css } from "@emotion/css";
import NTAwait from "./util/NoThrowAwait";
import GraphicalAsset from "./GraphicalAsset";

interface ImageBufferButtonProps extends IBufferBased, IBackendBased, IStyleOverwritable, IRegistering<string> {
    name: string;
    nameCompleteOverwrite?: string;
    charHighlightOverwrite?: string;
    charBaseStyleOverwrite?: string;
    onActivation: () => void;
    imageStyleOverwrite?: string;
    buttonStyleOverwrite?: string;
    asset: number;
}

const ImageBufferButton: Component<ImageBufferButtonProps> = (props) => {
    const imageProps = mergeProps(props, {styleOverwrite: css`${props.imageStyleOverwrite}`});
    const buttonProps = mergeProps(props, {styleOverwrite: css`${props.buttonStyleOverwrite}`});

    const computedStyles = createMemo(() => css`${imgBuffButtContainerStyle} ${props.styleOverwrite}`);

    return (
        <div class={computedStyles()}>
            <BufferBasedButton {...buttonProps} />
            <NTAwait func={() => props.backend.getAssetMetadata(props.asset)}>
                {(asset) => (
                    <GraphicalAsset styleOverwrite={props.imageStyleOverwrite} metadata={asset} backend={props.backend}/>
                )}
            </NTAwait>
        </div>
    );
}
export default ImageBufferButton;

const imgBuffButtContainerStyle = css`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
`