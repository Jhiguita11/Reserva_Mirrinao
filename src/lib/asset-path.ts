const base = process.env.NODE_ENV === 'production' ? '/Reserva_Mirrinao' : '';

export function assetPath(path: string): string {
  return `${base}${path}`;
}
