import { Component } from 'solid-js';
import { css, keyframes } from '@emotion/css';

interface SpinnerProps {
  styleOverwrite?: string;
}

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner: Component<SpinnerProps> = (props) => {
  return <div class={`${spinnerStyle} ${props.styleOverwrite || ''}`} />;
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