import { Component, createEffect, createSignal, For } from "solid-js";
import { ColonyInfoResponseDTO, LocationInfoResponseDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { IBackendBased, IInternationalized, IBufferBased } from "../../ts/types";
import { IEventMultiplexer } from "../../integrations/multiplayer_backend/eventMultiplexer";
import Location from "../colony/location/Location";
import NTAwait from "../util/Await";
import { Camera } from "../../ts/camera";

interface PathGraphProps extends IBackendBased, IInternationalized, IBufferBased {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    camera: Camera;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [baselineWidth, setBaselineWidth] = createSignal(1920);
    const [baselineHeight, setBaselineHeight] = createSignal(1080);
    const [distanceNormalizationScalarX, setDistanceNormalizationScalarX] = createSignal(1);
    const [distanceNormalizationScalarY, setDistanceNormalizationScalarY] = createSignal(1);
    const [graphicAssetScalar, setGraphicAssetScalar] = createSignal(1);

    const calculateScalars = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setBaselineWidth(viewportWidth);
        setBaselineHeight(viewportHeight);
        
        const dnsX = viewportWidth / baselineWidth();
        const dnsY = viewportHeight / baselineHeight();
        setDistanceNormalizationScalarX(dnsX);
        setDistanceNormalizationScalarY(dnsY);
        
        setGraphicAssetScalar(Math.min(dnsX, dnsY));
    };

    const debouncedCalculateScalars = debounce(calculateScalars, 250);

    createEffect(() => {
        fetchPaths();
        calculateScalars();
        window.addEventListener('resize', debouncedCalculateScalars);
        return () => window.removeEventListener('resize', debouncedCalculateScalars);
    });

    const fetchPaths = async () => {
        try {
            const pathData = await props.backend.getColonyPathGraph(props.colony.id);
            if (pathData.err || !pathData.res) {
                throw new Error(pathData.err || "No response data");
            }
            setPaths(pathData.res.paths); // Directly setting `paths` as `{ from: number; to: number }[]`
        } catch (error) {
            console.error("Error fetching paths:", error);
        }
    };

    // Type guard to confirm locationInfo is of type LocationInfoResponseDTO
    function isLocationInfoResponseDTO(
        data: any
    ): data is LocationInfoResponseDTO {
        return (
            data &&
            typeof data.id === "number" &&
            typeof data.name === "string" &&
            typeof data.description === "string" &&
            Array.isArray(data.appearances) &&
            typeof data.minigameID === "number"
        );
    }

    return (
        <div class={containerStyle}>
            <svg width="100%" height="100%">
                <For each={paths()}>
                    {(path) => {
                        const fromLocation = props.colony.locations.find(l => l.id === path.from);
                        const toLocation = props.colony.locations.find(l => l.id === path.to);
                        if (fromLocation && toLocation) {
                            const fromPos = {
                                x: fromLocation.transform.xOffset * distanceNormalizationScalarX(),
                                y: fromLocation.transform.yOffset * distanceNormalizationScalarY()
                            };
                            const toPos = {
                                x: toLocation.transform.xOffset * distanceNormalizationScalarX(),
                                y: toLocation.transform.yOffset * distanceNormalizationScalarY()
                            };
                            return (
                                <line
                                    x1={fromPos.x}
                                    y1={fromPos.y}
                                    x2={toPos.x}
                                    y2={toPos.y}
                                    stroke="black"
                                    stroke-width={2 * graphicAssetScalar()}
                                />
                            );
                        }
                        return null;
                    }}
                </For>
            </svg>
            <For each={props.colony.locations}>
                {(location) => (
                    <NTAwait
                        func={() => props.backend.getLocationInfo(location.id)}
                        fallback={(error) => () => <div>Error loading location: {error.message}</div>}
                    >
                        {(locationInfo) =>
                            isLocationInfoResponseDTO(locationInfo) ? (
                                <Location
                                    colonyLocation={location}
                                    location={locationInfo}
                                    dns={() => ({ x: distanceNormalizationScalarX(), y: distanceNormalizationScalarY() })}
                                    gas={graphicAssetScalar}
                                    plexer={props.plexer}
                                    camera={props.camera}
                                    backend={props.backend}
                                    buffer={props.buffer}
                                    text={props.text}
                                    styleOverwrite=""
                                    register={() => { return () => {}; }}
                                />
                            ) : (
                                <div>Error loading location data</div>
                            )
                        }
                    </NTAwait>
                )}
            </For>
        </div>
    );
};

function debounce(func: Function, wait: number) {
    let timeout: number | undefined;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait) as unknown as number;
    };
}

export default PathGraph;

const containerStyle = css`
    width: 100%;
    height: 100%;
    position: relative;
`;
