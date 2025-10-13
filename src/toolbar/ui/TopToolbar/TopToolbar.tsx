import React from 'react';
import './TopToolbar.scss';
import { RepositoryManager } from '../../../storage/ui';
import { FileStorage } from '../../../storage/Repository';
import { DiagramModel, EditorMode } from '../../../diagram';
import RepoSelectButton from '../RepoSelectButton/RepoSelectButton';
import { TracesSample } from '../../../storage/TraceSample';
import { MetricsSample } from '../../../storage/MetricSample';
import { AppContext } from '../../../app/AppContext';

type Props = {
  onLoadDiagram(json?: DiagramModel, token?: () => void): void;
  onLoadTraces(trace: TracesSample, token?: () => void): void;
  onLoadMetrics(metrics: MetricsSample, token?: () => void): void;

  getCurrentDiagram(): DiagramModel | null;

  onBusyAcquire?(callback: (release: () => void) => void, msg?: string): void;
  onError?(msg: string): void;

  onModeChange: (m: EditorMode) => void;
};

export default function TopToolbar({
  onLoadDiagram,
  onLoadTraces,
  onLoadMetrics,
  getCurrentDiagram,
  onBusyAcquire,
  onError,
  onModeChange,
}: Props) {
  const context = React.useContext(AppContext);

  const [file, setFile] = React.useState<FileStorage | null>(null);

  const [showConfig, setShowConfig] = React.useState<boolean>(false);

  const runBusy = (callback: (release?: () => void) => void, label: string) => {
    if (onBusyAcquire) {
      onBusyAcquire(callback, label); // ← crea token
    } else {
      callback();
    }
  };

  React.useEffect(() => {
    console.log('UPDATE FILE', file?.name());
    handleLoad();
  }, [file]);

  const loadFile = React.useCallback(async (current: FileStorage | null | undefined, release?: () => void) => {
    const json = await current?.read();
    onLoadDiagram(json, release);
    if (current) {
      onModeChange((await current.isWritable()) ? 'design' : 'readonly');
    }
  }, []);

  const updateConfig = () => {
    setShowConfig(false);
    // TODO: RELOAD REPOS AFTER CONFIG
    // loadRepos();
  };

  const searchMetrics = async () => {
    const sample = await (context.repository as any).searchTracesSample(file) as MetricsSample;
    runBusy(async (release?: () => void) => {
      onLoadMetrics(sample, release);
    }, 'Loading');
  };
  const searchTraces = async () => {
    const sample = await (context.repository as any).searchTracesSample(file) as TracesSample;
    runBusy(async (release?: () => void) => {
      onLoadTraces(sample, release);
    }, 'Loading');
  };

  const handleLoad = async () => {
    runBusy(async (release?: () => void) => {
      loadFile(file, release);
    }, 'Loading');
  };

  const handleSave = async () => {
    const json = getCurrentDiagram();
    if (!json) return onError?.('No hay diagrama en memoria para guardar.');
    if (!file) return onError?.('Selecciona un fichero de destino.');
    runBusy(async (release?: () => void) => {
      try {
        file.write(json);
      } catch (e: any) {
        onError?.(e?.message ?? String(e));
      } finally {
        release?.();
      }
    }, 'Guardando...');
  };

  const handleDelete = async () => {
    if (!file) return onError?.('Selecciona un fichero de destino.');
    if (!confirm(`¿Borrar ${file.name()}?`)) return;
    runBusy(async (release?: () => void) => {
      try {
        await file.delete();
        // FIXME: reload repositories
        // loadFilesOfRepository(repo, '');
      } catch (e: any) {
        onError?.(e?.message ?? String(e));
      } finally {
        release?.();
      }
    }, 'Borrando...');
  };

  return (
    <div className="top-toolbar" role="toolbar" aria-label="Barra de herramientas">
      <button onClick={() => setShowConfig(true)}>Configuración</button>
      <div className="spacer" />

      <RepoSelectButton onSelectFile={setFile} onBusyAcquire={onBusyAcquire} onError={onError} />

      {file && (context.repository as any).searchTracesSample && <button onClick={searchTraces}>Trazas</button>}
      {file && (context.repository as any).searchMetricsSample && <button onClick={searchMetrics}>Metricas</button>}
      <div className="spacer" />

      <div style={{ marginLeft: 'auto' }} />

      <button onClick={handleLoad} disabled={!file}>
        Recargar
      </button>
      <button onClick={handleSave} style={{ background: '#111827', color: '#fff', borderColor: '#111827' }}>
        Guardar
      </button>
      <button onClick={handleDelete} disabled={!file}>
        Borrar
      </button>

      {/* Diálogo de configuración */}
      <RepositoryManager open={showConfig} onClose={() => updateConfig()} />
    </div>
  );
}
