# branding/ — Logos del Proyecto y la Constructora

Coloca aquí los archivos de logos usados en el tour.

## Archivos necesarios

### Logo del proyecto (para BrandLogo y splash screen)

```
LogoProyectoSinFondo.png    — Logo del proyecto sobre fondo transparente
```

Este archivo se referencia en `tour.config.ts`:
```typescript
brand: {
  logo: BRAND('LogoProyectoSinFondo.png'),
}
```

El componente `BrandLogo` lo colorea por CSS (mask-image), así que el logo
debe ser blanco o de un solo color sólido sobre fondo transparente.

### Logo de la constructora (para el header y sidebar)

```
LogoConstructoraHorizontal.png   — Versión horizontal (header del selector)
LogoConstructoraVertical.png     — Versión vertical (opcional)
```

### Logo de MIESGROUP (productor del tour)

```
MIES LOGO_Horizontal Blanco.png  — Copia o symlink del logo de MIESGROUP
```

## Especificaciones

- **Formato**: PNG con canal alfa (transparencia)
- **Fondo**: transparente
- **Color**: blanco o monocromático para el logo del proyecto (BrandLogo lo tiñe por CSS)
- **Resolución**: mínimo 500px en la dimensión más larga
- **Peso**: máximo 200 KB por archivo

## Actualizar las referencias en el código

Si usas nombres distintos a los del template, actualiza estas referencias:

1. `tour.config.ts` — `brand.logo` y todas las llamadas `BRAND('...')`
2. `src/components/brand-logo.tsx` — constante `LOGO` al principio del archivo
3. `src/components/splash-screen.tsx` — función `BRAND` y las imágenes del co-branding
4. `src/components/left-sidebar.tsx` — los `<img>` con logos en el footer del sidebar
5. `src/components/building-selector.tsx` — el `<img>` de la constructora en el header

## Ruta de uso en tour.config.ts

```typescript
const BRAND = (path: string) => assetPath(`/projects/<constructora>/branding/${path}`);
logo: BRAND('LogoProyectoSinFondo.png')
```

> Nota: La carpeta branding/ vive dentro de `<constructora>/`, no dentro de
> `<proyecto>/`, porque los logos de la constructora son compartidos entre
> todos sus proyectos. Ejemplo: `melendez/branding/` sirve a todos los
> proyectos de Constructora Melendez.
