import { Component, createSignal, JSX } from "solid-js";
import { css } from "@emotion/css";
import SectionTitle from "../../src/components/SectionTitle";
import StarryBackground from "../../src/components/StarryBackground";
import { MenuPages, MenuPageProps } from "../MainMenuApp";
import NavigationFooter from "../NavigationFooter";
import PlanetWithMoon from "../../src/components/PlanetWithMoon";
import SectionSubTitle from "../../src/components/SectionSubTitle";
import {CreateColonyRequestDTO} from "../../src/integrations/main_backend/mainBackendDTOs"

const NewColonyPage: Component<MenuPageProps> = (props) => {
  const [colonyName, setColonyName] = createSignal("Pandora");
  const [textError, setTextError] = createSignal<string | undefined>(undefined);

  async function handleCreateColony() {
    // Trim the colony name to remove any leading or trailing whitespace
    const trimmedName = colonyName().trim();

    // Check if the name is empty after trimming
    if (trimmedName.length === 0) {
        setTextError("Colony name cannot be empty.");
        return;
    }

    // Check if the name is too short
    if (trimmedName.length < 4) {
        setTextError("Colony name must be at least 4 characters long.");
        return;
    }

    // Check if the name is too long
    if (trimmedName.length > 32) {
        setTextError("Colony name cannot exceed 32 characters.");
        return;
    }

    // Check if the name contains only alphabetic characters and spaces
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
        setTextError("Colony name can only contain letters and spaces.");
        return;
    }

    // If we've made it this far, the input is valid
    setTextError(undefined);

    // Create the colony
    const body: CreateColonyRequestDTO = {
      name: colonyName()
    }
    const createColonyResponse = await props.context.backend.createColony(body, props.context.backend.localPlayer.id);

    // Handle the response as needed
    if (createColonyResponse.err !== null) {
        setTextError(String(createColonyResponse.err))
        return
    }

    props.context.nav.goToColony(createColonyResponse.res);
  };

  return (
    <div class={pageStyle} id={"new-colony-page"}>
      <div class={leftContainerStyle} id={"new-colony-page-left-container"}>
        {props.context.text.Title('MENU.PAGE_TITLE.CREATE_COLONY')({styleOverwrite: titleStyle})}
        <div class={centerContentStyle} id={"new-colony-page-centering"}>
          <div class={inputContainerStyle}>
            {props.context.text.SubTitle('MENU.SUB_TITLE.NAME_COLONY')({})}
            {textError() && <SectionSubTitle styleOverwrite="color: red;">{textError()}</SectionSubTitle>}
            <input
              id="colonyName"
              type="text"
              value={colonyName()}
              onInput={(e) => setColonyName(e.currentTarget.value)}
              class={inputStyle}
            />
          </div>
          <NavigationFooter
            text={props.context.text}
            goBack={{ name: "MENU.NAVIGATION.BACK", func: props.goBack }}
            goNext={{ name: "MENU.OPTION.CREATE_COLONY", func: handleCreateColony }}
          />
        </div>
      </div>
      <div class={rightContainerStyle} id={"new-colony-page-right-container"}>
        <PlanetWithMoon backend={props.context.backend}/>
      </div>
      <StarryBackground />
    </div>
  ) as JSX.Element;
};

export default NewColonyPage;

const pageStyle = css`
  position: relative;
  height: 90%;
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
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  width: 66.67%;
  height: 100%;
  z-index: 1;
  
  box-sizing: border-box;
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
