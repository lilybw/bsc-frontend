import { Component, JSX, Show } from "solid-js";
import { Error, ResErr } from "../../meta/types";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";

interface UnwrapProps<T extends any[]> {
    data: ResErr<T[number]> | ResErr<T[number]>[];
    fallback?: (error: Error) => JSX.Element;
    children: (...data: T) => JSX.Element;
}
// R is needed here or else the syntax highlighting will break
const Unwrap = <T extends any[], R>(props: UnwrapProps<T>) => {
    const { data, fallback, children } = props;
    const normalized = Array.isArray(data) ? data : [data];
    const errors: Error[] = [];
    const successes: T[number] = [];
    for (const item of normalized) {
        if (item.err !== null) {
            errors.push(item.err);
        } else {
            successes.push(item.res);
        }
    }
    
    if (errors.length > 0) {
        return (
            <>
            {fallback ? fallback(errors.join(", \n")) : <SomethingWentWrongIcon message={errors[0]} />}
            </>
        );
    }

    return (
        <>
        {children(...successes)}
        </>
    )
}
export default Unwrap;