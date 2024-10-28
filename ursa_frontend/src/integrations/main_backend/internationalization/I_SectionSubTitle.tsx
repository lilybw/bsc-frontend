import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { Accessor } from "solid-js";
import { SubSectionTitleProps, SUB_TITLE_STYLE } from "../../../components/base/SectionSubTitle";

export default function SectionSubTitle(props: SubSectionTitleProps, text: Accessor<string>): JSX.Element {
    return (
        <div class={css`${SUB_TITLE_STYLE} ${props.styleOverwrite}`}>
            {text()}
            {props.children}
        </div>
    )
}