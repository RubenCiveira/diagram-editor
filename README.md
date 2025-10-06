# C4 Desktop / Web Diagrammer

**Autor:** Rubén Civeira  
**Licencia:** Apache 2.0  
**Repositorio público:** [https://github.com/rubenciveira/nombre-proyecto](https://github.com/rubenciveira/nombre-proyecto)

## 🧩 Descripción

Aplicación (web + desktop vía Tauri opcional) para **crear diagramas C4 de componentes** con **React Flow**, guardar/cargar en **GitHub** como JSON y **editar propiedades con formularios JSON Schema** (RJSF + Material UI). Incluye un **palette** de elementos (usuarios, gateways, shells UI, micro fronts, microservicios, proxy configs, servicios externos, APIs y **notas** con Markdown), validación de conexiones por tipo, y UX moderna (zoom, minimapa, “fit”, loader en operaciones, etc.).

## ✨ Características

- **Lienzo** con React Flow: nodos arrastrables, zoom, pan, minimapa, controles.
- **Conexiones curvas** (`simplebezier`) y validación por tipo con `verifyConnectTo()`.
- **Palette** con botón “+” flotante y “drawer” animado.
- **Edición** por doble clic con **formularios JSON Schema** (RJSF + MUI), `uiSchema`, widgets custom:
  - `markdown`: editor + vista previa en vivo.
  - `color`: selector simple.
- **Notas** (fondo, redimensionables, Markdown).
- **GitHub**: seleccionar directorio, listar ficheros `.json`, **crear / borrar / cargar / guardar** con SHA.
- **Formato único** de diagrama (`DiagramModel`), con posiciones y props por nodo.
- **Overlay de carga** durante operaciones (no bloquea el render).
- **Persistencia de configuración** en `sessionStorage` (MVP web, sin Tauri en el cuerpo de la app).

## 🧱 Stack

- React 18, Vite
- [React Flow](https://reactflow.dev/)
- [@rjsf/core + @rjsf/mui + Ajv 8](https://rjsf-team.github.io/react-jsonschema-form/)
- GitHub REST API (fetch)
- `zod` para validar `DiagramModel`
- `lucide-react` (iconos)

## 🚀 Puesta en marcha

### Requisitos
- Node.js 18+
- npm / pnpm / yarn
- (Opcional desktop) Tauri toolchain

### Instalación
```bash
npm i
# o pnpm i / yarn
```

### Dependencias de formularios (si no están ya instaladas)

```bash
npm i @rjsf/core @rjsf/mui @rjsf/validator-ajv8 @mui/material @emotion/react @emotion/styled react-markdown
```

### Desarrollo
```bash
npm run dev
```

```bash
Build
npm run build
npm run preview
```

## 🔐 Configuración de repositorio GitHub

En la barra superior abre el diálogo de configuración y rellena:

* Owner, Repo, Branch
* Directorio dentro del repo (no un fichero; p.ej. diagrams/)
* Token GitHub (con permisos de lectura/escritura en contenidos)

La configuración se guarda en sessionStorage para el MVP Web.

## 📁 Ficheros de diagrama

En la barra superior puedes:

+ Seleccionar un fichero .json del directorio configurado
* Crear uno nuevo (se inicializa vacío)
* Borrar el seleccionado
* Cargar (refresca desde remoto)
* Guardar (sube el JSON del diagrama con el SHA correcto)

```json
Formato DiagramModel
{
  "version": "1.0",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "nodes": [
    {
      "id": "node1",
      "kind": "microservice",
      "name": "Users",
      "props": { "tech": "quarkus", "baseUrl": "https://api..." },
      "position": { "x": 120, "y": 80 },
      "description": "Servicio de usuarios"
    }
  ],
  "edges": [
    { "id": "e1", "source": "nodeA", "target": "nodeB", "description": "llama a", "technology": "REST" }
  ]
}
```

La app valida este formato con Zod al cargar.

## 🧩 Tipos de elementos

Cada tipo implementa la interfaz DiagramElementType<TProps>:

```typescript
interface DiagramElementType<TProps = any> {
  kind: string;
  title: string;
  paletteIcon: React.ReactNode;
  nodeIcon: React.ReactNode;

  schema: JSONSchema;            // JSON Schema para props
  uiSchema?: JSONUiSchema;       // Opcional: personaliza presentación (RJSF)

  defaultProps(): TProps;
  label(data: { name?: string; props: TProps }): string;

  nodeSize?(args: { props: TProps }): { width: number; height: number };

  acceptsIncoming?(args: { props: TProps }): boolean; // por defecto true
  acceptsOutgoing?(args: { props: TProps }): boolean; // por defecto true

  renderShape?(args: { name?: string; props: TProps; icon: React.ReactNode }): React.ReactNode;

  isBackground?(): boolean;                          // ej. notas → true
  isResizable?(args: { props: TProps }): boolean;    // ej. notas → true

  verifyConnectTo?(args: {                          // Lanza Error si NO permite conectar
    source: DiagramNode & { props: TProps };
    target: DiagramNode;
    targetKind: DiagramNode['kind'];
    targetType: DiagramElementType<any>;
  }): void;
}
```

Conexiones: el editor llama a verifyConnectTo() del origen cuando arrastras una arista; si lanza Error, se cancela y se muestra alerta.

Notas: isBackground() = true (van detrás), isResizable() = true, acceptsIncoming/Outgoing() = false, renderShape() con Markdown.

## 🧰 Formularios avanzados (RJSF)

Cada tipo aporta schema y opcional uiSchema.

Widgets custom incluidos:

markdown: textarea + pestaña “vista previa”.

```typescript
color: <input type="color" />.
```

Puedes añadir widgets propios en SchemaForm.tsx y usarlos en uiSchema.

Ejemplo de uiSchema:

```typescript
uiSchema = {
  'ui:order': ['protocol', 'basePath', 'version', 'auth', 'specUrl'],
  protocol: { 'ui:widget': 'select' },
  specUrl:  { 'ui:help': 'Enlace a OpenAPI/AsyncAPI' }
}
```


##  🎨 Estilos y capas

Las aristas se muestran por encima de los nodos (CSS) pero con pointer-events: none para no bloquear el drag.

Conexiones curvas: usamos simplebezier (preview y edges definitivos).

## 🗺️ Roadmap (ideas)

Undo/redo.

Agrupaciones / contenedores.

Export/Import (PNG/SVG/JSON).

Validaciones topológicas más ricas.

Soporte multi-archivo con pestañas.

(Opcional) Reintegrar Tauri para preferencias y almacenamiento local seguro.

## 📜 Licencia

Este proyecto se publica bajo Apache-2.0 (ver LICENSE).
Puedes incluir un fichero NOTICE para destacar tu atribución y créditos; los distribuidores deben preservar dicho aviso conforme a la licencia.