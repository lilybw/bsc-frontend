import { Component, createSignal, createMemo, onMount } from "solid-js";
import { css } from "@emotion/css";
import { IBackendBased, IInternationalized } from "../../../src/ts/types";
import NTAwait from "../../../src/components/util/NoThrowAwait";
import ActionInput from "../../../src/components/colony/MainActionInput";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../../src/ts/actionContext";
import { createArrayStore } from "../../../src/ts/arrayStore";
import { BigButtonStyle } from "../../../src/sharedCSS";
import BufferBasedButton from "../../../src/components/base/BufferBasedButton";
import GraphicalAsset from "../../../src/components/base/GraphicalAsset";

interface SpacePortInterfaceProps extends IInternationalized, IBackendBased {
  onOpen: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onSlideCompleted: () => void;
}

const timeBetweenKeyStrokesMS = 500;
const baseDelayBeforeDemoStart = 1000;

const SpacePortInterface: Component<SpacePortInterfaceProps> = (props) => {
  const [inputBuffer, setInputBuffer] = createSignal<string>('');
  const [actionContext, setActionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
  const [triggerEnter, setTriggerEnter] = createSignal<() => void>(() => {});
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

  const openButtonText = createMemo(() => props.text.get('COLONY.UI_BUTTON.OPEN').get());
  const joinButtonText = createMemo(() => props.text.get('COLONY.UI_BUTTON.JOIN').get());
  const leaveButtonText = createMemo(() => props.text.get('COLONY.UI_BUTTON.LEAVE').get());

  const simulateTyping = (text: string) => {
    setInputBuffer('');
    for (let i = 0; i < text.length; i++) {
      setTimeout(() => {
        setInputBuffer(prev => prev + text[i]);
      }, baseDelayBeforeDemoStart + i * timeBetweenKeyStrokesMS);
    }
    setTimeout(() => {
      triggerEnter()();
    }, baseDelayBeforeDemoStart * 2 + text.length * timeBetweenKeyStrokesMS);
  };

  onMount(() => {
    simulateTyping(openButtonText());
  });

  const handleOpenActivation = () => {
    props.onOpen();
    setTimeout(() => {
      simulateTyping(joinButtonText());
    }, 1000);
  };

  const handleJoinActivation = () => {
    props.onJoin();
    setTimeout(() => {
      simulateTyping(leaveButtonText());
    }, 1000);
  };

  const handleLeaveActivation = () => {
    props.onLeave();
    setTimeout(() => {
      props.onSlideCompleted();
    }, 1000);
  };

  return (
    <div class={containerStyle}>
      <h1 class={titleStyle}>{props.text.get('LOCATION.SPACE_PORT.NAME').get()}</h1>
      <ActionInput 
        subscribers={bufferSubscribers}
        text={props.text}
        backend={props.backend}
        actionContext={actionContext}
        setInputBuffer={setInputBuffer}
        inputBuffer={inputBuffer}
        triggerEnter={setTriggerEnter}
        demoMode={true}
      />
      <div class={imageContainerStyle}>
        <NTAwait func={() => props.backend.assets.getMetadata(5007)}>
          {(asset) => (
            <GraphicalAsset
              metadata={asset}
              backend={props.backend}
              styleOverwrite={imageStyle}
            />
          )}
        </NTAwait>
      </div>
      <div class={contentContainerStyle}>
        <BufferBasedButton
          onActivation={handleOpenActivation}
          register={bufferSubscribers.add}
          name={openButtonText()}
          buffer={inputBuffer}
          styleOverwrite={css`${BigButtonStyle} ${sideButtonStyle}`}
        />
        <div class={descriptionStyle}>
          <p>{props.text.get('TUTORIAL.MULTPLAYER.DESCRIPTION').get()}</p>
        </div>
        <BufferBasedButton
          onActivation={handleJoinActivation}
          register={bufferSubscribers.add}
          name={joinButtonText()}
          buffer={inputBuffer}
          styleOverwrite={css`${BigButtonStyle} ${sideButtonStyle}`}
        />
      </div>
      <BufferBasedButton
        onActivation={handleLeaveActivation}
        register={bufferSubscribers.add}
        name={leaveButtonText()}
        buffer={inputBuffer}
        styleOverwrite={css`${BigButtonStyle} ${leaveButtonStyle}`}
      />
    </div>
  );
};

const containerStyle = css`
  width: 100%;
  height: 100vh;
  background-color: black;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
`;

const titleStyle = css`
  font-size: 2.5rem;
  margin-bottom: 20px;
`;

const imageContainerStyle = css`
  width: 80%;
  height: 40%;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
`;

const imageStyle = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const contentContainerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
`;

const descriptionStyle = css`
  width: 60%;
  text-align: center;
  border: 2px solid white;
  padding: 15px;
  font-size: 1.2rem;
`;

const sideButtonStyle = css`
  width: 150px;
  height: 60px;
`;

const leaveButtonStyle = css`
  width: 200px;
  height: 60px;
`;

export default SpacePortInterface;