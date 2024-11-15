import { Component } from 'solid-js';
import { GenericLocationCardProps } from './GenericLocationCard';
import NTAwait from '../../util/NoThrowAwait';
import BufferBasedButton from '../../base/BufferBasedButton';
import GraphicalAsset from '../../base/GraphicalAsset';
import {
    STYLE_LOC_CARD_backgroundImageStyle,
    STYLE_LOC_CARD_cardContainerStyle,
    STYLE_LOC_CARD_descriptionStyleOverwrite,
    STYLE_LOC_CARD_lowerThirdWBackgroundStyle,
    STYLE_LOC_CARD_titleStyleOverwrite,
} from './SpacePortLocationCard';

interface HomeLocationCardProps extends GenericLocationCardProps {}

const HomeLocationCard: Component<HomeLocationCardProps> = (props) => {
    return (
        <div class={STYLE_LOC_CARD_cardContainerStyle} id={'location-card-home'}>
            <NTAwait func={() => props.backend.assets.getMetadata(props.info.appearances[0].splashArt)}>
                {(asset) => <GraphicalAsset styleOverwrite={STYLE_LOC_CARD_backgroundImageStyle} backend={props.backend} metadata={asset} />}
            </NTAwait>
            {props.text.Title(props.info.name)({ styleOverwrite: STYLE_LOC_CARD_titleStyleOverwrite })}
            <div class={STYLE_LOC_CARD_lowerThirdWBackgroundStyle}>
                {props.text.SubTitle(props.info.description)({ styleOverwrite: STYLE_LOC_CARD_descriptionStyleOverwrite })}
                <BufferBasedButton
                    name={props.text.get('LOCATION.USER_ACTION.LEAVE').get()}
                    buffer={props.buffer}
                    register={props.register}
                    onActivation={props.closeCard}
                />
            </div>
        </div>
    );
};

export default HomeLocationCard;
