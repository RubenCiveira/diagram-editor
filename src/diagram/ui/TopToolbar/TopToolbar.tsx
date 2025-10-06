import React from 'react';
import './TopToolbar.scss';
import { RepositoryManager } from '../../../storage/ui';
import type { DiagramModel, EditorMode } from '../..';
import { AppContext } from '../../../app/AppContext';
import { FileStorage, Repository } from '../../../storage/Repository';
import { useUrlBind } from '../../../app/url/useUrlBind';
import { useUrlOnLoad } from '../../../app/url/useUrlOnLoad';

type Props = {
  onLoadDiagram(json?: DiagramModel, token?: () => void): void;
  getCurrentDiagram(): DiagramModel | null;

  onBusyAcquire?(callback: (release: () => void) => void, msg?: string): void;
  onError?(msg: string): void;

  mode: EditorMode;
  onModeChange: (m: EditorMode) => void;
};

export default function TopToolbar({
  onLoadDiagram,
  getCurrentDiagram,
  onBusyAcquire,
  onError,
  mode,
  onModeChange,
}: Props) {
  const [repos, setRepos] = React.useState<Repository[] | null>(null);
  const [repoName, setRepoName] = React.useState<string | null | undefined>();
  const [repo, setRepo] = React.useState<Repository | null>(null);

  const [fileName, setFileName] = React.useState<string | null | undefined>();
  const [files, setFiles] = React.useState<FileStorage[] | null>(null);
  const [file, setFile] = React.useState<FileStorage | null>(null);

  const [loading, _setLoading] = React.useState(false);
  const [showConfig, setShowConfig] = React.useState<boolean>(false);

  const context = React.useContext(AppContext);

  const runBusy = (callback: (release?: () => void) => void, label: string) => {
    if (onBusyAcquire) {
      onBusyAcquire(callback, label); // ← crea token
    } else {
      callback();
    }
  };

  // On set repo name => select Repo
  React.useEffect(() => {
    setRepo(repos?.find((repo) => repo.name() == repoName) || null);
  }, [repoName]);
  // on set file name => seleft File
  React.useEffect(() => {
    setFile(files?.find((file) => file.name() == fileName) || null);
  }, [fileName]);

  // on select file => load content
  React.useEffect(() => {
    runBusy(async (release?: () => void) => {
      try {
        const current = files?.find((file) => file.name() == fileName) || null;
        setFile(current);
        loadFile(current, release);
      } catch (error) {
        onError?.('Error loading diagram');
        release?.();
      }
    }, 'Cargando');
  }, [files, fileName]);

  // On set repo => list files.
  React.useEffect(() => {
    const current = repos?.find((repo) => repo.name() == repoName);
    if (current) {
      loadFilesOfRepository(current, fileName);
    }
  }, [repos, repoName]);

  const loadRepos = React.useCallback(async () => {
    runBusy(async (release?: () => void) => {
      try {
        const availables = (await context.repository?.listRepositories()) || [];
        setRepos(availables);
        const current = availables.find((repo) => repo.name() == repoName);
        if (!current) {
          const first = availables.length ? availables[0] : null;
          setRepo(first);
          setRepoName(first?.name() || '');
        } else if( !repo ) {
          setRepo( current );
        }
      } catch (error) {
        onError?.('Error refreshig repositories');
      } finally {
        release?.();
      }
    }, 'Loading repositories...');
  }, [repo, repoName, fileName]);

  useUrlBind('file', [fileName, setFileName]);
  useUrlBind('repo', [repoName, setRepoName]);
  useUrlOnLoad(loadRepos );

  const loadFilesOfRepository = React.useCallback(
    async (repo: Repository | null | undefined, fileName: string | null | undefined) => {
      runBusy(async (release?: () => void) => {
        try {
          const availables = (await repo?.listFiles()) || [];
          setFiles(availables);
          const current = availables.find((file) => file.name() == fileName);
          if (!current) {
            const first = availables.length ? availables[0] : null;
            setFileName(first?.name() || '');
          }
        } finally {
          release?.();
        }
      }, 'Loading files...');
    },
    [],
  );

  const loadFile = React.useCallback(async (current: FileStorage | null | undefined, release?: () => void) => {
    const json = await current?.read();
    onLoadDiagram(json, release);
    if (current) {
      onModeChange((await current.isWritable()) ? 'design' : 'readonly');
    }
  }, []);

  const updateConfig = () => {
    setShowConfig(false);
    loadRepos();
  };

  // Botón "Cargar" -> ahora actúa como "Recargar"
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

  const handleCreate = async () => {
    if (!repo) return onError?.('Selecciona un repositorio de destino.');
    const name = prompt('Nombre del fichero (ej. my-diagram.json)');
    if (!name) return;
    runBusy(async (release?: () => void) => {
      try {
        await repo?.createFile(name);
        setFileName( name );
        loadFilesOfRepository(repo, name);
      } catch (e: any) {
        onError?.(e?.message ?? String(e));
      } finally {
        release?.();
      }
    }, 'Creando...');
  };

  const handleDelete = async () => {
    if (!file) return onError?.('Selecciona un fichero de destino.');
    if (!confirm(`¿Borrar ${file.name()}?`)) return;
    runBusy(async (release?: () => void) => {
      try {
        await file.delete();
        loadFilesOfRepository(repo, '');
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

      <select id="mode" value={mode} onChange={(e) => onModeChange(e.target.value as EditorMode)}>
        <option value="design">Diseño</option>
        <option value="edit">Edición</option>
        <option value="readonly">Solo lectura</option>
      </select>

      <label>Repos {repoName}</label>
      <select value={repoName || ''} onChange={(e) => setRepoName(e.target.value)}>
        <option value="" disabled>
          — Selecciona —
        </option>
        {(repos || [])
          .map((f) => f.name())
          .map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
      </select>

      <label>Fichero:</label>
      <select value={fileName || ''} onChange={(e) => setFileName(e.target.value)}>
        <option value="" disabled>
          — Selecciona —
        </option>
        {(files || [])
          .map((f) => f.name())
          .map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
      </select>
      <button onClick={() => loadRepos()} disabled={loading}>
        {loading ? 'Cargando…' : 'Refrescar'}
      </button>

      <div className="spacer" />

      <button onClick={handleCreate}>Crear</button>
      <button onClick={handleDelete} disabled={!fileName}>
        Borrar
      </button>

      <div style={{ marginLeft: 'auto' }} />
      <button onClick={handleLoad} disabled={!fileName}>
        Recargar
      </button>
      <button onClick={handleSave} style={{ background: '#111827', color: '#fff', borderColor: '#111827' }}>
        Guardar
      </button>

      {/* Diálogo de configuración */}
      <RepositoryManager open={showConfig} onClose={() => updateConfig()} />
    </div>
  );
}
