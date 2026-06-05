# MIRRIÑAO — Constructora Meléndez

Proyecto de recorrido virtual 360° producido por MIESGROUP para Constructora Meléndez.

El proyecto tiene **un tour**: la **Casa Grande**, una "Casa Medianera" de **dos pisos**
(89 m² const. / 67 m² priv.) con **10 espacios** fotografiados en 360°.

| Piso         | Espacios                                                                 |
|--------------|--------------------------------------------------------------------------|
| Primer piso  | Acceso · Sala · Comedor · Cocina + Patio de ropas · Patio Exterior       |
| Segundo piso | Alcoba Principal · Alcoba Auxiliar 1 · Alcoba Auxiliar 2 · Baño Principal · Baño Social |

Los pisos se conectan por la escalera (hotspots Sala ⇄ Alcoba Principal).
5 escenas tienen además variante **Obra gris** (Sala · Cocina+Patio · Alcoba Principal · Baño Social · Patio Exterior).

---

## Archivos de configuración

| Archivo          | Propósito                                                          |
|------------------|--------------------------------------------------------------------|
| `tour.config.ts` | Config del tour: escenas, hotspots, variantes obra gris, plano, galería. Export default `mirrinao`. |
| `metadata.ts`    | Metadatos SEO: title, description, Open Graph                      |

---

## Estructura de assets

```
public/projects/melendez/mirrinao/
  panoramas/
    casa-grande/        Panoramas amueblados (10 escenas)
      acceso.jpg  sala.jpg  comedor.jpg  cocina-patio.jpg  patio-exterior.jpg
      alcoba-principal.jpg  alcoba-auxiliar-1.jpg  alcoba-auxiliar-2.jpg
      bano-principal.jpg  bano-social.jpg
      obra-gris/        Variante obra gris (5 escenas)
        sala.jpg  cocina-patio.jpg  alcoba-principal.jpg  bano-social.jpg  patio-exterior.jpg
      vr/               Copia de los JPGs para modo A-Frame (Quest) — 10 escenas
        acceso.jpg  sala.jpg  comedor.jpg  cocina-patio.jpg  patio-exterior.jpg
        alcoba-principal.jpg  alcoba-auxiliar-1.jpg  alcoba-auxiliar-2.jpg
        bano-principal.jpg  bano-social.jpg
  floor-plans/
    planta-casa-grande.jpg   Planta combinada (Primer Piso | Segundo Piso) con burbujas
  images/
    exterior/        PENDIENTE — render o foto exterior (para OG preview, 1200×630 px)
    renders/         PENDIENTE — 5 renders de galería (03_Galeria del entregable)
```

---

## Modo VR (Meta Quest)

`public/vr.html` contiene el tour VR (página A-Frame estática). Ya está apuntando a
Casa Grande:

- `BASE = 'projects/melendez/mirrinao/panoramas/casa-grande/vr/'`
- El objeto `SCENES` define las 10 escenas con sus hotspots (claves cortas sin el prefijo `cg-`).
- `VR_SCENE_MAP` en `src/components/left-sidebar.tsx` mapea `cg-<escena>` → `<escena>`.

Mantener `SCENES` (vr.html) y `VR_SCENE_MAP` (left-sidebar.tsx) sincronizados.
Los yaw/pitch de los hotspots VR están portados del `tour.config.ts` (primera pasada);
afinar probando en el Quest.

---

## Lista de pendientes

### Calibración

- [x] Hotspots (pitch/yaw) del tour 2D aplicados desde `CAMBIOS_HOTSPOTS_BURBUJAS.TXT` (coords finales del cliente). Cambios: "Segundo Piso" ahora abre **Baño Social**; Acceso/Comedor ganan burbujas; Baño Social es el hub del 2º piso; quitadas las marcadas "NO VISIBLE".
- [x] Posiciones de "Ver Obra Gris" actualizadas en Patio Exterior, Cocina y Patio, Baño Social (Sala y Alcoba Ppal conservan obra gris en su posición previa)
- [x] Grafo del VR (`vr.html`) sincronizado con el mismo grafo y coords portadas
- [ ] Afinar `dotX/dotY` del plano arrastrando las burbujas en el modo debug del floor plan
- [ ] Afinar `radarOffset` del cono del radar por escena en `?debug=1` (teclas `[` y `]`, Shift=±5°). Hay estimados sembrados; "copiar todo" exporta dotX/dotY/radarOffset. Si el cono gira espejado, poner `RADAR_YAW_SIGN = -1` en `floor-plan.tsx`.
- [ ] Confirmar área real (plano indica 89 m² const. / 67 m² priv.)
- [ ] Probar y calibrar los hotspots del modo VR en el Meta Quest (coords portadas del 2D; la convención VR puede requerir ajuste)

### Branding ✅ (hecho)

- [x] Logos procesados a `public/projects/melendez/mirrinao/branding/` (`logo-vertical-color.png`, `logo-horizontal-color.png`)
- [x] Paleta tierra aplicada (mostaza `#CB9415` · caramelo `#8E6849` · marrón `#4B2C10` · crema `#FFF9E9`) en `theme`, `globals.css` y ~20 componentes
- [x] Marca renombrada a **Reserva de Mirriñao** (`brand`, `metadata`, `layout.tsx`)
- [x] Tipografía serif (Playfair Display) en títulos vía `--font-serif` / clase `font-serif`
- [x] Splash rediseñado: fondo crema + logo vertical a color + co-branding Meléndez/MIES

Notas: el logo a color (texto marrón) solo se usa sobre fondo claro (splash). En el
resto del UI (oscuro) se usa la silueta teñida en crema vía `BrandLogo mode="mono"`.

### Galería y plantas ✅ (hecho)

- [x] 5 renders de `03_Galeria` optimizados (2000px, q80) a `images/renders/`: `sala-comedor.jpg`, `cocina.jpg`, `alcoba-principal.jpg`, `alcoba-auxiliar.jpg`, `bano-principal.jpg`
- [x] Array `gallery` poblado en `tour.config.ts` (con title + caption)

### SEO / Metadata

- [x] Imagen exterior real (Casa Grande) → `images/exterior/building.jpg` (1200×630, para OG)
- [x] `public/building.png` reemplazado por el exterior real del proyecto (fondo del selector). Hotspot del apartamento ubicado en `hotspotX: 52, hotspotY: 49` sobre la fachada marcada.
- [x] `metadata.ts` y `layout.tsx` actualizados a **Reserva de Mirriñao** (casa medianera, no apartamentos)
- [ ] Actualizar dirección real en `metadata.ts` (schema.address) — **pendiente: confirmar con el cliente**
