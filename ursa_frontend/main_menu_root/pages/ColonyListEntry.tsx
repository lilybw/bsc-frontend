import { Component } from "solid-js";
import { ColonyInfoResponseDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";

interface ColonyListEntryProps {
    colony: ColonyInfoResponseDTO;
    onClick: () => void;
    isSelected: boolean;
}

const ColonyListEntry: Component<ColonyListEntryProps> = (props) => {
    const getTimeAgo = (dateString: string) => {
        console.log("Received date string:", dateString); // Debug log

        if (!dateString) {
            console.error("Date string is empty or undefined");
            return 'Unknown';
        }

        let visitDateTime: Date;
        try {
            visitDateTime = new Date(dateString);
            console.log("Parsed date:", visitDateTime.toISOString()); // Debug log

            if (isNaN(visitDateTime.getTime())) {
                throw new Error('Invalid date');
            }
        } catch (error) {
            console.error(`Error parsing date: ${dateString}`, error);
            return 'Unknown';
        }

        const now = new Date();
        console.log("Current date:", now.toISOString()); // Debug log

        // Calculate time difference in minutes, hours, days
        const diffMs = now.getTime() - visitDateTime.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        console.log("Time difference:", { diffMinutes, diffHours, diffDays }); // Debug log

        if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
    };

    return (
        <div 
            class={`${listEntryStyles} ${props.isSelected ? selectedStyles : ''}`}
            onClick={props.onClick}
        >
            <h3>{props.colony.name}</h3>
            <h3>{getTimeAgo(props.colony.latestVisit)}</h3>
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
    transition: all 0.3s ease;

    &:hover {
        border: 1px solid #00ffff;
        box-shadow: 0 0 10px #00ffff;
    }
`;

const selectedStyles = css`
    background-color: rgba(0, 255, 255, 0.2);
    border: 1px solid #00ffff;
    box-shadow: 0 0 15px #00ffff;

    &:hover {
        background-color: rgba(0, 255, 255, 0.3);
        box-shadow: 0 0 20px #00ffff;
    }
`;