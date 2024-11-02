import BigMenuButton from '@/components/base/BigMenuButton';
import { NamedVoidFunction } from '@/meta/types';
import { IInternationalized } from '@/ts/types';
import { css } from '@emotion/css';
import { Accessor, Component } from 'solid-js';

interface NavigationFooterProps extends IInternationalized {
    goNext?: NamedVoidFunction;
    goNextEnabled?: Accessor<boolean>;
    goBack?: NamedVoidFunction;
    goBackEnabled?: Accessor<boolean>;
    cancelAll?: NamedVoidFunction;
    cancelAllEnabled?: Accessor<boolean>;
}

const NavigationFooter: Component<NavigationFooterProps> = (props) => {
    return (
        <div class={footerStyles}>
            {props.goBack && (
                <BigMenuButton onClick={props.goBack?.func} enable={props.goBackEnabled}>
                    {props.text.get(props.goBack?.name || 'MENU.NAVIGATION.BACK').get()}
                </BigMenuButton>
            )}

            {props.cancelAll && (
                <BigMenuButton onClick={props.cancelAll?.func} enable={props.cancelAllEnabled}>
                    {props.text.get(props.cancelAll?.name || 'MENU.NAVIGATION.CANCEL').get()}
                </BigMenuButton>
            )}

            {props.goNext && (
                <BigMenuButton onClick={props.goNext?.func} enable={props.goNextEnabled}>
                    {props.text.get(props.goNext?.name || 'MENU.NAVIGATION.NEXT').get()}
                </BigMenuButton>
            )}
        </div>
    );
};
export default NavigationFooter;

const footerStyles = css`
    display: flex;
    justify-content: space-between;
    width: 33%;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
`;
