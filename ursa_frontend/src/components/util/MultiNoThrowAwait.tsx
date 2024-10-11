import { Component, createResource, JSX, Show } from "solid-js";
import Spinner from "../SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";
import { Error, ResErr } from "../../meta/types";
import Unwrap from "./Unwrap";

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
 * and thusly expects and function as child, which takes in that many arguments, correlating to the return
 * type of the functions (in order), and returns a JSX element.
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
    return (
        <>
            <Show when={resource.loading}>
                {props.whilestLoading ? props.whilestLoading : <Spinner />}
            </Show>
            <Show when={resource.error}>
                {fallback ? fallback(resource.error) : <SomethingWentWrongIcon message={JSON.stringify(resource.error)} />}
            </Show>
            <Show when={resource.latest}>
                <Unwrap data={resource.latest!} fallback={fallback} children={children} />
            </Show>
        </>
    );
}
export default MNTAwait;