import './App.scss';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import DiagramEditor, { type DiagramEditorHandle } from '../diagram/ui/Canvas/DiagramEditor';
import type { DiagramModel, EditorMode } from '../diagram';

import { ErrorBanner, LoadingOverlay } from './ui';

import TopToolbar from '../toolbar/ui/TopToolbar/TopToolbar';
import { PaletteDrawer, ActionPalette } from '../palette/ui';

// ⚙️ Estilos globales básicos (reset, variables, modales, overlay, etc.)
import { AppContext, AppContextValue } from './AppContext';
import { FileStorage } from '../storage/Repository';

import { ModularAppPalette } from '../palette/providers/modular-app';
import { LocalStorage } from '../storage/providers/local/LocalProvider';
import { UrlStateProvider } from './url/UrlStateProvider';
import { FEATURE_FLAGS } from './FeatureFlags';
import { AppwriteProvider } from '../storage/providers/appwrite/AppwriteProvider';
import { useEditDialog } from '../diagram/ui/Canvas/hooks/useEditDialog';
import { useReportDialog } from '../diagram/ui/Canvas/hooks/useReportDialog';
import { ReportResult, ReportDetails, FormDetail, DiagramRender } from '../dialog/model';
import { attachDiagramRender } from '../dialog/dialogGateway';
import EditNodeDialog from '../dialog/uid/EditDialog/EditNodeDialog';
import ReportDialog from '../dialog/uid/ReportDialog/ReportDialog';

