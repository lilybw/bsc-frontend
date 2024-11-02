import StarryBackground from '@/components/base/StarryBackground';
import { IBackendBased, IInternationalized } from '@/ts/types';
import { JSX } from 'solid-js/jsx-runtime';

interface MultiplayerTrialProps extends IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

export default function MultiplayerTrial(props: MultiplayerTrialProps): JSX.Element {
    setTimeout(() => props.onSlideCompleted(), 50);
    return (
        <div class="multiplayer-trial">
            <StarryBackground />
            {props.text.SubTitle('TUTORIAL.MULTPLAYER.DESCRIPTION')({})}
        </div>
    );
}
