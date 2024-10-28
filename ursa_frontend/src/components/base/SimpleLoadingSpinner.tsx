import { Component } from 'solid-js';
import { css, keyframes } from '@emotion/css';
import { IStyleOverwritable } from '../../ts/types';

interface SpinnerProps extends IStyleOverwritable {
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner: Component<SpinnerProps> = (props) => {
  return <div class={css`${spinnerStyle} ${props.styleOverwrite}`} />;
};
export default Spinner;

const defaultColor = '#007bff';

const spinnerStyle = css`
  border-width: 0 0 0 .5rem;
  border-radius: 50%;
  border-style: solid;
  border-left-color: ${defaultColor};
  animation: ${spin} 1s linear infinite;
`;