import { Component, createEffect, createResource, createSignal, For } from "solid-js"
import { MenuPageProps } from "../MainMenuApp"
import { ColonyInfoResponseDTO, ColonyOverviewReponseDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { ResCodeErr } from "../../src/meta/types";
import SectionTitle from "../../src/components/SectionTitle";
import SomethingWentWrongIcon from "../../src/components/SomethingWentWrongIcon";
import Spinner from "../../src/components/SimpleLoadingSpinner";
import { css } from "@emotion/css";
import StarryBackground from "../../src/components/StarryBackground";
import ColonyListEntry from "./ColonyListEntry";
import NavigationFooter from "../NavigationFooter";

const ColonyListPage: Component<MenuPageProps> = (props) => {
    const [colonyListReq, setColonyListReq] = createResource<ResCodeErr<ColonyOverviewReponseDTO>>(async () => {
        return Promise.resolve(props.context.backend.getColonyOverview(props.context.player.id))
    });

    const [selectedColonyId, setSelectedColonyId] = createSignal<number | null>(null);

    async function handleGoToColony() {
        if (selectedColonyId() !== null) {
            const openColonyResponse = await props.context.backend.getColony(props.context.player.id, Number(selectedColonyId()));

            props.context.logger.log("[DELETE ME] implement redirect here!")
        }
    }

    const appendSomethingWentWrong = () => {
        if (colonyListReq.error) {
            return <SomethingWentWrongIcon styleOverwrite={spinnerStyleOverwrite} message={(colonyListReq.error as Error).message} />
        }
        return <></>
    }

    const appendLoadingSpinner = () => {
        if (colonyListReq.loading) {
            return <Spinner styleOverwrite={spinnerStyleOverwrite} />
        }
        return <></>
    }

    const appendNoColoniesYet = () => {
        if (colonyListReq.state === "ready" && colonyListReq.latest?.res!.colonies.length === 0) {
            return <h3>No colonies found</h3>
        }
        return <></>
    }

    const appendColonyList = () => {
        if (colonyListReq.state === "ready" && colonyListReq.latest?.res!.colonies.length > 0) {
            return (
                <>
                <div class={colonyListBackgroundStyle}/>
                <div class={colonyListStyle}>
                <For each={colonyListReq.latest?.res!.colonies}>{(colony: ColonyInfoResponseDTO) =>
                    <ColonyListEntry 
                        colony={colony} 
                        onClick={() => setSelectedColonyId(colony.id)} 
                        isSelected={selectedColonyId() === colony.id}
                    />
                }</For>
                </div>
                </>
            )
        }
        return <></>
    }

    return (
        <div>
            <SectionTitle styleOverwrite={css`font-size: 5rem;`}>Select</SectionTitle>
            {appendSomethingWentWrong()}
            {appendNoColoniesYet()}
            {appendColonyList()}
            {appendLoadingSpinner()}
            <NavigationFooter 
                goBack={{name: "Back", func: props.goBack}} 
                goNext={{name: "Confirm", func: handleGoToColony}} 
                goNextEnabled={() => selectedColonyId() !== null}
            />
            <StarryBackground />
        </div>
    )
}

export default ColonyListPage;

const colonyListBackgroundStyle = css`
    display: flex;
    flex-direction: column;

    position: absolute;
    width: 66%;
    height: 32rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem;
    gap: 1rem;

    border-radius: 5%;
    border: .25rem solid white;
    border-left: 0px;
    border-right: 0px;

    backdrop-filter: blur(.5rem);
    -webkit-backdrop-filter: blur(.5rem);  // For Safari support
    box-shadow: 0 0 1rem rgba(255, 255, 255, .2) inset, 0 0 1rem black;
`

const colonyListStyle = css`
    ${colonyListBackgroundStyle}
    justify-content: flex-start;
    align-items: center;

    top: 10.5rem;
    border: none;
    height: 31rem;
    width: 64%;
    transform: translateX(-50%);

    overflow: visible;
    overflow-y: scroll;
    overflow-x: hidden;

    backdrop-filter: none;
    -webkit-backdrop-filter: none;  // For Safari support
    box-shadow: none;
    
    // Custom scrollbar styles
    &::-webkit-scrollbar {
        width: 1rem;
    }
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        margin: 2rem;
        border-radius: 1rem;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 1); 
        width: 1rem;
        border: .1rem solid black;  // Creates padding around the thumb, cant have transparency...
        border-radius: 1rem;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
`

const spinnerStyleOverwrite = css`
    margin: 0 auto;
    display: block;
    padding: 1rem;
    height: 3rem;
    width: 3rem;
`