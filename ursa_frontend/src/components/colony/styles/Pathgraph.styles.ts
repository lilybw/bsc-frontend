import { css } from "@emotion/css";

export const gameContainerStyle = css`
  position: absolute;
  transition: transform 0.5s ease;
  width: 100%;
  height: 100%;
`;

export const localPlayerStyle = css`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background-color: blue;
  border-radius: 50%;
  z-index: 1000;
`;

export const gameElementStyle = css`
  position: absolute;
  transition: left 0.5s ease, top 0.5s ease;
`;

export const playerLabelStyle = css`
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
`;