import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { Accessor } from "solid-js";
import { SubSectionTitleProps } from "../../../components/base/SectionSubTitle";
import { Styles } from "../../../sharedCSS";

export default function SectionSubTitle(props: SubSectionTitleProps, text: Accessor<string>): JSX.Element {
    return (
        <div class={css`${Styles.SUB_TITLE} ${props.styleOverwrite}`}>
            {text()}
            {props.children}
        </div>
    )
}