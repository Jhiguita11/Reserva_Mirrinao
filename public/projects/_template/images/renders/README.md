# images/renders/ — Renders de Zonas Comunes

Coloca aquí los renders interiores de zonas comunes y amenities del proyecto.
Estas imágenes aparecen en la sección "Galería" del sidebar del tour.

## Nombres sugeridos

```
gimnasio.jpg
piscina.jpg
lobby.jpg
salon-comunal.jpg
terraza-comunal.jpg
zona-bbq.jpg
parqueadero.jpg
```

## Activar en el tour

Una vez colocados los archivos, edita `tour.config.ts` y agrega las entradas
en el array `gallery`:

```typescript
gallery: [
  {
    id: 'gimnasio',
    src: assetPath('/projects/<constructora>/<proyecto>/images/renders/gimnasio.jpg'),
    title: 'Gimnasio',
  },
  {
    id: 'piscina',
    src: assetPath('/projects/<constructora>/<proyecto>/images/renders/piscina.jpg'),
    title: 'Piscina',
    caption: 'Área exclusiva para residentes',
  },
],
```

## Especificaciones

- **Formato**: JPG
- **Orientación**: horizontal (landscape) recomendado
- **Resolución**: mínimo 1920×1080 px
- **Peso**: máximo 2 MB por imagen
