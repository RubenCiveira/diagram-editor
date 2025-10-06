// src/shared/url/useUrlOnLoad.ts
import * as React from 'react';
import { useUrlStateContext } from './UrlStateProvider';

export function useUrlOnLoad(cb: () => void) {
  const { onLoad } = useUrlStateContext();
  React.useEffect(() => onLoad([], cb), [cb]);
}
