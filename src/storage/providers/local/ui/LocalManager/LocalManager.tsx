import React from 'react';
import {
  saveConfig,
  loadConfig,
  listRepositories,
  clearConfig,
  type AppConfig,
  type ProviderKind,
} from '../../helper/config';
import { addToShared, listShared, removeFromShared, SharedEntry } from '../../helper/shared';
import { Plus, Save } from 'lucide-react';
import { JSX } from 'react/jsx-runtime';

type Props = {
  open: boolean;
  onClose(): void;
  currentRepository?: string;
};

/* ============================ Tipos de la vista ============================ */

type RepoFormState =
  | ({ provider: 'github' } & {
      token: string;
      owner: string;
      repo: string;
      branch?: string;
      rootDir?: string;
    })
  | ({ provider: 'localstorage' } & {
      prefix?: string;
      rootDir?: string;
    })
  // si alguien tenía un repo fs guardado, lo mostramos como “no editable”
  | ({ provider: 'fs' } & {
      rootDir?: string;
    });

type ViewMode = 'list' | 'create' | 'edit';
type Tab = 'repos' | 'shared';

/* ========================= Utilidades de repositorios ====================== */

function cfgToForm(cfg: AppConfig | null): RepoFormState {
  if (!cfg) {
    return { provider: 'github', token: '', owner: '', repo: '', branch: 'main', rootDir: '' };
  }
  if (cfg.type === 'github') {
    return {
      provider: 'github',
      token: cfg.token,
      owner: cfg.owner,
      repo: cfg.repo,
      branch: cfg.branch,
      rootDir: cfg.rootDir,
    };
  }
  if (cfg.type === 'localstorage') {
    return {
      provider: 'localstorage',
      prefix: cfg.prefix || 'c4fs',
      rootDir: cfg.rootDir,
    };
  }
  throw new Error("Unkown handler " + cfg.type);
}

function getRepositoryDisplayName(name: string, config: AppConfig | null): string {
  if (!config) return name;
  switch (config.type) {
    case 'github':
      return `${config.owner}/${config.repo}${config.branch ? ` (${config.branch})` : ''}`;
    case 'localstorage':
      return `Storage: ${config.prefix || 'c4fs'}${config.rootDir ? ` · ${config.rootDir}` : ''}`;
    default:
      return name;
  }
}

