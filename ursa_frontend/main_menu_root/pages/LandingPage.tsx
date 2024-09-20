import { Component } from "solid-js";
import { MenuPageProps, MenuPages } from "../MainMenuApp";
import { css } from "@emotion/css";
import SectionTitle from "../../src/components/SectionTitle";
import BigMenuButton from "../../src/components/BigMenuButton";
import StarryBackground from "../../src/components/StarryBackground";

const LandingPage: Component<MenuPageProps> = (props) => {
    return (
        <div>
            <SectionTitle>U.R.S.A.</SectionTitle>
            <div class={menuOptionsListStyle}>
                <BigMenuButton onClick={() => props.goToPage(MenuPages.NEW_COLONY)}>New</BigMenuButton>
                <BigMenuButton onClick={() => props.goToPage(MenuPages.CONTINUE_COLONY)}>Continue</BigMenuButton>
                <BigMenuButton onClick={() => props.goToPage(MenuPages.JOIN_COLONY)}>Join</BigMenuButton>
                <BigMenuButton>Tutorial</BigMenuButton>
            </div>
            <StarryBackground />
        </div>
    )
}
export default LandingPage;

const landingPageStyles = css`

`
const menuOptionsListStyle = css`
    display: flex;
    flex-direction: column;
    align-items: left;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 33%;
    transform: translate(-50%, -50%);
`
