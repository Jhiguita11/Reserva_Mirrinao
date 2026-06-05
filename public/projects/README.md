# public/projects/ — Assets de Proyectos MIESGROUP

Esta carpeta contiene todos los assets estáticos (imágenes, logos, planos)
de los proyectos de recorrido virtual producidos por MIESGROUP.

---

## Estructura de carpetas

```
public/projects/
├── _template/                      Carpeta de referencia para proyectos nuevos
│   ├── branding/                   Logos placeholder (README con instrucciones)
│   ├── floor-plans/                Planos de planta (README con instrucciones)
│   ├── images/
│   │   └── exterior/               Foto o render exterior del edificio
│   └── panoramas/
│       ├── tipo-a/                 Panoramas 360 del Tipo A (si aplica)
│       │   └── README.md
│       ├── tipo-b/                 Panoramas 360 del Tipo B (si aplica)
│       │   └── README.md
│       └── edificio-a/             Alternativa para proyectos con un solo tour
│           └── unidad-01/
│               └── README.md
│
└── <constructora>/                 Una carpeta por cada constructora cliente
    ├── branding/                   Logos de la constructora (compartidos entre proyectos)
    └── <proyecto>/                 Una carpeta por cada proyecto
        ├── panoramas/
        │   ├── tipo-a/             (si hay dos tipologías)
        │   ├── tipo-b/
        │   └── vr/                 Copias de panoramas para modo VR A-Frame (Quest)
        ├── images/
        │   ├── exterior/           Foto o render exterior para OG/preview
        │   └── renders/            Renders interiores de zonas comunes / amenities
        └── floor-plans/            Planos del arquitecto (JPG/PNG con marcación de burbujas)
```

---

## Proyectos activos

| Constructora          | Proyecto    | Carpeta                  | Estado                              |
|-----------------------|-------------|--------------------------|-------------------------------------|
| Constructora Meléndez | MIRRIÑAO    | melendez/mirrinao/       | Activo — pendiente de assets        |

---

## Convenciones de nomenclatura

- Carpetas: minúsculas, guiones, sin acentos, sin espacios
- Constructora: nombre corto (`melendez`, `ospinas`, `amarilo`, `cusezar`)
- Proyecto: URL-friendly (`valle-alto`, `san-pablo`, `reserva-norte`)
- Panoramas: `nombre-escena.jpg` (`sala.jpg`, `alcoba-principal.jpg`, `acceso.jpg`)
- Logos: descriptivos (`LogoProyectoSinFondo.png`, `LogoConstructoraHorizontal.png`)

---

## Guía paso a paso: crear un segundo recorrido 360

### Paso 1 — Copiar la carpeta de assets

```
Copia: public/projects/_template/
Pega como: public/projects/<constructora>/<proyecto>/
```

Ejemplo para el proyecto "San Pablo" de Ospinas:
```
public/projects/ospinas/san-pablo/
```

### Paso 2 — Copiar la configuración TypeScript

```
Copia: src/projects/_template/
Pega como: src/projects/<constructora>/<proyecto>/
```

Ejemplo:
```
src/projects/ospinas/san-pablo/
```

### Paso 3 — Colocar los assets

Dentro de `public/projects/<constructora>/<proyecto>/`:

| Carpeta                    | Qué poner                                                    |
|----------------------------|--------------------------------------------------------------|
| `branding/`                | Logos del proyecto y la constructora (PNG transparente)      |
| `panoramas/tipo-a/`        | JPGs equirectangulares Tipo A (si aplica)                    |
| `panoramas/tipo-b/`        | JPGs equirectangulares Tipo B (si aplica)                    |
| `panoramas/tipo-b/vr/`     | Mismos JPGs pero para modo VR A-Frame (pueden ser copias)    |
| `floor-plans/`             | Plano JPG del arquitecto con burbujas de marcación           |
| `images/exterior/`         | Foto o render exterior (para OG preview, 1200×630 ideal)     |
| `images/renders/`          | Renders interiores de zonas comunes (galería del proyecto)   |

**Nombres de panoramas recomendados:**
```
acceso.jpg / entrada.jpg
sala.jpg
cocina.jpg
alcoba-principal.jpg
alcoba-auxiliar.jpg
bano.jpg
estudio.jpg
balcon.jpg
```

### Paso 4 — Editar tour.config.ts

Abre `src/projects/<constructora>/<proyecto>/tour.config.ts` y reemplaza:

1. `_constructora_` → nombre de la constructora (ej: `ospinas`)
2. `_proyecto_` → nombre del proyecto (ej: `san-pablo`)
3. `_NOMBRE DEL PROYECTO_` → nombre visible (ej: `San Pablo`)
4. `_NOMBRE DE LA CONSTRUCTORA_` → nombre visible (ej: `Ospinas`)
5. Ajusta el `theme` con los colores del proyecto
6. Define las escenas con sus panoramas y hotspots placeholder
7. Calibra los hotspots (pitch/yaw) probando en `?debug=1`

### Paso 5 — Editar metadata.ts

Abre `src/projects/<constructora>/<proyecto>/metadata.ts` y completa:
- `title` y `description` para SEO
- `ogImage` apuntando a la imagen exterior del proyecto
- `keywords` con términos del proyecto

### Paso 6 — Activar el proyecto en la app

Edita **dos archivos**:

**1. `src/lib/tour-store.ts`** — cambia el import del config:
```typescript
// Proyecto activo actual (MIRRIÑAO):
import tourConfig from '@/projects/melendez/mirrinao/tour.config';

// Nuevo proyecto de ejemplo:
import tourConfig from '@/projects/ospinas/san-pablo/tour.config';
```

**2. `src/app/layout.tsx`** — actualiza los metadatos:
```typescript
// Actual:
export const metadata: Metadata = {
  title: "MIRRIÑAO | Recorrido Virtual 360°",
  ...
};

// Después: importa desde metadata.ts del nuevo proyecto
```

### Paso 7 — Actualizar el modo VR (si aplica)

Si el nuevo proyecto necesita modo VR para Meta Quest:

1. Copia `public/vr.html` o edita directamente
2. Cambia la variable `BASE` al path de panoramas VR del nuevo proyecto:
   ```javascript
   var BASE = 'projects/<constructora>/<proyecto>/panoramas/tipo-b/vr/';
   ```
3. Actualiza el objeto `SCENES` con las escenas del nuevo proyecto
4. Actualiza el link VR en `src/components/left-sidebar.tsx`:
   - El mapa `VR_SCENE_MAP` debe reflejar los IDs del nuevo tour

### Paso 8 — Probar localmente

```bash
bun run dev
# Abre http://localhost:3000
```

Parámetros de URL útiles para pruebas:
- `?debug=1` — activa panel de debug + arrastrar burbujas de floor plan
- `?preview=<apt-id>` — carga directa sin splash/welcome
- `?preview=<apt-id>&scene=<scene-id>` — carga directa en escena específica

### Paso 9 — Build y deploy

```bash
bun run build
# Resultado en out/
```

---

## Notas importantes

- Los panoramas deben ser **equirectangulares** (relación 2:1, ej: 4096×2048 px)
- Formato recomendado: **JPG** al 80-90% de calidad
- Tamaño recomendado: entre 3 MB y 8 MB por panorama (equilibrio calidad/velocidad)
- El archivo `building.png` en `public/` es la imagen de fondo del selector de apartamentos
- Si un apartamento no tiene panoramas reales, el selector lo mostrará como "Próximamente" automáticamente
