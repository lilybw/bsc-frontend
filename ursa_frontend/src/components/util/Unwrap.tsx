import { Component, JSX, Show } from "solid-js";
import { Error, ResErr } from "../../meta/types";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";

interface UnwrapProps<T> {
    func: () => ResErr<T>;
    fallback?: (error: Error) => JSX.Element;
    children: (data: T) => JSX.Element;
}
// R is needed here or else the syntax highlighting will break
const Unwrap = <T, R>(props: UnwrapProps<T>) => {
    const {func, fallback, children} = props;
    const res = func();
    return (
        <>
        <Show when={res.err !== null}>
        {fallback ? fallback(res.err!) : <SomethingWentWrongIcon message={res.err} />}
        </Show>
        <Show when={res.res !== null}>
            {children(res.res!)}
        </Show>
        </>
    )
}
export default Unwrap;