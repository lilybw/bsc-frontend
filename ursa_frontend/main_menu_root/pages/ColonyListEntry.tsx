import { Component } from "solid-js";
import { ColonyInfoResponseDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";

interface ColonyListEntryProps {
    colony: ColonyInfoResponseDTO;
    onClick: () => void;
    styleOverwrite?: string;
}

const ColonyListEntry: Component<ColonyListEntryProps> = (props) => {
    return (
        <div class={css`${listEntryStyles} ${props.styleOverwrite}`} onClick={props.onClick}>
            <h3>{props.colony.name}</h3>
            <h3>{props.colony.latestVisit}</h3>
            <h3>{props.colony.accLevel}</h3>
        </div>
    )
}
export default ColonyListEntry;

const listEntryStyles = css`
    color: white;
    justify-content: left;
    border: 1px solid white;
    border-radius: 1rem;
    padding: .3rem;
    width: 100%;

    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-items: center;
    gap: .5rem;
    cursor: pointer;

    &:hover {
        border: 1px solid white;
        box-shadow: inset 0 0 10px white;
        background-color: rgba(0, 0, 0, 0.7);
        text-shadow: 2px 2px 4px white;
    }
`