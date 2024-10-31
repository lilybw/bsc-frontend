import { JSX } from 'solid-js';
import { Error, ResErr } from '../../meta/types';
import SomethingWentWrongIcon from '../base/SomethingWentWrongIcon';

type UnwrapTuple<T extends any[]> = ResErr<T[number]> | { [K in keyof T]: ResErr<T[K]> };

interface UnwrapProps<T extends any[]> {
    data: UnwrapTuple<T>;
    fallback?: (errors: Error[]) => JSX.Element;
    children: (...args: T) => JSX.Element;
}

const Unwrap = <T extends any[]>(props: UnwrapProps<T>) => {
    const { data, fallback, children } = props;
    const normalized = Array.isArray(data) ? data : [data];
    const errors = [];
    const successes = [];

    for (const item of normalized) {
        if (item.err !== null) {
            errors.push(item.err);
        } else {
            successes.push(item.res);
        }
    }

    if (errors.length > 0) {
        return fallback ? fallback(errors) : <SomethingWentWrongIcon message={errors} />;
    }

    return children(...(successes as T));
};

export default Unwrap;
