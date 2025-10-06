'use client';

import type React from 'react';
import { useState } from 'react';

import { Plus, Edit2, X, MoreHorizontal } from 'lucide-react';

interface DiagramView {
  id: string;
  name: string;
  includeNodeIds: string[];
}

type Props = {
  views: DiagramView[];
  currentViewId: string;
  readOnly: boolean;
  onChangeView(id: string): void;
  onCreate(): void;
  onEdit(view: DiagramView): void;
  onDelete(id: string): void;
};

export default function ViewTabs({
  views = [],
  currentViewId,
  readOnly,
  onChangeView,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '10px',
    padding: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  const getTabStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative',
    padding: '8px 16px',
    paddingRight: active ? '16px' : '16px',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: active ? '#3b82f6' : '#f3f4f6',
    color: active ? '#ffffff' : '#6b7280',
    border: 'none',
    cursor: 'pointer',
    boxShadow: active ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
  });

  const getTabHoverStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? '#3b82f6' : '#f9fafb',
    color: active ? '#ffffff' : '#374151',
  });

  const viewsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const tabGroupStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const getCloseButtonStyle = (tabId: string): React.CSSProperties => ({
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '24px',
    height: '24px',
    padding: '0',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    opacity: hoveredTabId === tabId ? 1 : 0,
    transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  });

  const editIconStyle: React.CSSProperties = {
    display: 'inline',
    marginLeft: '8px',
    opacity: 0.6,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  };

  const newViewButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    color: '#475569',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
  };

  const spacerStyle: React.CSSProperties = {
    flex: 1,
  };

  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const getOrderedViews = () => {
    if (!currentViewId) {
      return views;
    }
    const selectedView = views.find((v) => v.id === currentViewId);
    const selectedIndex = views.findIndex((v) => v.id === currentViewId);
    // If selected view is in the first 3 positions, keep original order
    if (selectedIndex < 3) {
      return views;
    }
    // If selected view is in overflow (position 3+), reorder
    if (selectedView && selectedIndex >= 3) {
      const otherViews = views.filter((v) => v.id !== currentViewId);
      return [selectedView, ...otherViews.slice(0, 2), ...otherViews.slice(2)];
    }
    return views;
  };

  // FIXME: aunque se recuerde, al cargar la url con view, navega solo de vuelta a "TODOS"
  // useUrlBind('view', [currentViewId, onChangeView], { deserialize: (v: any) => v || '' });
  // useUrlOnLoad( () => onChangeView( currentViewId ) );  

  const orderedViews = getOrderedViews();
  const visibleViews = orderedViews.slice(0, 3);
  const overflowViews = orderedViews.slice(3);
  const hasOverflow = overflowViews.length > 0;

  const overflowButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const overflowMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    minWidth: '200px',
    zIndex: 20,
    padding: '8px',
  };

  const overflowItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    border: 'none',
    width: '100%',
    backgroundColor: 'transparent',
  };

  const overflowItemActiveStyle: React.CSSProperties = {
    ...overflowItemStyle,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  };

  const overflowActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={() => onChangeView('')}
        style={getTabStyle(currentViewId === '')}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, getTabHoverStyle(currentViewId === ''));
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, getTabStyle(currentViewId === ''));
        }}
        title="Mostrar todos los nodos"
      >
        Todos
      </button>

      <div style={viewsContainerStyle}>
        {visibleViews.map((v) => {
          const active = currentViewId === v.id;
          return (
            <div
              key={v.id}
              style={tabGroupStyle}
              onMouseEnter={() => setHoveredTabId(v.id)}
              onMouseLeave={() => setHoveredTabId(null)}
            >
              <button
                onClick={() => onChangeView(v.id)}
                style={getTabStyle(active)}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, getTabHoverStyle(active));
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, getTabStyle(active));
                }}
                title={`${v.name} — ${v.includeNodeIds.length} nodos`}
              >
                {v.name}
                {!readOnly && (
                  <Edit2
                    size={12}
                    style={editIconStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(v);
                    }}
                  />
                )}
              </button>
              {!readOnly && (
                <button
                  className="close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(v.id);
                  }}
                  style={getCloseButtonStyle(v.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                  title="Eliminar vista"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}

        {hasOverflow && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              style={overflowButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Más vistas"
            >
              <MoreHorizontal size={16} />
            </button>

            {showOverflowMenu && (
              <div style={overflowMenuStyle}>
                {overflowViews.map((v) => {
                  const active = currentViewId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        onChangeView(v.id);
                        setShowOverflowMenu(false);
                      }}
                      style={active ? overflowItemActiveStyle : overflowItemStyle}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      title={`${v.name} — ${v.includeNodeIds.length} nodos`}
                    >
                      <span>{v.name}</span>
                      {!readOnly && (
                        <div style={overflowActionsStyle}>
                          <Edit2
                            size={12}
                            style={{ opacity: 0.6, cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(v);
                              setShowOverflowMenu(false);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.6';
                            }}
                          />
                          <X
                            size={12}
                            style={{ opacity: 0.6, cursor: 'pointer', color: '#ef4444' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(v.id);
                              setShowOverflowMenu(false);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.6';
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showOverflowMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 15,
          }}
          onClick={() => setShowOverflowMenu(false)}
        />
      )}

      <div style={spacerStyle} />

      {!readOnly && (
        <button
          onClick={onCreate}
          style={newViewButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}
          title="Crear vista"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}

