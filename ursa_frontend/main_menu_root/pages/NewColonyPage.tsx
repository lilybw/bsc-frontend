/** @jsxImportSource solid-js */
import { Component, createSignal, JSX } from "solid-js";
import { css } from "@emotion/css";
import SectionTitle from "../../src/components/SectionTitle";
import BigMenuButton from "../../src/components/BigMenuButton";
import StarryBackground from "../../src/components/StarryBackground";
import { MenuPages, MenuPageProps } from "../MainMenuApp";
import NavigationFooter from "../NavigationFooter";

const NewColonyPage: Component<MenuPageProps> = (props) => {
  const [colonyName, setColonyName] = createSignal("Pandora");

  const handleContinue = () => {
    console.log(`Creating new colony: ${colonyName()}`);
    // Add logic to create the colony here
    // Then navigate to the colony list page
    props.goToPage(MenuPages.CONTINUE_COLONY);
  };

  return (
    <div class={pageStyle}>
      <div class={leftContainerStyle}>
        <SectionTitle styleOverwrite={titleStyle}>CREATE A NEW COLONY</SectionTitle>
      </div>
      <div class={inputContainerStyle}>
        {/* Add input field for colony name here */}
      </div>
      <div class={rightContainerStyle}>
      <NavigationFooter
          goBack={{ name: "Back", func: props.goBack }}
          goNext={{ name: "Continue", func: handleContinue }}
        />
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
  align-items: center;
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
`;

const bottomContainerStyle = css`
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
  z-index: 1;
`;

const titleStyle = css`
  font-size: 5rem;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
`;

const inputContainerStyle = css`
  transform-origin: center left;
  transform: translate(-50%, -50%); /* Center the div */
`;