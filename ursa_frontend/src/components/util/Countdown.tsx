import { createSignal, onCleanup, Component, createEffect, Accessor, onMount } from 'solid-js';
import { IStyleOverwritable } from '../../ts/types';

interface CountdownProps extends IStyleOverwritable {
  duration: number;
  onComplete?: () => void;
  cancelSignal?: Accessor<boolean>;
}

const Countdown: Component<CountdownProps> = (props) => {
  const [timeLeft, setTimeLeft] = createSignal(props.duration);
  const [isCanceled, setIsCanceled] = createSignal(false);
  const [timer, setTimer] = createSignal<NodeJS.Timeout | undefined>(undefined);

  onMount(() => {
    setTimer(setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1 || isCanceled()) {
            clearInterval(timer());
            if (props.onComplete && !isCanceled()) {
              props.onComplete();
            }
            return 0;
          }
          return prev - 1;
        });
    }, 1000));

    onCleanup(() => clearInterval(timer()));
  })

  createEffect(() => {
    if (props.cancelSignal && props.cancelSignal()) {
      setIsCanceled(true);
      clearInterval(timer());
    }
  });

  return <div class={props.styleOverwrite}>{timeLeft()}</div>;
};
export default Countdown;