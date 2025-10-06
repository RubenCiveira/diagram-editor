// useUrlBind.ts
import * as React from 'react';
import { useUrlStateContext } from './UrlStateProvider';

type BindOptions<T> = {
  replace?: boolean;
  emptyRemoves?: boolean;
  serialize?: (v: T) => string | null;
  deserialize?: (s: string | null) => T;
  waitForInitialLoad?: boolean;
};

export function useUrlBind(
  key: string,
  [value, setValue]: [string | null | undefined, (key: any) => void],
  opts: BindOptions<string | null> = {},
) {
  const { register, update } = useUrlStateContext();

  const {
    replace = true,
    emptyRemoves = true,
    serialize = (v: any) => (v == null ? null : String(v)),
    deserialize = (s: any) => s,
  } = opts;

  // URL → state
  React.useEffect(() => {
    const setter = (s: string | null | undefined) => setValue(deserialize(s || null));
    return register(key, value, setter);
  }, [key, register, setValue, deserialize]);

  // state → URL
  React.useEffect(() => {
    const s = serialize(value || null);
    const normalized = emptyRemoves ? (s == null || s === '' ? null : s) : (s ?? '');
    update(key, normalized, { replace, emptyRemoves });
  }, [value]);
}