function getProviderIcon(provider: ProviderKind | 'localstorage') {
  switch (provider) {
    case 'github':
      return (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case 'fs':
      return '📁';
    case 'localstorage':
      return <Save size={40} />;
    default:
      return '📦';
  }
}

/* ============================ Pestaña: compartidos ========================= */

function isHttpUrl(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ================================ Componente =============================== */

export default function LocalManager({ open, onClose, currentRepository }: Props): JSX.Element {
  /* ---------- tabs ---------- */
  const [tab, setTab] = React.useState<Tab>('repos');

  /* ---------- repos ---------- */
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');
  const [repositories, setRepositories] = React.useState<string[]>([]);
  const [editingRepo, setEditingRepo] = React.useState<string | null>(null);
  const [newRepoName, setNewRepoName] = React.useState<string>('');
  const [formState, setFormState] = React.useState<RepoFormState>(() => cfgToForm(null));

  /* ---------- shared ---------- */
  const [shared, setShared] = React.useState<SharedEntry[]>([]);
  const [sharedEditingId, _setSharedEditingId] = React.useState<string | null>(null);
  const [sharedName, setSharedName] = React.useState('');
  const [sharedUrl, setSharedUrl] = React.useState('');

  /* ---------- generales ---------- */
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Cargar al abrir
  React.useEffect(() => {
    if (!open) return;
    // reset de pestañas y vistas
    setTab('repos');
    setViewMode('list');
    setEditingRepo(null);
    setNewRepoName('');
    setError(null);
    setBusy(false);

    setRepositories(listRepositories());
    setShared(listShared());
  }, [open]);

  const refreshRepositories = React.useCallback(() => {
    setRepositories(listRepositories());
  }, []);

  /* -------------------------- Acciones: repos -------------------------- */

  const handleCreateRepository = () => {
    setViewMode('create');
    setNewRepoName('');
    setFormState(cfgToForm(null));
    setError(null);
  };

  const handleEditRepository = (repoName: string) => {
    const config = loadConfig(repoName);
    setEditingRepo(repoName);
    setFormState(cfgToForm(config));
    setViewMode('edit');
    setError(null);
  };

  const handleDeleteRepository = async (repoName: string) => {
    if (!confirm(`¿Eliminar el repositorio "${repoName}"?`)) return;
    try {
      clearConfig(repoName);
      refreshRepositories();
      setError(null);
      if (editingRepo === repoName) {
        setViewMode('list');
        setEditingRepo(null);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const changeProvider = (p: 'github' | 'localstorage') => {
    if (p === 'github') {
      setFormState({ provider: 'github', token: '', owner: '', repo: '', branch: 'main', rootDir: '' });
    } else {
      setFormState({ provider: 'localstorage', prefix: 'c4fs', rootDir: '' });
    }
  };

  const handleSubmitRepoForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const repoName = viewMode === 'create' ? newRepoName.trim() : editingRepo!;
      if (!repoName) throw new Error('El nombre del repositorio es obligatorio.');
      if (viewMode === 'create' && repositories.includes(repoName)) {
        throw new Error('Ya existe un repositorio con ese nombre.');
      }

      let config: AppConfig;
      if (formState.provider === 'github') {
        if (!formState.owner || !formState.repo) throw new Error('Owner y Repo son obligatorios.');
        config = {
          type: 'github',
          token: formState.token,
          owner: formState.owner,
          repo: formState.repo,
          branch: formState.branch || undefined,
          rootDir: formState.rootDir || undefined,
        };
      } else if (formState.provider === 'localstorage') {
        config = {
          type: 'localstorage',
          prefix: formState.prefix || 'c4fs',
          rootDir: formState.rootDir || undefined,
        };
      } else {
        throw new Error('Este diálogo no permite editar repos de tipo “Directorio local (FS)”.');
      }

      saveConfig(repoName, config);
      refreshRepositories();
      setViewMode('list');
      setEditingRepo(null);
      setNewRepoName('');
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------- Acciones: compartidos ------------------------- */

  // ✅ Implementado: preguntar primero nombre y después URL; validar y guardar
  const startCreateShared = () => {
    setError(null);
    const name = prompt('Nombre del enlace compartido:')?.trim();
    if (!name) return;

    const url = prompt('URL del enlace (http/https):')?.trim();
    if (!url) return;

    if (!isHttpUrl(url)) {
      alert('La URL debe empezar por http:// o https://');
      return;
    }

    const next = shared.concat({ name, url });
    setShared(next);
    addToShared(name, url);
    // no abrimos formulario inline; queda creado directamente
  };

  const startEditShared = (it: SharedEntry) => {
    // setSharedEditingId(it.id);
    setSharedName(it.name);
    setSharedUrl(it.url);
    setError(null);
  };

  const cancelSharedEdit = () => {
    // setSharedEditingId(null);
    setSharedName('');
    setSharedUrl('');
    setError(null);
  };

  const saveSharedItem = () => {
    // if (!sharedEditingId) return;
    if (!sharedName.trim()) return setError('Pon un nombre para el enlace compartido.');
    if (!isHttpUrl(sharedUrl)) return setError('La URL debe empezar por http:// o https://');

    // const next = shared.map((s) =>
    //   // s.id === sharedEditingId ? { ...s, name: sharedName.trim(), url: sharedUrl.trim() } : s
    //      s.name === sharedName ? { ...s, name: sharedName.trim(), url: sharedUrl.trim() } : s
    // );
    // setShared(next);
    addToShared(sharedName, sharedUrl);
    cancelSharedEdit();
  };

  const deleteShared = (name: string) => {
    if (!confirm('¿Eliminar este enlace compartido?')) return;
    const next = shared.filter((s) => s.name !== name);
    setShared(next);
    removeFromShared(name);
    // if (sharedEditingId === id) cancelSharedEdit();
    cancelSharedEdit();
  };

  /* -------------------------------- Render -------------------------------- */

  if (!open) return <></>;

  const renderTabs = (
    <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e5e7eb', marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => {
          setTab('repos');
          setViewMode('list');
          setError(null);
        }}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderBottom: tab === 'repos' ? '2px solid #111827' : '2px solid transparent',
          background: 'transparent',
          fontWeight: tab === 'repos' ? 700 : 500,
          cursor: 'pointer',
        }}
      >
        Repositorios
      </button>
      <button
        type="button"
        onClick={() => {
          setTab('shared');
          setError(null);
        }}
        style={{
          padding: '8px 12px',
          border: 'none',
          borderBottom: tab === 'shared' ? '2px solid #111827' : '2px solid transparent',
          background: 'transparent',
          fontWeight: tab === 'shared' ? 700 : 500,
          cursor: 'pointer',
        }}
      >
        Compartidos
      </button>
    </div>
  );

  const renderRepoList = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleCreateRepository} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} /> Crear repositorio
        </button>
      </div>

      {repositories.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 16px' }}>
          <p>No hay repositorios configurados</p>
          <p style={{ fontSize: 14 }}>Crea tu primer repositorio para empezar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {repositories
            .filter((name) => name !== 'shared')
            .map((repoName) => {
              const config = loadConfig(repoName);
              const displayName = getRepositoryDisplayName(repoName, config);
              const isActive = currentRepository === repoName;
              const canEdit = !config || config.type === 'github' || config.type === 'localstorage';

              return (
                <div
                  key={repoName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 12,
                    border: `2px solid ${isActive ? '#059669' : '#e5e7eb'}`,
                    borderRadius: 8,
                    background: isActive ? '#ecfdf5' : '#fff',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{getProviderIcon((config?.type as any) || 'localstorage')}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{repoName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{displayName}</div>
                      </div>
                    </div>
                    {isActive && (
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 4 }}>ACTIVO</div>
                    )}
                    {!canEdit && (
                      <div style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>
                        Este repositorio es de tipo “Directorio local (FS)” y no se edita aquí.
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => canEdit && handleEditRepository(repoName)} disabled={!canEdit}>
                      Editar
                    </button>

                    <button onClick={() => handleDeleteRepository(repoName)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );

  const renderRepoForm = (
    <form onSubmit={handleSubmitRepoForm}>
      {/* Nombre (solo crear) */}
      {viewMode === 'create' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Nombre del repositorio
          </label>
          <input
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            placeholder="mi-repositorio"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
            required
          />
        </div>
      )}

      {/* Selector de proveedor (solo GitHub / LocalStorage) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Proveedor</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => changeProvider('github')}
            style={{
              padding: '8px 16px',
              background: formState.provider === 'github' ? '#ddd' : '#fff',
              color: '#111',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <title>GitHub</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <br /> GitHub
          </button>
          <button
            type="button"
            onClick={() => changeProvider('localstorage')}
            style={{
              padding: '8px 16px',
              background: formState.provider === 'localstorage' ? '#ddd' : '#fff',
              color: '#111',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            <Save size={50} /> <br />
            LocalStorage
          </button>
        </div>
      </div>

      {/* Campos específicos */}
      {formState.provider === 'github' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Token</label>
            <input
              type="password"
              value={formState.token}
              onChange={(e) => setFormState({ ...formState, token: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              placeholder="(opcional: repos públicos solo lectura)"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Owner</label>
            <input
              value={formState.owner}
              onChange={(e) => setFormState({ ...formState, owner: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Repo</label>
            <input
              value={formState.repo}
              onChange={(e) => setFormState({ ...formState, repo: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Branch</label>
            <input
              value={formState.branch || ''}
              onChange={(e) => setFormState({ ...formState, branch: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              placeholder="(por defecto)"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Directorio raíz</label>
            <input
              value={formState.rootDir || ''}
              onChange={(e) => setFormState({ ...formState, rootDir: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              placeholder="ej. diagrams"
            />
          </div>
        </div>
      )}

      {formState.provider === 'localstorage' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Prefijo</label>
            <input
              value={formState.prefix || 'c4fs'}
              onChange={(e) => setFormState({ ...formState, prefix: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Directorio raíz</label>
            <input
              value={formState.rootDir || ''}
              onChange={(e) => setFormState({ ...formState, rootDir: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              placeholder="ej. diagrams"
            />
          </div>
          <p style={{ gridColumn: '1 / -1', fontSize: 12, color: '#64748b', margin: 0 }}>
            Los archivos se guardan como claves en localStorage. Útil como fallback rápido.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button
          type="button"
          onClick={() => {
            setViewMode('list');
            setEditingRepo(null);
            setNewRepoName('');
            setError(null);
          }}
          disabled={busy}
        >
          Cancelar
        </button>
        <button type="submit" disabled={busy}>
          {busy ? 'Guardando…' : viewMode === 'create' ? 'Crear' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );

  const renderSharedTab = (
    <div>
      {/* Cabecera acciones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Enlaces compartidos</div>
        <button onClick={startCreateShared} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={20} /> Añadir
        </button>
      </div>

      {/* Formulario editar (solo aparece al editar un elemento existente) */}
      {sharedEditingId && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Nombre</label>
              <input
                value={sharedName}
                onChange={(e) => setSharedName(e.target.value)}
                placeholder="Mi enlace"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>URL</label>
              <input
                value={sharedUrl}
                onChange={(e) => setSharedUrl(e.target.value)}
                placeholder="https://…"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 8,
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={cancelSharedEdit}>Cancelar</button>
            <button onClick={saveSharedItem}>Guardar</button>
          </div>
        </div>
      )}

      {/* Lista de enlaces */}
      {shared.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '24px 8px' }}>
          No hay enlaces compartidos todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {shared.map((s) => (
            <div
              key={s.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', wordBreak: 'break-all' }}>{s.url}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEditShared(s)}>Editar</button>
                <button onClick={() => deleteShared(s.name)}>Eliminar</button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(s.url).catch(() => {});
                  }}
                >
                  Copiar URL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          {tab === 'repos'
            ? viewMode === 'list'
              ? 'Gestor de repositorios'
              : viewMode === 'create'
                ? 'Crear repositorio'
                : 'Editar repositorio'
            : 'Enlaces compartidos'}
        </h2>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 6 }}>{renderTabs}</div>

      {/* Contenido por pestaña */}
      {tab === 'repos' ? (
        <>
          {viewMode === 'list' ? renderRepoList : renderRepoForm}
          {viewMode === 'list' && error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          {viewMode === 'list' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {renderSharedTab}
          {error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </>
  );
}
