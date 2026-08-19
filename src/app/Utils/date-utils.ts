const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function partesFecha(fecha: string): [number, number, number] {
  const [y, m, d] = (fecha || '').split('T')[0].split('-').map(Number);
  return [
    Number.isFinite(y) ? y : 0,
    Number.isFinite(m) ? m : 0,
    Number.isFinite(d) ? d : 0,
  ];
}

export function edad(fechaNacimiento: string | null): number {
  if (!fechaNacimiento) return 0;
  const [anio, mes, dia] = partesFecha(fechaNacimiento);
  const hoy = new Date();
  let e = hoy.getFullYear() - anio;
  const m = hoy.getMonth() + 1 - mes;
  if (m < 0 || (m === 0 && hoy.getDate() < dia)) e--;
  return e;
}

export function proximoCumple(fechaNacimiento: string): Date {
  const [, mes, dia] = partesFecha(fechaNacimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const prox = new Date(hoy.getFullYear(), mes - 1, dia);
  if (prox < hoy) {
    prox.setFullYear(prox.getFullYear() + 1);
  }
  return prox;
}

export function diasRestantes(fechaNacimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const prox = proximoCumple(fechaNacimiento);
  prox.setHours(0, 0, 0, 0);
  return Math.ceil((prox.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function edadACumplir(fechaNacimiento: string): number {
  const [anio] = partesFecha(fechaNacimiento);
  return proximoCumple(fechaNacimiento).getFullYear() - anio;
}

export function formatoDiaMes(fecha: string): string {
  const [, mes, dia] = partesFecha(fecha);
  return `${dia} de ${MESES[mes - 1]}`;
}
