// En modo portable (ZIP para cualquier subcarpeta) las rutas son RELATIVAS
// al documento: '.' + '/projects/x.jpg' => './projects/x.jpg'.
// En GitHub Pages se antepone el basePath absoluto '/Reserva_Mirrinao'.
const portable = process.env.NEXT_PUBLIC_PORTABLE_BUILD === '1';
const base = portable ? '.' : process.env.NODE_ENV === 'production' ? '/Reserva_Mirrinao' : '';

export function assetPath(path: string): string {
  return `${base}${path}`;
}
