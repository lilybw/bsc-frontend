/** @jsxImportSource solid-js */
import { Component, createSignal, JSX } from "solid-js";
import { css } from "@emotion/css";
import SectionTitle from "../../src/components/SectionTitle";
import BigMenuButton from "../../src/components/BigMenuButton";
import StarryBackground from "../../src/components/StarryBackground";
import { MenuPages, MenuPageProps } from "../MainMenuApp";
import NavigationFooter from "../NavigationFooter";

// Import the green gas giant image
import greenGasGiantImage from './images/Green Gas Giant.jpeg';
import moon from './images/Moon.png';

const NewColonyPage: Component<MenuPageProps> = (props) => {
  const [colonyName, setColonyName] = createSignal("Pandora");

  const handleContinue = () => {
    console.log(`Creating new colony: ${colonyName()}`);
    props.goToPage(MenuPages.CONTINUE_COLONY);
  };

  return (
    <div class={pageStyle}>
      <div class={leftContainerStyle}>
        <SectionTitle styleOverwrite={titleStyle}>CREATE A NEW COLONY</SectionTitle>
        <div class={centerContentStyle}>
          <div class={inputContainerStyle}>
            <label for="colonyName">Name your colony</label>
            <input
              id="colonyName"
              type="text"
              value={colonyName()}
              onInput={(e) => setColonyName(e.currentTarget.value)}
              class={inputStyle}
            />
          </div>
          <NavigationFooter
            goBack={{ name: "Back", func: props.goBack }}
            goNext={{ name: "Continue", func: handleContinue }}
          />
        </div>
      </div>
      <div class={rightContainerStyle}>
        <div class={planetStyle}>
          <div class={moonStyle}></div>
        </div>
      </div>
      <StarryBackground />
    </div>
  ) as JSX.Element;
};

export default NewColonyPage;

const pageStyle = css`
  position: relative;
  height: 100%;
  color: white;
  display: flex;
  overflow: hidden;
`;

const leftContainerStyle = css`
  width: 33.33%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 2rem;
  box-sizing: border-box;
  z-index: 1;
`;

const rightContainerStyle = css`
  width: 66.67%;
  height: 100%;
  padding: 2rem;
  box-sizing: border-box;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const titleStyle = css`
  font-size: 5rem;
  text-align: left;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
`;

const centerContentStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: calc(100% - 7rem); // Subtracting approximate title height
  width: 100%;
`;

const inputContainerStyle = css`
  margin-left: 2rem;
  border-radius: 25px;
  font-family: Fantasy;
  font-size: 3rem;
  text-align: left;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

const inputStyle = css`
  border-radius: 1rem;
  width: 50%;
  height: 2rem;
  justify-content: center;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: transparent;
  border: 0.15rem solid white;
  color: white;
  text-align: center;
`;

const planetStyle = css`
  width: 20em;
  height: 20em;
  background: url(${greenGasGiantImage});
  box-shadow: inset -2em -2em 2em #000, -0.3em -0.3em 0.5em #658E66;
  position: relative;
  animation: rotate 5000s linear infinite;
  border-radius: 50%;
  background-repeat: repeat;
  background-size: 1000% 100%;
  z-index: 500;

  @keyframes rotate {
    to {
      background-position: -2000% 0;
    }
  }
`;

const moonStyle = css`
  background: url(${moon});
  width: 6em;
  height: 6em;
  position: absolute;
  left: -10em;
  top: 50%;
  transform: translateY(-50%);
  animation: rotate 1000s linear infinite, orbit 20s infinite ease-in-out;
  border-radius: 50%;
  box-shadow: inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em #AA653C;

  @keyframes orbit {
    49% {
      z-index: 1;
      left: 25em;
    }
    100% {
      left: -10rem;
      z-index: 1000;
    }
  }
`;
