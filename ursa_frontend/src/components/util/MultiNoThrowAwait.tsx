import { createResource, JSX, Show } from "solid-js";
import { Error, ResErr } from "../../meta/types";
import Unwrap from "./Unwrap";
import Spinner from "../base/SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../base/SomethingWentWrongIcon";

type AsyncFunction<T> = () => Promise<ResErr<T>>;
type FunctionArray<T extends any[]> = AsyncFunction<T[number]> | { [K in keyof T]: () => Promise<ResErr<T[K]>> };

export interface NoThrowAwaitProps<T extends any[]> {
    funcs: FunctionArray<T>;
    fallback?: (error: Error) => JSX.Element;
    whilestLoading?: JSX.Element;
    children: (...args: T) => JSX.Element;
}

/**
 * Same as NTAwait, but takes in any amount of functions which return a promise,
 * 
 * and thusly expects a function as child, which takes in that many arguments, whose order 
 * correlates to the order of the functions, and returns a JSX element.
 */
const MNTAwait = <T extends any[]>(props: NoThrowAwaitProps<T>) => {
    const {funcs, fallback, children} = props;

    const executeFuncs = async () => {
        if (typeof funcs === 'function') {
            return await funcs();
        } else {
            return await Promise.all(funcs.map(f => f()));
        }
    };
    const [resource] = createResource(executeFuncs);

    const onFallback = (error: Error | Error[] | any) => {
        return (<>
            {fallback ? fallback(JSON.stringify(error)) : <SomethingWentWrongIcon message={JSON.stringify(error)} />}
        </>)
    }

    return (
        <>
            <Show when={resource.loading}>
                {props.whilestLoading ? props.whilestLoading : <Spinner />}
            </Show>
            <Show when={resource.error}>
                {onFallback(resource.error)}
            </Show>
            <Show when={resource.latest}>
                <Unwrap data={resource.latest! as T} fallback={onFallback} children={children} />
            </Show>
        </>
    );
}
export default MNTAwait;