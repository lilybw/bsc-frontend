import { css } from '@emotion/css';
import { JSX } from 'solid-js/jsx-runtime';
import { SectionTitleProps } from './SectionTitle';
import { Styles } from '../../styles/sharedCSS';

export interface SubSectionTitleProps extends SectionTitleProps {}

export default function SectionSubTitle(props: SubSectionTitleProps): JSX.Element {
    return (
        <div
            class={css`
                ${Styles.SUB_TITLE} ${props.styleOverwrite}
            `}
        >
            {props.children}
        </div>
    );
}
