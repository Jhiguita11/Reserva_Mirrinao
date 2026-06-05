# _template/ — Configuración de Proyecto NEXARQ 360

Esta carpeta es la plantilla de configuración TypeScript para crear nuevos proyectos de recorrido virtual.

## Archivos

| Archivo          | Propósito                                              |
|------------------|--------------------------------------------------------|
| `tour.config.ts` | Configuración del tour: escenas, hotspots, plano, marca, tema |
| `metadata.ts`    | Metadatos SEO: title, description, Open Graph          |
| `README.md`      | Este archivo                                           |

---

## Cómo crear un proyecto nuevo

### 1. Copiar la plantilla

```
Copia: src/projects/_template/
Pega como: src/projects/<constructora>/<proyecto>/
```

Ejemplo:
```
src/projects/ospinas/san-pablo/
```

### 2. Editar tour.config.ts

Las variables principales a cambiar:
```typescript
const CONSTRUCTORA = 'ospinas';   // nombre de carpeta de la constructora
const PROYECTO     = 'san-pablo'; // nombre de carpeta del proyecto
```

Luego:
- Actualiza `brand.name`, `brand.tagline`, `brand.logo`, `brand.website`
- Ajusta `theme` con los colores de marca del proyecto
- Define las escenas con sus panoramas y hotspots
- Configura el `floorPlan` (con o sin imagen de fondo)
- Activa la `gallery` cuando lleguen renders de zonas comunes
- Activa `plantas` cuando lleguen los planos limpios

### 3. Editar metadata.ts

Reemplaza todos los placeholders `_PROYECTO_` y `_CONSTRUCTORA_` con los valores reales.

### 4. Activar en tour-store.ts

```typescript
// src/lib/tour-store.ts
import tourConfig from '@/projects/ospinas/san-pablo/tour.config';
```

### 5. Actualizar layout.tsx

```typescript
// src/app/layout.tsx
import { projectMetadata } from '@/projects/ospinas/san-pablo/metadata';

export const metadata: Metadata = {
  title: projectMetadata.title,
  description: projectMetadata.description,
  // ...
};
```

---

## Modos de tour

### Un solo tour (una tipología)
Usa el export `default templateConfig` del `tour.config.ts`.
Adecuado para proyectos con un único tipo de apartamento.

### Multi-tour (dos tipologías: Tipo A y Tipo B)
Usa el bloque comentado `templateTipoA` / `templateTipoB` al final de `tour.config.ts`.
El export default combina ambas en un selector.
Ver implementación real: `src/projects/melendez/valle-alto/tour.config.ts`

---

## Calibración de hotspots

Los valores `pitch` y `yaw` de cada hotspot se ajustan visualmente con el modo debug:

```
http://localhost:3000?debug=1
```

Esto activa:
- Panel de debug con las coordenadas actuales del cursor en el panorama
- Arrastre de burbujas en el floor plan para ajustar dotX/dotY

---

## Apartamentos sin panoramas

Si un apartamento no tiene panoramas todavía, el selector lo muestra como
"Próximamente" automáticamente. No es necesario hacer nada especial — la
lógica en `building-selector.tsx` y `left-sidebar.tsx` lo detecta cuando
las rutas de panoramas no existen o están vacías.

Para forzar que se muestre como disponible (aunque los panoramas no estén),
basta con agregar al menos una escena con una ruta de panorama real.
