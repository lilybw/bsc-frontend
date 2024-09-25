import { JSX } from "solid-js/jsx-runtime"
import { css } from "@emotion/css"
import { Accessor } from "solid-js";
import { SectionTitleProps, TITLE_STYLE } from "../../../components/SectionTitle";

export default function I_SectionSubTitle(props: SectionTitleProps, text: Accessor<string>): JSX.Element {
    return (
        <div class={css`${TITLE_STYLE} ${props.styleOverwrite}`}>
            {text()}
            {props.children}
        </div>
    )
}