# panoramas/tipo-b/ — Panoramas Equirectangulares Apartamento Tipo B

Coloca aquí los JPGs 360° del Apartamento Tipo B.

## Nombres de archivo esperados

```
acceso.jpg          — Entrada / Hall
sala.jpg            — Sala y comedor
cocina.jpg          — Cocina (si aplica)
alcoba-principal.jpg — Alcoba principal
alcoba-auxiliar.jpg  — Segunda alcoba (si aplica)
bano.jpg            — Baño principal
balcon.jpg          — Balcón / terraza (si aplica)
estudio.jpg         — Estudio / espacio múltiple (si aplica)
```

## Subcarpeta VR

```
tipo-b/vr/
    acceso.jpg
    sala.jpg
    ... (mismas imágenes para modo A-Frame / Meta Quest)
```

Los archivos en `vr/` son los que usa `public/vr.html` para el modo VR.
Pueden ser copias de los anteriores o versiones optimizadas para carga rápida.

## Especificaciones técnicas

- **Formato**: JPG
- **Proyección**: Equirectangular (relación 2:1)
- **Resolución**: 4096×2048 px recomendado
- **Peso**: 3 MB – 8 MB por panorama
