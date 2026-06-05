const base = process.env.NODE_ENV === 'production' ? '/reserva_mirrinao' : '';

export function assetPath(path: string): string {
  return `${base}${path}`;
}
