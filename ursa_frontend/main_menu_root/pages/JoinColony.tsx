import { Component, createMemo, createSignal } from "solid-js";
import { MenuPageProps, MenuPages } from "../MainMenuApp";
import NavigationFooter from "../NavigationFooter";
import StarryBackground from "../../src/components/StarryBackground";
import SectionTitle from "../../src/components/SectionTitle";
import { css } from "@emotion/css";
import SectionSubTitle from "../../src/components/SectionSubTitle";
import { Styles } from "../../src/sharedCSS";

const JoinColonyPage: Component<MenuPageProps> = (props) => {
    const [colonyCode, setColonyCode] = createSignal("");
    const [codeError, setCodeError] = createSignal<string | undefined>(undefined);
    const [inputEngaged, setInputEngaged] = createSignal(false);

    async function handleJoin() {
        if (!checkInput()) return;

        // Join the colony
        const response = await props.context.backend.joinColony(Number(colonyCode()));

        // Handle the response as needed
        if (response.err !== null) {
            switch (response.code) {
                case 404: setCodeError("No colony by that code"); break;
                default: setCodeError(response.err);
            }
            return;
        }

        const colonyInfoAttempt = await props.context.backend.getColony(response.res.ownerID, response.res.colonyID);
        if (colonyInfoAttempt.err !== null) {
            setCodeError("Failed to get colony info: " + colonyInfoAttempt.err);
            return;
        }

        // Go to the colony
        props.context.nav.goToColony(colonyInfoAttempt.res);
    };

    const checkInput = (): boolean => {
        const codeLength = 6;
        const inputCode = colonyCode().trim();

        // Check if the input is empty
        if (inputCode === "") {
            setCodeError("Please enter a colony code.")
            return false;
        }

        // Check if the input consists only of digits
        if (!/^\d+$/.test(inputCode)) {
            setCodeError("Colony code must contain only numbers.");
            return false;
        }

        // Check the length of the input
        if (inputCode.length < codeLength) {
            setCodeError("Colony code is too short. It must be 6 digits.");
            return false;
        }

        if (inputCode.length > codeLength) {
            setCodeError("Colony code is too long. It must be 6 digits.");
            return false;
        }

        // Convert to number after all string checks are done
        const numericCode = Number(inputCode);
        if (Number.isNaN(numericCode)) {
            setCodeError("Not a number.")
        }

        // Check if the number is negative (although this should never happen given the regex check)
        if (numericCode < 0) {
            setCodeError("Colony code cannot be negative.");
            return false;
        }

        setCodeError(undefined)
        setColonyCode(numericCode.toString());
        return true;
    }
    
    const computedInputStyle = createMemo(() => css`
        ${Styles.MENU_INPUT}
        ${inputStyleOverwrite}
    `)
    return (
        <div>
            {props.context.text.Title('MENU.PAGE_TITLE.JOIN_COLONY')({styleOverwrite: pageTitleStyle})}
            <div>
                <div class={inputContainerStyle}>
                    {props.context.text.SubTitle('MENU.SUB_TITLE.INSERT_CODE_HERE')({})}
                    <input
                        id="ColonyCode"
                        type="number"
                        value={colonyCode()}
                        placeholder="123 123"
                        onInput={(e) => setColonyCode(e.currentTarget.value)}
                        onFocus={() => setInputEngaged(true)}
                        class={computedInputStyle()}
                    />
                </div>
            </div>
            {codeError() && inputEngaged() && <SectionSubTitle styleOverwrite={errMsgStyle}>{codeError()}</SectionSubTitle>}
            <NavigationFooter
                text={props.context.text} 
                goBack={{ name: "MENU.NAVIGATION.BACK", func: props.goBack }} 
                goNext={{ name: "MENU.OPTION.JOIN_COLONY", func: handleJoin}}
                goNextEnabled={createMemo(() => checkInput() && inputEngaged())}
            />
            <StarryBackground/>
        </div>
    )
}
export default JoinColonyPage;

const errMsgStyle = css`
    position: absolute;
    filter: none;
    font-size: 1.5rem;
    top: 65%;
    left: 50%;
    transform: translateX(-50%);
`
const pageTitleStyle = css`
    font-size: 5rem;
    width: 50%;
`

const inputStyleOverwrite = css`
    font-size: 20vh;
    width: 80%;
    height: fit-content;
`

const inputContainerStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 66%;
    left: 50%;
    top: 45%;

    transform: translate(-50%, -50%);
`;