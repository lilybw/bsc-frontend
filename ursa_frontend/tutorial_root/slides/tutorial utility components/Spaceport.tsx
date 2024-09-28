import { JSX, Component } from "solid-js";
import { css } from "@emotion/css";
import BigMenuButton from "../../../src/components/BigMenuButton";

interface SpacePortInterfaceProps {
  onOpen: () => void;
  onJoin: () => void;
  onLeave: () => void;
  description: string;
}

const SpacePortInterface: Component<SpacePortInterfaceProps> = (props) => {
  return (
    <div class={containerStyle}>
      <h1 class={titleStyle}>Space Port</h1>
      <div class={imageContainerStyle}>
        Space Port Sprite
      </div>
      <div class={contentContainerStyle}>
        <BigMenuButton onClick={props.onOpen} styleOverwrite={sideButtonStyle}>
          Open
        </BigMenuButton>
        <div class={descriptionStyle}>
          <p>{props.description}</p>
        </div>
        <BigMenuButton onClick={props.onJoin} styleOverwrite={sideButtonStyle}>
          Join
        </BigMenuButton>
      </div>
      <BigMenuButton onClick={props.onLeave} styleOverwrite={leaveButtonStyle}>
        Leave
      </BigMenuButton>
    </div>
  );
};

const containerStyle = css`
  width: 100%;
  height: 100vh;
  background-color: black;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
`;

const titleStyle = css`
  font-size: 2.5rem;
  margin-bottom: 20px;
`;

const imageContainerStyle = css`
  width: 80%;
  height: 40%;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 20px;
`;

const contentContainerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
`;

const descriptionStyle = css`
  width: 60%;
  text-align: center;
  border: 2px solid white;
  padding: 15px;
  font-size: 1.2rem;
`;

const sideButtonStyle = css`
  width: 150px;
  height: 60px;
  font-size: 1.5rem;
`;

const leaveButtonStyle = css`
  width: 200px;
  height: 60px;
  font-size: 1.5rem;
`;

export default SpacePortInterface;