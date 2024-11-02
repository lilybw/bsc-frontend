import StarryBackground from '@/components/base/StarryBackground';
import { IInternationalized, IStyleOverwritable, IBackendBased } from '@/ts/types';
import { JSX } from 'solid-js/jsx-runtime';

interface LocationTrialProps extends IInternationalized, IStyleOverwritable, IBackendBased {
    onSlideCompleted: () => void;
}

export default function LocationTrial(props: LocationTrialProps): JSX.Element {
    setTimeout(() => props.onSlideCompleted(), 50);
    return (
        <div class="location-trial">
            <StarryBackground />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({})}
            {props.text.SubTitle('TUTORIAL.LOCATION_TRIAL.DESCRIPTION')({})}
            <h1>Location Trial</h1>
            <p>This is a trial of a location component.</p>
            <p>Click the "Next" button to continue.</p>
        </div>
    );
}
