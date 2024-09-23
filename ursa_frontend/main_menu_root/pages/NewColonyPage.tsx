import { Component, createSignal, JSX } from "solid-js";
import { css } from "@emotion/css";
import SectionTitle from "../../src/components/SectionTitle";
import StarryBackground from "../../src/components/StarryBackground";
import { MenuPages, MenuPageProps } from "../MainMenuApp";
import NavigationFooter from "../NavigationFooter";
import PlanetWithMoon from "../../src/components/PlanetWithMoon";

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
        <PlanetWithMoon/>
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
  padding-top: 10em;
  padding-left: 20em;
  box-sizing: border-box;
  z-index: 1;
  display: flex;
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
