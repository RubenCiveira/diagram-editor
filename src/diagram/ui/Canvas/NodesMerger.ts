import { Edge, Node } from "reactflow";

function shallowEqual(a: any, b: any) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

function mergeNode(existing: Node, incoming: Partial<Node> & Pick<Node,'id'>): Node {
  // preserva data si no cambia
  const nextData =
    incoming.data === undefined
      ? existing.data
      : shallowEqual(existing.data, incoming.data)
      ? existing.data
      : { ...existing.data, ...incoming.data };

  // preserva position/selected si no te llega uno nuevo
  const next = {
    ...existing,
    ...incoming,
    data: nextData,
    position: incoming.position ?? existing.position,
    selected: incoming.selected ?? existing.selected,
  };

  // si tras el merge todo sigue igual, devuelve la MISMA referencia
  const same =
    existing.type === next.type &&
    existing.position?.x === next.position?.x &&
    existing.position?.y === next.position?.y &&
    existing.selected === next.selected &&
    shallowEqual(existing.data, next.data);

  return same ? existing : next;
}

/**
 * Upsert de nodos: mantiene todos los actuales y añade/actualiza los nuevos.
 * - No elimina nodos.
 * - Mantiene el orden de los actuales; añade los nuevos al final.
 * - Preserva referencias cuando no hay cambios ⇒ evita perder selección.
 */
export function upsertNodes(
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  incoming: Array<Partial<Node> & Pick<Node,'id'>>
) {
  setNodes(prev => {
    const byId = new Map(prev.map(n => [n.id, n]));
    const next = [...prev];

    // actualiza existentes
    for (let i = 0; i < next.length; i++) {
      const patch = incoming.find(n => n.id === next[i].id);
      if (patch) {
        const merged = mergeNode(next[i], patch);
        if (merged !== next[i]) next[i] = merged;
      }
    }

    // añade nuevos
    for (const cand of incoming) {
      if (!byId.has(cand.id)) {
        // rellena mínimos si hace falta
        next.push(cand as Node);
      }
    }

    return next;
  });
}

/** Versión equivalente para edges (si la necesitas) */
export function upsertEdges(
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  incoming: Array<Partial<Edge> & Pick<Edge,'id'>>
) {
  setEdges(prev => {
    const byId = new Map(prev.map(e => [e.id, e]));
    const next = [...prev];

    for (let i = 0; i < next.length; i++) {
      const patch = incoming.find(e => e.id === next[i].id);
      if (patch) {
        const merged = { ...next[i], ...patch };
        if (shallowEqual(next[i], merged)) continue;
        next[i] = merged;
      }
    }
    for (const cand of incoming) {
      if (!byId.has(cand.id)) next.push(cand as Edge);
    }
    return next;
  });
}