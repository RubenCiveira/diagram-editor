import React from 'react';
import { ReportResult } from '../../../render';

export function useReportDialog() {
  const [openedReport, setOpenedRport] = React.useState(true);
  const [reportContent, setReportContent] = React.useState<string | null>(null);
  const [promise, setPromise] = React.useState<any>(null);

  const openReport = (html: string): Promise<ReportResult> => {
    setOpenedRport( true );
    setReportContent( html );
    return new Promise((resolve) => {
      setPromise( { use: resolve } );
    });
  }

  const onCloseReport = () => {
    setOpenedRport(false);
    setReportContent(null);
    promise.use( { closed: true } );
  };

  return { openedReport, reportContent, openReport, onCloseReport };
}

