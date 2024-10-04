import { Component, createSignal } from "solid-js";
import { MenuPageProps, MenuPages } from "../MainMenuApp";
import NavigationFooter from "../NavigationFooter";
import StarryBackground from "../../src/components/StarryBackground";
import SectionTitle from "../../src/components/SectionTitle";
import { css } from "@emotion/css";
import SectionSubTitle from "../../src/components/SectionSubTitle";

const JoinColonyPage: Component<MenuPageProps> = (props) => {
    const [colonyCode, setcolonyCode] = createSignal("");
    const [textError, setTextError] = createSignal<string | undefined>(undefined);
    
    async function handleJoin() {
        const codeLength = 6;
        const inputCode = colonyCode().trim();

        // Check if the input is empty
        if (inputCode === "") {
            setTextError("Please enter a colony code.")
            return;
        }

        // Check if the input consists only of digits
        if (!/^\d+$/.test(inputCode)) {
            setTextError("Colony code must contain only numbers.");
            return;
        }

        // Check the length of the input
        if (inputCode.length < codeLength) {
            setTextError("Colony code is too short. It must be 6 digits.");
            return;
        }

        if (inputCode.length > codeLength) {
            setTextError("Colony code is too long. It must be 6 digits.");
            return;
        }

        // Convert to number after all string checks are done
        const numericCode = Number(inputCode);
        if (Number.isNaN(numericCode)) {
            setTextError("Not a number.")
        }

        // Check if the number is negative (although this should never happen given the regex check)
        if (numericCode < 0) {
            setTextError("Colony code cannot be negative.");
            return;
        }

        setTextError(undefined)
        
        // Join the colony
        const response = await props.context.backend.joinColony(numericCode);

        // Handle the response as needed
        if (response.code != 200) {
            setTextError(String(response.err))
            return
        }

        props.context.logger.log("[DELETE ME] implement redirect here!")

    };
    
    return (
        <div class={pageStyle}>
            <NavigationFooter
                text={props.context.text} 
                goBack={{ name: "MENU.NAVIGATION.BACK", func: props.goBack }} 
                goNext={{ name: "MENU.OPTION.JOIN_COLONY", func: handleJoin}}
            />
            {props.context.text.Title('MENU.PAGE_TITLE.JOIN_COLONY')({})}
            <div>
                {props.context.text.SubTitle('MENU.SUB_TITLE.INSERT_CODE_HERE')({})}
                <div class={inputContainerStyle}>
                    {textError() && <SectionSubTitle styleOverwrite="color: red;">{textError()}</SectionSubTitle>}
                    <input
                    id="ColonyCode"
                    type="number"
                    value={colonyCode()}
                    onInput={(e) => setcolonyCode(e.currentTarget.value)}
                    class={inputStyle}
                    />
                </div>
            </div>
            <StarryBackground/>
        </div>
    )
}

const pageStyle = css`
    display: grid;
    width: 100%;
    height: 100%;
`;

const joinStyle = css`
    display: grid;
    width: 30%;
    height: 30%;
`;

const inputContainerStyle = css`
  font-family: Fantasy;
  font-size: 3rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
  display: grid;
  flex-direction: column;
  justify-content: center;
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
  -webkit-appearance: none;
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export default JoinColonyPage;