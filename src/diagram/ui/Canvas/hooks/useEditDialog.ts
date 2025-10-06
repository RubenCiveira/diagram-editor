import { useCallback, useState } from 'react';
import { FormDetail } from '../../../../dialog/model';

export function useEditDialog() {
  const [editOpened, setOpenedEdit] = useState(false);
  const [formDetail, setFormDetail] = useState<null | FormDetail<any>>();
  const [promise, setPromise] = useState<any>(null);

  const openEdit = useCallback((detail: FormDetail<any>) => {
    setOpenedEdit(true);
    setFormDetail(detail);
    return new Promise((resolve) => {
      setPromise({ use: resolve });
    });
  }, []);

  const onCancelEdit = useCallback(() => {
    promise?.use({ data: formDetail?.value, accepted: false });
    setOpenedEdit(false);
    setFormDetail(null);
  }, []);

  const onSaveEdit = useCallback(
    (updated: { name: string; props: Record<string, any> }) => {
      promise?.use({ data: updated.props, title: updated.name, accepted: true });
      setOpenedEdit(false);
      setFormDetail(null);
    },
    [formDetail],
  );

  return { editOpened, formDetail, openEdit, onCancelEdit, onSaveEdit };
}
