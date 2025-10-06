import * as React from 'react';
import type { ReactFlowInstance, FitViewOptions } from 'reactflow';

/**
 * Gestiona React Flow instance + fitView de manera segura:
 * - onInit: se guarda la instancia y hace un fitView inicial sólo una vez.
 * - fit(): hace un fitView en el próximo frame (RAF) para evitar bucles.
 */
export function useReactFlowFit() {
  const instanceRef = React.useRef<ReactFlowInstance | null>(null);
  const initDoneRef = React.useRef(false);

  const doFit = React.useCallback((inst: ReactFlowInstance, opts?: FitViewOptions) => {
    // Ejecutar en RAF para no encadenar renders dentro del mismo commit
    requestAnimationFrame(() => {
      try {
        inst.fitView({ padding: 0.2, includeHiddenNodes: true, ...opts });
      } catch {
        // swallow
      }
    });
  }, []);

  const onInit = React.useCallback(
    (inst: ReactFlowInstance) => {
      instanceRef.current = inst;
      if (initDoneRef.current) return;
      initDoneRef.current = true;
      doFit(inst);
    },
    [doFit],
  );

  const fit = React.useCallback(
    (opts?: FitViewOptions) => {
      const inst = instanceRef.current;
      if (!inst) return;
      doFit(inst, opts);
    },
    [doFit],
  );

  return { onInit, fit };
}
