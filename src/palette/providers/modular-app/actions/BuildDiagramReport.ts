import { DiagramDescriptor, EdgeDescriptor, NodeDescriptor } from '../../../../diagram/descriptor';
import { DiagramElementType, NodeCategory } from '../../../DiagramElementType';

export class BuildDiagramReport {
  public constructor(private readonly descriptor: DiagramDescriptor) {}

  public buildDiagramHTML(diagramImage: string, options?: BuildOptions): string {
    const doc = this.descriptor.doc;
    const created = doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-';
    const updated = doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '-';
    const filter = options?.filter ?? {};

    // Overlaps precomputados (para helpers)
    // const overlaps = this.extractor.computeNoteOverlaps();

    const doSort = (map: Map<DiagramElementType, NodeDescriptor[]>) => {
      return [...map.keys()].sort((a, b) => {
        const oa = a.exportOrder?.() ?? 100;
        const ob = b.exportOrder?.() ?? 100;
        if (oa !== ob) return oa - ob;
        return a.title.toLocaleLowerCase().localeCompare(b.title.toLocaleLowerCase());
      });
    };

    const actors = this.descriptor.actorsByGroup();
    const components = this.descriptor.componentsByGroup();
    const notes = this.descriptor.notesByGroup();

    const actorsKinds = doSort(actors);
    const componentsKinds = doSort(components);
    const notesKinds = doSort(notes);

    /* --------------------- DIAGRAMA OVERVIEW (PlantUML+C4) --------------------- */
    const overviewHTML = diagramImage
      ? [
          '<section id="overview">',
          '  <h2>Vista general</h2>',
          `  <img src="${diagramImage}" alt="Vista general (C4-PlantUML)" style="max-width:100%;height:auto;display:block;" />`,
          '</section>',
        ].join('\n')
      : '';
    /* ---------- Secciones por categoría ---------- */
    const actorsSectionHTML = actorsKinds.length
      ? [
          '<section id="actors">',
          '  <h2>Actores</h2>',
          ...actorsKinds.map((k) => this.renderTypeNodes(filter, k, actors.get(k)!, 'actor')),
          '</section>',
        ].join('\n')
      : '';
    const componentsSectionHTML = componentsKinds.length
      ? [
          '<section id="components">',
          '  <h2>Componentes</h2>',
          ...componentsKinds.map((k) => this.renderTypeNodes(filter, k, components.get(k)!, 'component')),
          '</section>',
        ].join('\n')
      : '';

    const notesSectionHTML = notesKinds.length
      ? [
          '<section id="notes">',
          '  <h2>Notas</h2>',
          ...notesKinds.map((k) => {
            if (filter[k.kind]?.hide) return '';
            const title = k.title;
            const list = [...(notes.get(k) ?? [])]
              .sort((a, b) => a.compareTo(b))
              .map((note) => {
                const id = note.id;
                const label = note.label();
                const desc = note.description();
                const propsObj = note.properties();
                const typeDef = note.typeDef();
                const propsHtml = typeDef?.reportProperties
                  ? typeDef.reportProperties(propsObj, note.node, doc)
                  : `<pre>${preJson(propsObj)}</pre>`;
                const nodesOver = note.nodesAbove();
                const byKind = new Map<DiagramElementType, NodeDescriptor[]>();
                for (const x of nodesOver) {
                  const kind = x.typeDef();
                  const arr = byKind.get(kind) ?? [];
                  arr.push(x);
                  byKind.set(kind, arr);
                }
                const kindGroups = [...byKind.keys()]
                  .sort((a, b) => {
                    const oa = a.exportOrder?.() ?? 100;
                    const ob = b.exportOrder?.() ?? 100;
                    if (oa !== ob) return oa - ob;
                    return a.title.toLocaleLowerCase().localeCompare(b.title.toLocaleLowerCase());
                    // const oa = this.typeOrder(a),
                    //   ob = this.typeOrder(b);
                    // if (oa !== ob) return oa - ob;
                    // return this.extractor.typeTitle(a).localeCompare(this.extractor.typeTitle(b));
                  })
                  .map((kk) => {
                    const titleK = kk.title;
                    const inner = (byKind.get(kk) ?? [])
                      .sort((a, b) => a.compareTo(b))
                      .map((n) => this.liNodeRef(n))
                      .join('\n');
                    return `<div style="margin:6px 0 8px 0;"><strong>${escapeHtml(titleK)}</strong><ul>${inner}</ul></div>`;
                  })
                  .join('\n');
                const text = ((note as any).props?.markdown ?? (note as any).props?.description ?? '').trim();
                const textHtml = text ? `<blockquote>${escapeHtml(text)}</blockquote>` : '';

                return [
                  `<section id="${id}">`,
                  `  <h3>${escapeHtml(title)} · ${escapeHtml(label)}</h3>`,
                  desc ? `  <p>${escapeHtml(desc)}</p>` : '',
                  '  <h4>Propiedades</h4>',
                  `  ${propsHtml}`,
                  textHtml,
                  kindGroups ? `  <h4>Nodos sobre esta nota</h4>\n  ${kindGroups}` : '',
                  '  <hr/>',
                  '</section>',
                ]
                  .filter(Boolean)
                  .join('\n');
              })
              .join('\n');

            return ['<section>', `  <h3>${escapeHtml(title)}</h3>`, `  ${list}`, '</section>'].join('\n');
          }),
          '</section>',
        ].join('\n')
      : '';

    /* ---------- Índice ---------- */
    function tocFor(
      map: Map<DiagramElementType, NodeDescriptor[]>,
      kinds: DiagramElementType[],
      title: string,
    ): string {
      const visibleKinds = kinds.filter((k) => !filter[k.kind]?.hide);
      if (!visibleKinds.length) return '';
      const lis = visibleKinds
        .map((k) => {
          const typeName = k.title;
          const inner = [...(map.get(k) ?? [])]
            .sort((a, b) => a.compareTo(b))
            .map((n) => `<li><a href="#${n.anchorId()}">${escapeHtml(n.label())}</a></li>`)
            .join('\n');
          return `<li><strong>${escapeHtml(typeName)}</strong><ul>${inner}</ul></li>`;
        })
        .join('\n');
      return `<div><strong>${escapeHtml(title)}</strong><ul>${lis}</ul></div>`;
    }
    const tocHTML = [
      tocFor(actors, actorsKinds, 'Actores'),
      tocFor(components, componentsKinds, 'Componentes'),
      tocFor(notes, notesKinds, 'Notas'),
    ].join('\n');

    /* ---------- Estilos (cabecera) ---------- */
    const headStyles = `
<style>
  :root { color-scheme: light dark; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; line-height: 1.55; }
  h1 { margin: 0 0 4px 0; font-size: 20px; }
  h2 { margin: 20px 0 6px 0; font-size: 18px; }
  h3 { margin: 14px 0 6px 0; font-size: 15px; color: #334155; }
  h4 { margin: 10px 0 6px 0; font-size: 14px; color: #111827; }
  h5 { margin: 8px 0 6px 0; font-size: 13px; color: #475569; }
  p { margin: 6px 0 8px 0; }
  pre { background: #0b1220; color: #e2e8f0; padding: 10px 12px; border-radius: 8px; overflow: auto; }
  small { color: #64748b; }
  ul { margin: 6px 0 10px 18px; }
  li { margin: 2px 0; }
  blockquote { margin: 10px 0; padding: 8px 10px; background: #f8fafc; border-left: 3px solid #94a3b8; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 4px; }
  hr { border: 0; border-top: 1px solid #e5e7eb; margin: 18px 0; }
  .meta { color: #475569; font-size: 12px; margin-bottom: 14px; }
  .counts { margin-top: 8px; color: #334155; }
  .toc { margin-top: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; }
  .toc h3 { margin: 0 0 6px 0; font-size: 14px; color: #334155; }
  img { max-width: 100%; height: auto; display: block; }
</style>`.trim();

    /* ---------- HTML final ---------- */
    const html = [
      '<!doctype html>',
      '<html lang="es">',
      '<head>',
      '<meta charset="utf-8"/>',
      '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
      '<title>Export – C4 Diagram</title>',
      headStyles,
      '</head>',
      '<body>',
      '  <h1>Resumen del diagrama</h1>',
      `  <div class="meta">
    Versión: <strong>${escapeHtml(doc.version)}</strong> ·
    Creado: <strong>${escapeHtml(created)}</strong> ·
    Actualizado: <strong>${escapeHtml(updated)}</strong>
    <div class="counts">Nodos: <strong>${doc.nodes.length}</strong> · Aristas: <strong>${doc.edges.length}</strong></div>
  </div>`,
      '  <div class="toc">',
      '    <h3>Índice</h3>',
      `    ${tocHTML}`,
      '  </div>',
      overviewHTML,
      actorsSectionHTML,
      componentsSectionHTML,
      notesSectionHTML,
      '</body>',
      '</html>',
    ].join('\n');

    return html;
  }

