import { Component, createMemo } from "solid-js";
import { css } from "@emotion/css";
import ManagedAsset from "./ManagedAsset";
import { IBackendBased, IStyleOverwritable } from "../ts/types";
import { AssetID } from "../integrations/main_backend/mainBackendDTOs";

interface PlanetWithMoonProps extends IBackendBased, IStyleOverwritable {
  moonAssetOverwrite?: AssetID,
  planetAssetOverwrite?: AssetID,
  size?: number
} 

const PlanetWithMoon: Component<PlanetWithMoonProps> = (props) => {
  
  const cssvars = css`
  --pvm-size: ${props.size ?? 10}vh;
  `;

  const containerStyle = css`
    ${cssvars}
    position: relative;
    width: var(--pvm-size);
    height: var(--pvm-size);
    transform: rotate(45deg);
  `;

  const computedStyles = createMemo(() => css`${containerStyle} ${props.styleOverwrite}`)

  return (
    <div class={computedStyles()}>
      <ManagedAsset styleOverwrite={planetStyle(cssvars)} backend={props.backend} asset={props.planetAssetOverwrite ?? 5}> 
        {[
          (innerProps) => ManagedAsset({styleOverwrite: css`${innerProps.styleOverwrite} ${moonStyle(cssvars)}`, backend: props.backend, asset: props.moonAssetOverwrite ?? 7})
        ]}
      </ManagedAsset>
    </div>
  );
};

export default PlanetWithMoon;

const planetStyle = (cssvars: string) => css`
  ${cssvars}

  display: inherit;
  object-fit: inherit;

  position: absolute;
  width: 64%;
  height: 64%;
  top: 50%;
  left: 50%; 
  transform: translate(-50%, -50%); 

  border-radius: 50%;
  
  background-repeat: repeat;
  background-size: 1000% 100%;
  background: transparent;
  filter: drops-shadow(0 0 5rem black);
  box-shadow: inset -6.4em -6.4em 3.2em #000, -0.96em -0.96em 1.6em #658E66;
  
  animation: rotate 10000s linear infinite;
  @keyframes rotate {
    from {
      background-position: 0px 0;
    }
    to {
      background-position: -2000px 0;
    }
  }
`;

const moonStyle = (cssvars: string) => css`
  ${cssvars}

  display: inherit;
  object-fit: inherit;
  background: transparent;
  width: 6%;
  height: 6%;
  position: absolute;
  top: 50%;
  --base-moon-left: 50%;
  
  animation: rotate 2000s linear infinite, orbit 6s infinite ease-in-out;
  border-radius: 50%;
  box-shadow: inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em #AA653C;

  --orbit-radius: 50%; 
  @keyframes orbit {
    0% {
      z-index: 1; 
      left: calc(var(--orbit-radius) * -1 + var(--base-moon-left));
    }
    49% { 
      z-index: 1; 
      left: calc(var(--orbit-radius) + var(--base-moon-left));
    }
    50% { 
      z-index: -1;
      left: calc(var(--orbit-radius) + var(--base-moon-left));
    }
    99% {
      z-index: -1;
      left: calc(var(--orbit-radius) * -1 + var(--base-moon-left));
    }
    100% {
      left: calc(var(--orbit-radius) * -1 + var(--base-moon-left));
      z-index: 1;
    }
  }
`;