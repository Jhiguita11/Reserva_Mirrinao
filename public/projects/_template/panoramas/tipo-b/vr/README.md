# panoramas/tipo-b/vr/ — Panoramas para Modo VR (Meta Quest)

Coloca aquí los mismos JPGs del Tipo B que usará el modo A-Frame (`public/vr.html`).

Pueden ser exactamente los mismos archivos que están en `tipo-b/`, o versiones
de menor resolución (2048×1024 px) para reducir el tiempo de carga en el headset.

## Nombres de archivo

Deben coincidir exactamente con los valores de la variable `BASE` + nombre en `vr.html`:

```
acceso.jpg
sala.jpg
estudio.jpg
alcoba-principal.jpg
alcoba-auxiliar.jpg
alcoba-opcion-2.jpg
bano.jpg
```

## Actualizar vr.html

En `public/vr.html`, cambia la variable `BASE` a la ruta de este proyecto:

```javascript
var BASE = 'projects/<constructora>/<proyecto>/panoramas/tipo-b/vr/';
```

Y actualiza el objeto `SCENES` con los nombres y hotspots del nuevo proyecto.
