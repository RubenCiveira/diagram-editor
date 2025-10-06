import { useCallback, useState } from 'react';
import type { DiagramNode } from '../../..';
import { FormDetail } from '../../../render';

export function useEditDialog(setNodes: (updater: any) => void) {
  const [editOpened, setOpenedEdit] = useState(false);
  const [formDetail, setFormDetail] = useState<null | FormDetail<any>>();
  const [promise, setPromise] = useState<any>(null);

  const openEdit = useCallback((detail: FormDetail<any>) => {
    setOpenedEdit(true);
    setFormDetail( detail );
    return new Promise((resolve) => {
      setPromise( { use: resolve } );
    });
  }, []);

  const onCancelEdit = useCallback(() => {
    setOpenedEdit(false);
    setFormDetail(null);
    promise.use( { data: formDetail?.value, accepted: false } );
  }, []);

  const onSaveEdit = useCallback(
    (updated: { name: string; props: Record<string, any> }) => {
      setNodes((ns: any[]) =>
        ns.map((n) =>
          n.id === formDetail?.id
            ? { ...n, data: { ...(n.data as DiagramNode), name: updated.name, props: updated.props } }
            : n,
        ),
      );
      setOpenedEdit(false);
      setFormDetail(null);
      promise.use( { data: updated.props, accepted: true} );
    },
    [setNodes, formDetail],
  );

  return { editOpened, formDetail, openEdit, onCancelEdit, onSaveEdit };
}
