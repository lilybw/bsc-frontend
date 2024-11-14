import { JSX } from 'solid-js/jsx-runtime';
import { css } from '@emotion/css';
import { Accessor } from 'solid-js';
import { SectionTitleProps } from '../../../components/base/SectionTitle';
import { Styles } from '../../../styles/sharedCSS';

export default function I_SectionSubTitle(props: SectionTitleProps, text: Accessor<string>): JSX.Element {
    return (
        <div
            class={css`
                ${Styles.TITLE} ${props.styleOverwrite}
            `}
        >
            {text()}
            {props.children}
        </div>
    );
}