  private liNodeRef(n: NodeDescriptor): string {
    return `<li>${this.liNodeRefDetail(n)}</li>`;
  }

  private liEdgeRef(e: EdgeDescriptor): string {
    return `<li>${this.liNodeRefDetail(e.target)} ${this.edgeProperties(e)}</li>`;
  }

  private liNodeRefDetail(n: NodeDescriptor): string {
    const label = n.label();
    const desc = n.description();
    const t = n.typeTitle();
    const id = n.anchorId();
    return `<a href="#${id}"><strong>${escapeHtml(label)}</strong></a> <small>(${escapeHtml(t)})</small>${desc ? ` — ${escapeHtml(desc)}` : ''}`;
  }

  private edgeProperties(e: EdgeDescriptor) {
    const props = e.properties();
    if (props) {
      return `<pre>${preJson(props)}</pre>`;
    } else {
      return '';
    }
  }

  private renderTypeNodes(filter: any, type: DiagramElementType, nodes: NodeDescriptor[], cat: NodeCategory): string {
    if (filter[type.kind]?.hide) return '';

    // const nodeById = new Map<string, DiagramNode>(this.descriptor.doc.nodes.map((n) => [n.id, n]));

    const sortNodes = (nodes: NodeDescriptor[]) =>
      [...nodes].sort((a, b) => a.label().toLocaleLowerCase().localeCompare(b.label().toLocaleLowerCase()));

    const title = type.title;
    const body = sortNodes(nodes)
      .map((n) => {
        const id = n.anchorId();
        const label = n.label();
        const desc = n.description();
        const propsObj = n.properties();
        const typeDef = n.typeDef();
        const propsHtml = typeDef?.reportProperties
          ? typeDef.reportProperties(propsObj, n.node, this.descriptor.doc)
          : `<pre>${preJson(propsObj)}</pre>`;

        const depsList = n
          .outgoingDependencies()
          .map((t) => this.liEdgeRef(t!))
          .join('\n');
        const dependentsList = n
          .incomingDependecies()
          .map((s) => this.liEdgeRef(s!))
          .join('\n');
        const parentsList = n
          .parentNodes()
          .map((s) => this.liEdgeRef(s!))
          .join('\n');
        const childrenList = n
          .childrenNodes()
          .map((t) => this.liEdgeRef(t!))
          .join('\n');

        const upstreamActors = cat === 'component' ? n.actors() : [];
        const actorsList = upstreamActors.map((a) => this.liNodeRef(a)).join('\n');

        const notesUnder = n.nodesBelow();
        const notesBlock = notesUnder.length
          ? `<h5>Notas</h5>
           <ul>
             ${notesUnder
               .map((note) => {
                 const text = ((note as any).props?.markdown ?? (note as any).props?.description ?? '').trim();
                 const name = note.label();
                 const safe = text ? `<blockquote>${escapeHtml(text)}</blockquote>` : '';
                 return `<li><strong>${escapeHtml(name)}</strong>${safe ? `<div>${safe}</div>` : ''}</li>`;
               })
               .join('\n')}
           </ul>`
          : '';
        return [
          `<section id="${id}">`,
          `  <h4>${escapeHtml(label)}</h4>`,
          desc ? `  <p>${escapeHtml(desc)}</p>` : '',
          '  <h5>Propiedades</h5>',
          `  ${propsHtml}`,
          cat === 'component' && upstreamActors.length ? `  <h5>Actores</h5><ul>${actorsList}</ul>` : '',
          depsList.length ? `  <h5>Dependencias</h5><ul>${depsList}</ul>` : '',
          cat !== 'actor' && dependentsList.length ? `  <h5>Dependientes</h5><ul>${dependentsList}</ul>` : '',
          parentsList ? `  <h5>Padres</h5><ul>${parentsList}</ul>` : '',
          childrenList ? `  <h5>Hijos</h5><ul>${childrenList}</ul>` : '',
          notesBlock,
          '  <hr/>',
          '</section>',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    return body ? ['<section>', `  <h3>${escapeHtml(title)}</h3>`, `  ${body}`, '</section>'].join('\n') : '';
  }
}

/* ===================== Opciones / Filtros ===================== */
export type KindFilter = Record<string, { hide?: boolean }>;
export interface BuildOptions {
  filter?: KindFilter;
}

/* ============================ Helpers ========================= */
function escapeHtml(s: any): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function preJson(obj: unknown): string {
  try {
    return escapeHtml(JSON.stringify(obj ?? {}, null, 2));
  } catch {
    return escapeHtml(String(obj));
  }
}
