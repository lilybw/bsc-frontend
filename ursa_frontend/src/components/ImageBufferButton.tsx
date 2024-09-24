import { Component, createMemo, mergeProps } from "solid-js";
import BufferBasedButton, { BufferBasedButtonProps } from "./BufferBasedButton";
import ManagedAsset, { ManagedAssetProps } from "./ManagedAsset";
import { AddRetainRemoveFunc } from "../ts/wrappedStore";
import { BufferSubscriber } from "../ts/actionContext";
import { IBackendBased, IBufferBased, IStyleOverwritable } from "../ts/types";
import { css } from "@emotion/css";

interface ImageBufferButtonProps extends IBufferBased, IBackendBased, IStyleOverwritable {
    name: string;
    nameCompleteOverwrite?: string;
    charHighlightOverwrite?: string;
    charBaseStyleOverwrite?: string;
    onActivation: () => void;
    register: AddRetainRemoveFunc<BufferSubscriber<string>>;
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
            <ManagedAsset {...imageProps} />
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