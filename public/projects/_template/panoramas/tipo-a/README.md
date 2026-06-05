# panoramas/tipo-a/ — Panoramas Equirectangulares Apartamento Tipo A

Coloca aquí los JPGs 360° del Apartamento Tipo A.

## Nombres de archivo esperados

Los nombres deben coincidir exactamente con las rutas en `tour.config.ts`.
Los siguientes son los nombres más comunes; ajusta según el proyecto:

```
acceso.jpg          — Entrada / Hall
sala.jpg            — Sala y comedor
cocina.jpg          — Cocina
alcoba-principal.jpg — Alcoba principal
alcoba-auxiliar.jpg  — Segunda alcoba (si aplica)
bano.jpg            — Baño principal
bano-social.jpg     — Baño social (si aplica)
balcon.jpg          — Balcón / terraza (si aplica)
estudio.jpg         — Estudio / espacio múltiple (si aplica)
```

## Especificaciones técnicas

- **Formato**: JPG (no PNG, no WEBP — Pannellum los carga por URL directa)
- **Proyección**: Equirectangular (relación de aspecto 2:1)
- **Resolución recomendada**: 4096×2048 px (o superior para mejor calidad)
- **Peso recomendado**: 3 MB – 8 MB por panorama
- **Orientación**: El yaw=0 debe apuntar al frente principal del espacio

## Modo VR (Meta Quest)

Si este tipo de apartamento necesita modo VR, crear subcarpeta:
```
tipo-a/vr/
```
Y copiar allí los mismos JPGs (pueden ser las mismas imágenes o versiones
de menor resolución para reducir tiempo de carga en el headset).
