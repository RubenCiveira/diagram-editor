import React from 'react';
import { ReportDetails, ReportResult } from '../../../../dialog/model';

export function useReportDialog() {
  const [openedReport, setOpenedRport] = React.useState(false);
  const [reportContent, setReportContent] = React.useState<ReportDetails | null>(null);
  const [promise, setPromise] = React.useState<any>(null);

  const openReport = (html: ReportDetails): Promise<ReportResult> => {
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

