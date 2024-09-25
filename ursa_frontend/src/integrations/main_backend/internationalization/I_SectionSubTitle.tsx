import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { Accessor } from "solid-js";
import { SUB_TITLE_STYLE, SubSectionTitleProps } from "../../../components/SectionSubTitle";
import { SectionTitleProps } from "../../../components/SectionTitle";

export default function SectionSubTitle(props: SubSectionTitleProps, text: Accessor<string>): JSX.Element {
    return (
        <div class={css`${SUB_TITLE_STYLE} ${props.styleOverwrite}`}>
            {text()}
            {props.children}
        </div>
    )
}