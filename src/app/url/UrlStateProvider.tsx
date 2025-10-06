import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

type Options = {
  /** Si true, al escribir "" o null elimina la clave del query. Por defecto true. */
  emptyRemoves?: boolean;
  /** Si true usa history.replace; si false, push. Por defecto true. */
  replace?: boolean;
  /** Serializadores personalizados (útil para tipos especiales). */
  serialize?: (v: unknown) => string | null;
  deserialize?: (s: string | null) => any;
};

type Ctx = {
  update: (key: string, value: string | null | undefined, opts?: Pick<Options, 'emptyRemoves' | 'replace'>) => void;
  onLoad: (keys: string[], cb: () => void) => void;
  register: (key: string, getter: string | null | undefined, setter: (v: string | null | undefined) => void) => () => void;
};

const UrlStateContext = React.createContext<Ctx | null>(null);

export function UrlStateProvider({ children }: { children: React.ReactNode }) {
  const loaders = React.useRef(new Map<string, () => void>());
  const registry = React.useRef(new Map<string, Set<[string | null, (v: string | null) => void]>>());

  // const [flush, setFlush] = React.useState(false);
  const [urlReady, setUrlReady] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    registry.current.forEach((setters, key) => {
      const val = params.get(key);
      setters.forEach(([, s]) => {
        s(val);
      });
    });
    setUrlReady(true);
  }, [location.search]);

  React.useEffect(() => {
    if (!urlReady) return;
    let set = loaders.current;
    set.forEach((fn) => fn());
  }, [urlReady]);

  const [, setSearchParams] = useSearchParams();
  const pendingRef = React.useRef<Record<string, string | null>>({});

  const update = React.useCallback(
    (key: string, value: string | null | undefined) => {
      pendingRef.current[key] = value || null;
      setTimeout(() => {
        setSearchParams(
          (prev) => {
            const params = new URLSearchParams(prev);
            registry.current.forEach((setters, key) => {
              setters.forEach(([v]) => {
                if (v) {
                  params.set(key, v);
                } else {
                  params.delete(key);
                }
              });
            });
            return params;
          },
          { replace: true },
        );
      });
    },
    [],
  );

  const ctx: Ctx = {
    update: (key: string, value: string | null | undefined): void => {
      update(key, value);
    },
    register: (key: string, getter: string | null | undefined, setter: (v: string | null) => void): (() => void) => {
      const row = [getter, setter] as any;
      let set = registry.current.get(key);
      if (!set) registry.current.set(key, (set = new Set()));
      set.add(row);
      return () => {
        const s = registry.current.get(key);
        if (!s) return;
        s.delete(row);
        if (s.size === 0) registry.current.delete(key);
      };
    },
    onLoad: (_keys: string[], cb: () => void): void => {
      let set = loaders.current;
      const key = '' + cb;
      set.set(key, cb);
    },
  };
  return <UrlStateContext.Provider value={ctx}>{children}</UrlStateContext.Provider>;
}

export function useUrlStateContext() {
  const ctx = React.useContext(UrlStateContext);
  if (!ctx) throw new Error('useUrlStateContext must be used within UrlStateProvider');
  return ctx;
}

