import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { IParenting, IStyleOverwritable } from "../../ts/types";
import { Styles } from "../../sharedCSS";

export interface SectionTitleProps extends IStyleOverwritable, IParenting {
}

export default function SectionTitle(props: SectionTitleProps): JSX.Element {
    return (
        <div class={css`${Styles.TITLE} ${props.styleOverwrite}`}>{props.children}</div>
    )
}