export default function App() {
  const fileRef = React.useRef<FileStorage | null>(null);
  const editorRef = React.useRef<DiagramEditorHandle | null>(null);
  const topRef = React.useRef<HTMLDivElement | null>(null);

  let repository;
  if (FEATURE_FLAGS.appWriteRepo) {
    repository = new AppwriteProvider();
  } else {
    repository = new LocalStorage();
  }

  const context = {
    palette: ModularAppPalette,
    repository: repository,
    currentFile: fileRef.current,
  } as AppContextValue;

  const [mode, setMode] = React.useState<EditorMode>('design');
  const [error, setError] = React.useState<string | null>(null);
  const [diagram, setDiagram] = React.useState<DiagramModel | null>(null);
  const [diagramKey, setDiagramKey] = React.useState<number>(0);
  const [busyStack, setBusyStack] = React.useState<any[]>([]);

  const [showPalette, setShowPalette] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);

  const { editOpened, formDetail, openEdit, onCancelEdit, onSaveEdit } = useEditDialog();
  const { openedReport, reportContent, openReport, onCloseReport } = useReportDialog();

  const render: DiagramRender = {
    async showEdit(props: FormDetail<any>): Promise<any> {
      return openEdit(props);
    },
    async showReport(html: ReportDetails): Promise<ReportResult> {
      return openReport(html);
    },
  };
  attachDiagramRender(render);

  const updateGraph = React.useCallback((json: DiagramModel) => {
    const val = { ...json };
    val.updatedAt = new Date().toISOString();
    setDiagram(val);
  }, []);

  const idRef = React.useRef(0);
  // Adquirir un motivo de busy. Devuelve un "disposer" para liberarlo.
  const acquireBusy = React.useCallback((callback: (release: () => void) => void, label?: string) => {
    const id = ++idRef.current;
    setBusyStack((prev) => [...prev, { id, label, startedAt: performance.now() }]);
    // Disposer: elimina este id del stack
    const release = () => {
      setTimeout(() => {
        setBusyStack((prev) => prev.filter((e) => e.id !== id));
      });
    };
    setTimeout(() => {
      callback(release);
    });
  }, []);

  // Derivados para el overlay
  const busyVisible = busyStack.length > 0;
  const busyLabel = busyStack.length
    ? (busyStack[busyStack.length - 1].label ?? 'Trabajando…') // última etiqueta
    : undefined;

  // Medir la altura de la toolbar y fijarla en --topbar-h
  React.useLayoutEffect(() => {
    const el = topRef.current;
    const height = el?.offsetHeight;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty('--topbar-h', `${height}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  const handleError = React.useCallback((msg: string) => setError(msg), []);

  const handleLoadDiagram = React.useCallback((json: DiagramModel, release?: () => void) => {
    setDiagramKey((k) => k + 1);
    setTimeout(() => {
      setDiagram(json);
      setTimeout(() => {
        release?.();
      }, 100);
    }, 100);
  }, []);

  const getCurrentDiagram = React.useCallback((): DiagramModel | null => {
    const fromRef = editorRef.current?.serialize?.();
    return fromRef || diagram;
  }, [diagram]);

  // Guardado rápido (CMD/CTRL+S)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        (async () => {
          const json = getCurrentDiagram();
          if (!json) return setError('No hay diagrama para guardar.');
          const file = fileRef.current;
          acquireBusy(async (release: () => void) => {
            try {
              if (file) {
                await file.write(json);
              }
            } catch (err: any) {
              setError(err?.message ?? String(err));
            } finally {
              release?.();
            }
          }, 'Guardando...');
        })();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [getCurrentDiagram, acquireBusy]);

  // ➕ handler de creación desde la paleta
  const handlePickFromPalette = React.useCallback((kind: string) => {
    const ed = editorRef.current as any;
    if (ed?.createFromPalette) ed.createFromPalette(kind);
    else if (ed?.add) ed.add(kind);
    else alert('Expón createFromPalette(kind) o add(kind) en DiagramEditor.');
    setShowPalette(false);
  }, []);

  const updating = React.useRef(false);

  const updateDiagram = React.useCallback(
    (newDiagram: DiagramModel) => {
      if (updating.current) {
        return;
      }
      updating.current = true;
      const old = JSON.stringify(diagram);
      const cur = JSON.stringify(newDiagram);
      if (old !== cur) {
        setDiagram(newDiagram);
        setTimeout(() => {
          updating.current = false;
        }, 1000);
      }
    },
    [diagram, setDiagram],
  );

  const validatorHandler = React.useRef<any>(null);

  const validate = React.useCallback(() => {
    if (null != validatorHandler.current) {
      clearTimeout(validatorHandler.current);
    }
    if (context.palette!.validators && diagram) {
      const txt = JSON.stringify(diagram);
      const pendings = [] as Promise<void>[];
      context.palette!.validators.forEach((callback) => {
        pendings.push(callback(diagram));
      });
      Promise.all(pendings).then(() => {
        const changed = JSON.stringify(diagram);
        if (txt !== changed) {
          diagram.updatedAt = new Date().toISOString();
        }
        validatorHandler.current = setTimeout(validate, 6000);
      });
    } else {
      validatorHandler.current = setTimeout(() => {
        validate();
      }, 6000);
    }
  }, [diagram, setDiagram]);

  const Gate = repository.gateComponent();

  const [openGate, setOpenGate] = React.useState<boolean>(!!Gate);

  React.useEffect(() => {
    validate();
  }, [diagram]);

  if (Gate && openGate) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.45)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          style={{
            width: 420,
            maxWidth: '92vw',
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,.25)',
          }}
        >
          <Gate onReady={() => setOpenGate(false)} />
        </div>
      </div>
    );
  }

  const body = (
    <div className="app-shell">
      {/* Toolbar */}
      <div ref={topRef}>
        <TopToolbar
          mode={mode}
          onModeChange={setMode}
          onLoadDiagram={handleLoadDiagram}
          getCurrentDiagram={getCurrentDiagram}
          onBusyAcquire={acquireBusy}
          onError={handleError}
        />
      </div>

      {/* Editor */}
      <main className="main-container">
        <DiagramEditor
          key={diagramKey}
          ref={editorRef}
          mode={mode}
          onModeChange={setMode}
          initialDiagram={diagram || { version: '1.0', nodes: [], edges: [], views: [] }}
          onOpenPalette={() => setShowPalette(true)}
          onOpenActions={() => setShowActions(true)}
          onUpdateDiagram={(diagram) => updateDiagram(diagram)}
          onBusyAcquire={acquireBusy}
        />
      </main>

      {/* Paleta lateral */}
      <PaletteDrawer
        items={Object.fromEntries(context.palette!.nodes.map((t) => [t.kind, t])) as any}
        open={showPalette}
        onClose={() => setShowPalette(false)}
        onPick={handlePickFromPalette}
      />

      <ActionPalette
        actions={context.palette!.actions}
        open={showActions}
        onClose={() => setShowActions(false)}
        getGraph={() => diagram}
        getCanva={editorRef.current?.getCanva}
        setGraph={updateGraph}
        // onShowHtml={(html) => onShowHtml(html)}
        title="Acciones del diagrama"
      />

      {/* Overlay global de carga */}
      <LoadingOverlay show={busyVisible} label={busyLabel} />

      {/* Errores */}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
    </div>
  );

  return (
    <BrowserRouter>
      <UrlStateProvider>
        <AppContext.Provider value={context}>{body}</AppContext.Provider>
        {/* Diálogo de edición */}
        <EditNodeDialog
          readOnly={mode == 'readonly'}
          open={editOpened}
          typeDef={formDetail || null}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
        />
        {/* Report dialog */}
        <ReportDialog open={openedReport} details={reportContent ?? null} onClose={onCloseReport} />
      </UrlStateProvider>
    </BrowserRouter>
  );
}
