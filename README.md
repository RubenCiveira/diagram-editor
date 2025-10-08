# Diagram Editor

**Autor:** Rubén Civeira  
**Licencia:** Apache 2.0  
**Repositorio:** [https://github.com/RubenCiveira/diagram-editor](https://github.com/RubenCiveira/diagram-editor)

Editor visual de diagramas de componentes construido con React Flow. Permite crear, editar y gestionar diagramas arquitectónicos con persistencia en GitHub, formularios dinámicos basados en JSON Schema y una experiencia de usuario moderna e intuitiva.

## ✨ Características Principales

### Editor Visual
- **Lienzo interactivo** con React Flow: nodos arrastrables, zoom, pan, minimapa y controles de navegación
- **Conexiones inteligentes** con curvas Bézier y validación de compatibilidad entre tipos
- **Palette de elementos** con drawer animado y botón flotante "+"
- **Edición in-place** mediante doble clic con formularios JSON Schema

### Tipos de Elementos
- 👤 **Usuarios**: actores del sistema
- 🚪 **Gateways**: puntos de entrada API
- 🖥️ **Shells UI**: aplicaciones frontend
- 🧩 **Micro Frontends**: componentes frontend distribuidos
- ⚙️ **Microservicios**: servicios backend
- 🔧 **Configuraciones Proxy**: enrutamiento y balanceo
- 🌐 **Servicios Externos**: APIs de terceros
- 📡 **APIs**: interfaces de comunicación
- 📝 **Notas**: anotaciones con soporte Markdown

### Gestión de Diagramas
- **Interfaces para almacenaje**: abstracción de las persistencia de los ficheros
- **Integración con GitHub**: persistencia directa en repositorios (con control de versiones)
- **Operaciones CRUD** completas: crear, leer, actualizar y eliminar diagramas
- **Formato unificado** con validación Zod

### Experiencia de Usuario
- **Overlay de carga** durante operaciones asíncronas
- **Formularios dinámicos** con Material UI y React JSON Schema Form
- **Widgets personalizados**: editor Markdown con vista previa, selector de colores
- **Persistencia de sesión** en `sessionStorage` para configuración GitHub

## 🏗️ Arquitectura

### Stack Tecnológico

**Core**
- React 18 + TypeScript
- Vite (build tool)
- [React Flow](https://reactflow.dev/) v11 - Motor del editor de diagramas

**Formularios y Validación**
- [@rjsf/core](https://rjsf-team.github.io/react-jsonschema-form/) - React JSON Schema Forms
- @rjsf/mui - Integración con Material UI
- @rjsf/validator-ajv8 - Validación con Ajv 8
- Zod - Validación de modelos TypeScript

**UI y Estilos**
- @mui/material - Material Design components
- @emotion/react + @emotion/styled - CSS-in-JS
- lucide-react - Biblioteca de iconos
- react-markdown - Renderizado de Markdown

**Integración**
- GitHub REST API (fetch nativo)

**Opcional**
- Tauri - Desktop app (roadmap)

### Estructura del Código

```
diagram-editor/
├── src/
│   ├── types/              # Definiciones TypeScript
│   │   ├── DiagramModel.ts # Modelo de datos principal
│   │   └── DiagramElementType.ts # Interfaz de tipos de elementos
│   ├── elements/           # Implementaciones de elementos
│   │   ├── UserElement.ts
│   │   ├── GatewayElement.ts
│   │   ├── MicroserviceElement.ts
│   │   ├── NoteElement.ts
│   │   └── ...
│   ├── components/         # Componentes React
│   │   ├── DiagramEditor/  # Editor principal
│   │   ├── Palette/        # Barra de herramientas
│   │   ├── SchemaForm/     # Formulario de propiedades
│   │   ├── GitHubConfig/   # Configuración de GitHub
│   │   └── CustomWidgets/  # Widgets RJSF personalizados
│   ├── services/           # Lógica de negocio
│   │   ├── githubService.ts # Operaciones GitHub API
│   │   └── validationService.ts # Validación de conexiones
│   └── utils/              # Utilidades
│       └── storage.ts      # Gestión sessionStorage
```

### Modelo de Datos

El sistema utiliza un modelo unificado `DiagramModel` validado con Zod:

```typescript
interface DiagramModel {
  version: string;           // Versión del formato
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
  nodes: DiagramNode[];      // Lista de nodos
  edges: DiagramEdge[];      // Lista de conexiones
}

interface DiagramNode {
  id: string;                // Identificador único
  kind: string;              // Tipo de elemento
  name: string;              // Nombre visible
  props: Record<string, any>; // Propiedades específicas del tipo
  position: { x: number; y: number }; // Posición en canvas
  description?: string;      // Descripción opcional
}

interface DiagramEdge {
  id: string;                // Identificador único
  source: string;            // ID del nodo origen
  target: string;            // ID del nodo destino
  description?: string;      // Descripción de la relación
  technology?: string;       // Tecnología de comunicación
}
```

### Sistema de Tipos Extensible

Cada tipo de elemento implementa la interfaz `DiagramElementType`:

```typescript
interface DiagramElementType<TProps = any> {
  // Identificación
  kind: string;              // Identificador único del tipo
  title: string;             // Nombre visible

  // Iconografía
  paletteIcon: React.ReactNode;  // Icono en palette
  nodeIcon: React.ReactNode;     // Icono en nodo

  // Schema y validación
  schema: JSONSchema;        // JSON Schema para propiedades
  uiSchema?: JSONUiSchema;   // Configuración de presentación RJSF

  // Métodos de configuración
  defaultProps(): TProps;    // Propiedades por defecto
  label(data: { name?: string; props: TProps }): string;  // Etiqueta del nodo
  
  // Comportamiento visual
  nodeSize?(args: { props: TProps }): { width: number; height: number };
  renderShape?(args: { name?: string; props: TProps; icon: React.ReactNode }): React.ReactNode;
  
  // Comportamiento de conexiones
  acceptsIncoming?(args: { props: TProps }): boolean;  // Acepta aristas entrantes
  acceptsOutgoing?(args: { props: TProps }): boolean;  // Acepta aristas salientes
  verifyConnectTo?(args: {                            // Validación de conexión
    source: DiagramNode & { props: TProps };
    target: DiagramNode;
    targetKind: DiagramNode['kind'];
    targetType: DiagramElementType<any>;
  }): void;  // Lanza Error si no permite la conexión
  
  // Características especiales
  isBackground?(): boolean;   // Renderiza detrás de otros nodos (ej: notas)
  isResizable?(args: { props: TProps }): boolean;  // Permite redimensionar
}
```

### Validación de Conexiones

El sistema valida conexiones mediante `verifyConnectTo()`:

1. Al arrastrar una arista desde un nodo origen
2. Se invoca `sourceType.verifyConnectTo(source, target, targetKind, targetType)`
3. Si lanza `Error`, la conexión se cancela y se muestra alerta
4. Si no lanza error, la conexión se permite

Ejemplo:
```typescript
verifyConnectTo({ source, target, targetKind }) {
  if (targetKind === 'user') {
    throw new Error('Los microservicios no pueden conectar directamente a usuarios');
  }
}
```

### Formularios Dinámicos

Los formularios se generan automáticamente desde `schema` y `uiSchema`:

**Widgets personalizados disponibles:**
- `markdown`: Editor con vista previa en tiempo real
- `color`: Selector de color HTML5

**Ejemplo de uiSchema:**
```typescript
uiSchema = {
  'ui:order': ['protocol', 'basePath', 'version', 'auth', 'specUrl'],
  protocol: { 
    'ui:widget': 'select',
    'ui:placeholder': 'Selecciona protocolo'
  },
  description: {
    'ui:widget': 'markdown'
  },
  color: {
    'ui:widget': 'color'
  },
  specUrl: { 
    'ui:help': 'Enlace a especificación OpenAPI/AsyncAPI' 
  }
}
```

### Características Especiales

**Notas con Markdown:**
- `isBackground()` retorna `true` → se renderizan detrás
- `isResizable()` retorna `true` → redimensionables
- `acceptsIncoming/Outgoing()` retorna `false` → no conectables
- `renderShape()` personalizado con renderizado Markdown

**Gestión de Z-Index:**
- Aristas: `pointer-events: none` para no bloquear drag
- Conexiones curvas con `simplebezier` (preview y definitivas)
- Notas en background layer

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- npm / pnpm / yarn
- (Opcional) Tauri toolchain para versión desktop

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/RubenCiveira/diagram-editor.git
cd diagram-editor

# Instalar dependencias
npm install

# O con pnpm/yarn
pnpm install
# yarn install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

### Build de Producción

```bash
# Generar build optimizado
npm run build

# Preview del build
npm run preview
```

## 🔐 Configuración GitHub

### Obtener Token de Acceso

1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Genera un nuevo token con permisos:
   - `repo` (acceso completo a repositorios)
   - O mínimamente: `contents:read` y `contents:write`

### Configurar en la Aplicación

En la barra superior de la aplicación:

1. Clic en el icono de configuración
2. Completa los campos:
   - **Owner**: Usuario o organización propietaria del repo
   - **Repo**: Nombre del repositorio
   - **Branch**: Rama a utilizar (ej: `main`, `develop`)
   - **Directory**: Ruta del directorio para diagramas (ej: `diagrams/`)
   - **Token**: Tu token de acceso personal

La configuración se guarda en `sessionStorage` y persiste durante la sesión del navegador.

## 📝 Uso

### Gestión de Archivos

**Barra superior:**
- **Selector de archivo**: Dropdown con archivos `.json` del directorio configurado
- **Nuevo**: Crea un nuevo diagrama vacío
- **Borrar**: Elimina el archivo seleccionado (requiere confirmación)
- **Cargar**: Refresca el diagrama desde GitHub
- **Guardar**: Sube cambios a GitHub con control de versión SHA

### Crear Diagramas

1. **Añadir elementos**: Clic en botón "+" → selecciona tipo del drawer
2. **Posicionar**: Arrastra elementos por el canvas
3. **Conectar**: Arrastra desde el handle de un nodo a otro
4. **Editar propiedades**: Doble clic en un nodo → formulario de edición
5. **Navegar**: Zoom (rueda del ratón), pan (arrastrar canvas), minimapa

### Controles del Canvas

- **Zoom In/Out**: Botones `+` / `-` o rueda del ratón
- **Fit View**: Ajusta el zoom para ver todos los elementos
- **Minimapa**: Vista general del diagrama en esquina
- **Pan**: Click y arrastra en área vacía del canvas

## 🎨 Personalización

### Añadir Nuevos Tipos de Elementos

1. Crea un archivo en `src/elements/`:

```typescript
import { DiagramElementType } from '../types/DiagramElementType';

export const MyCustomElement: DiagramElementType<MyCustomProps> = {
  kind: 'my-custom',
  title: 'Mi Elemento',
  paletteIcon: <MyIcon />,
  nodeIcon: <MyIcon />,
  
  schema: {
    type: 'object',
    properties: {
      customProp: { type: 'string', title: 'Propiedad' }
    }
  },
  
  defaultProps() {
    return { customProp: 'valor por defecto' };
  },
  
  label({ name, props }) {
    return name || props.customProp;
  },
  
  verifyConnectTo({ targetKind }) {
    if (targetKind === 'invalid-type') {
      throw new Error('No se puede conectar a este tipo');
    }
  }
};
```

2. Registra el elemento en el sistema (típicamente en un archivo de configuración central)

### Crear Widgets Personalizados

Añade widgets en `src/components/CustomWidgets/`:

```typescript
export const MyCustomWidget: React.FC<WidgetProps> = (props) => {
  return (
    <div>
      <label>{props.label}</label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
};
```

Registra en `SchemaForm.tsx`:

```typescript
const customWidgets = {
  'my-custom': MyCustomWidget,
  markdown: MarkdownWidget,
  color: ColorWidget
};
```

## 🗺️ Roadmap

### Corto Plazo
- [ ] Undo/Redo con historial de cambios
- [ ] Export/Import en múltiples formatos (PNG, SVG, JSON)
- [ ] Validaciones topológicas avanzadas
- [ ] Atajos de teclado

### Medio Plazo
- [ ] Agrupaciones y contenedores de nodos
- [ ] Soporte multi-archivo con pestañas
- [ ] Templates de diagramas predefinidos
- [ ] Búsqueda y filtrado de elementos

### Largo Plazo
- [ ] Colaboración en tiempo real
- [ ] Versionado integrado con Git
- [ ] Generación automática de documentación
- [ ] Integración con Tauri para app desktop
- [ ] Temas personalizables

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Por favor asegúrate de:
- Seguir las convenciones de código existentes
- Añadir tests para nuevas funcionalidades
- Actualizar la documentación según sea necesario

## 📄 Licencia

Este proyecto está licenciado bajo Apache License 2.0. Ver el archivo [LICENSE](LICENSE) para más detalles.

Según los términos de la licencia Apache 2.0:
- ✅ Uso comercial permitido
- ✅ Modificación permitida
- ✅ Distribución permitida
- ✅ Uso de patentes permitido
- ⚠️ Debes incluir el archivo LICENSE original
- ⚠️ Debes incluir el archivo NOTICE si existe
- ⚠️ Debes indicar cambios significativos

## 🙏 Créditos

Construido con:
- [React Flow](https://reactflow.dev/) - Motor de diagramas interactivos
- [React JSON Schema Form](https://rjsf-team.github.io/react-jsonschema-form/) - Generación de formularios
- [Material UI](https://mui.com/) - Componentes UI
- [Lucide React](https://lucide.dev/) - Iconos
- [Zod](https://zod.dev/) - Validación TypeScript

---

**Desarrollado con ❤️ por Rubén Civeira**