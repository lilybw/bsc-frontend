import { Accessor, Component, createSignal, For } from 'solid-js';
import { AssetCollectionID, TransformDTO } from '../../integrations/main_backend/mainBackendDTOs';
import { IBackendBased, IStyleOverwritable } from '../../ts/types';
import { css } from '@emotion/css';
import NTAwait from '../util/NoThrowAwait';
import { combineTransforms, GlobalHashPool } from '../../ts/ursaMath';
import { Styles } from '../../styles/sharedCSS';
import { WrappedSignal } from '../../ts/wrappedSignal';
import GraphicalAsset from '../base/GraphicalAsset';

interface AssetCollectionProps extends IBackendBased, IStyleOverwritable {
    id: AssetCollectionID;
    topLevelTransform?: WrappedSignal<TransformDTO>;
}

const AssetCollection: Component<AssetCollectionProps> = (props) => {
    const [collectionName, setCollectionName] = createSignal<string>('unknown-collection...');

    const computedContainerStyle = (transform?: TransformDTO) => css`
        ${Styles.POSITION.transformToCSSVariables(transform)}
        ${props.topLevelTransform ? Styles.POSITION.TRANSFORM_APPLICATOR : 'position: absolute;'}
        ${props.styleOverwrite}
        width: fit-content;
        height: fit-content;
    `;
    return (
        <div class={computedContainerStyle(props.topLevelTransform?.get())} id={"collection-" + collectionName()}>
            <NTAwait func={() => props.backend.assets.getCollection(props.id)}>
                {(collection) => {
                    setCollectionName(collection.name + ' - ' + GlobalHashPool.next());
                    return (
                        <For each={collection.entries}>
                            {(entry) => (
                                <GraphicalAsset
                                    backend={props.backend}
                                    metadata={entry.asset}
                                    transform={
                                        props.topLevelTransform ? combineTransforms(props.topLevelTransform.get(), entry.transform) : entry.transform
                                    }
                                    styleOverwrite={entryStyleOverwrite}
                                />
                            )}
                        </For>
                    );
                }}
            </NTAwait>
        </div>
    );
};
export default AssetCollection;

const entryStyleOverwrite = css`
    position: absolute;
`;
