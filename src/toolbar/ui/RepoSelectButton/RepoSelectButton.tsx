import React from 'react';
import './RepoSelectButton.scss';
import { AppContext } from '../../../app/AppContext';
import { FileStorage, Repository } from '../../../storage/Repository';
import { useUrlBind } from '../../../app/url/useUrlBind';
import { useUrlOnLoad } from '../../../app/url/useUrlOnLoad';
import { DeleteIcon } from 'lucide-react';

type Props = {
  onError?(msg: string): void;
  onSelectFile(file: FileStorage|null): void;
  onBusyAcquire?(callback: (release: () => void) => void, msg?: string): void;
};
export default function ({ onSelectFile, onBusyAcquire, onError }: Props) {
  const context = React.useContext(AppContext);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = React.useState<boolean>(false);

  const [repos, setRepos] = React.useState<Repository[] | null>(null);
  const [repoName, setRepoName] = React.useState<string | null | undefined>();
  const [repo, setRepo] = React.useState<Repository | null>(null);

  const [fileName, setFileName] = React.useState<string | null | undefined>();
  const [files, setFiles] = React.useState<FileStorage[] | null>(null);

  const runBusy = (callback: (release?: () => void) => void, label: string) => {
    if (onBusyAcquire) {
      onBusyAcquire(callback, label); // ← crea token
    } else {
      callback();
    }
  };

  const load = async function (fileName: null | undefined | string) {
    if (fileName) {
      const res = repo?.loadFile(fileName);
      return res;
    } else {
      return null;
    }
  };

  // On set repo name => select Repo
  React.useEffect(() => {
    setRepo(repos?.find((repo) => repo.name() == repoName) || null);
  }, [repoName]);

  // on set file name => seleft File
  React.useEffect(() => {
    load(fileName).then((file) => {
        onSelectFile( file ?? null );
    });
  }, [fileName, repo]);

  // On set repo => list files.
  React.useEffect(() => {
    const current = repos?.find((repo) => repo.name() == repoName);
    if (current) {
      loadFilesOfRepository(current, fileName);
    }
  }, [repos, repoName]);

  const searchInRepos = React.useCallback(async () => {}, [repo, repoName, fileName]);

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
        } else if (!repo) {
          setRepo(current);
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
  useUrlOnLoad(loadRepos);

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

  const handleCreate = async () => {
    if (!repo) return onError?.('Selecciona un repositorio de destino.');
    const name = prompt('Nombre del fichero (ej. my-diagram.json)');
    if (!name) return;
    runBusy(async (release?: () => void) => {
      try {
        await repo?.createFile(name);
        setFileName(name);
        loadFilesOfRepository(repo, name);
      } catch (e: any) {
        onError?.(e?.message ?? String(e));
      } finally {
        release?.();
      }
    }, 'Creando...');
  };

  const handleDelete = async (f: FileStorage) => {
    if (!f) return onError?.('Selecciona un fichero de destino.');
    if (!confirm(`¿Borrar ${f.name()}?`)) return;
    runBusy(async (release?: () => void) => {
      try {
        await f.delete();
        loadFilesOfRepository(repo, '');
      } catch (e: any) {
        onError?.(e?.message ?? String(e));
      } finally {
        release?.();
      }
    }, 'Borrando...');
  };

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return; // click dentro -> no cerrar
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="rfm-dropdown">
      <button ref={btnRef} className="rfm-btn" onClick={() => setOpen(!open)}>
        Fichero
      </button>
      {open && (
        <div ref={popRef} role="menu" className="rfm-panel">
          <div className="rfm-grid">
            <div className="rfm-col rfm-col--left">
              <p className="rfm-head">Repos</p>
              <ul className="rfm-list rfm-list-right">
                {(repos || [])
                  .map((f) => f.name())
                  .map((f) => (
                    <li className="rfm-item" key={f}>
                      <button
                        className="rfm-link"
                        onClick={(_e) => {
                          setOpen(false);
                          setRepoName(f);
                        }}
                      >
                        {f}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="rfm-col rfm-col--right">
              <p className="rfm-head">Files</p>
              <div className="rfm-actions">
                <button className="rfm-action" onClick={handleCreate}>
                  Crear
                </button>
                <button className="rfm-action" onClick={searchInRepos}>
                  Buscar
                </button>
                <button className="rfm-action" onClick={loadRepos}>
                  Refrescar
                </button>
              </div>
              <ul className="rfm-list rfm-list-left">
                {(files || []).map((f) => (
                  <li key={f.name()} className="rfm-item rfm-item--row">
                    <button
                      className="rfm-link"
                      onClick={(_e) => {
                        setOpen(false);
                        setFileName(f.name());
                      }}
                    >
                      {f.name()}
                    </button>
                    <button
                      className="rfm-link rfm-danger"
                      onClick={(_e) => {
                        setOpen(false);
                        handleDelete(f);
                      }}
                    >
                      <DeleteIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

