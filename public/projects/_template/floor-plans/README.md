# floor-plans/ — Planos de Planta

Coloca aquí los planos de planta del proyecto.

## Archivos necesarios

### Plano con burbujas de marcación (para el floor plan interactivo)

Este es el plano que aparece en el visor de planta interactivo dentro del tour.
Debe tener marcas visuales (burbujas, puntos, números) que indiquen la ubicación
de cada escena 360° para facilitar la calibración de coordenadas.

```
CM_VA_Plantas Ambientadas_..._APTO B _MARCACIÓN BURBUJAS.jpg
```

Este archivo se referencia en `tour.config.ts` en la propiedad `backgroundImage`
del `floorPlan` del apartamento correspondiente.

### Calibración de coordenadas (dotX / dotY)

Una vez colocado el plano, abre el visor con `?debug=1` en la URL:
```
http://localhost:3000?debug=1
```
Esto activa el modo de arrastre de burbujas. Arrastra cada burbuja a la posición
correcta sobre el plano y copia las coordenadas resultantes a `tour.config.ts`.

### Plano limpio (para la galería de plantas)

Plano sin burbujas para mostrar al usuario en la vista "Plantas" del sidebar.
Se referencia en la propiedad `plantas[]` del `TourConfig`.

```
plano-tipo-a.jpg    — Planta Tipo A (limpia, sin marcaciones)
plano-tipo-b.jpg    — Planta Tipo B (limpia, sin marcaciones)
```

## Formato recomendado

- JPG, alta resolución (mínimo 1500px de ancho)
- Orientación: norte hacia arriba si es posible
- Fondo blanco o muy claro para mejor contraste
