export function limpiarDecimal(v: string, maxDigitosEnteros: number, maxDecimales = 2): string | null {
  const s = v.replace(",", ".").replace(/[^\d.]/g, "");
  const [entero, ...decimales] = s.split(".");

  if (entero.length > maxDigitosEnteros) return null;
  if (maxDecimales === 0 && decimales.length > 0) return null;

  return decimales.length ? `${entero}.${decimales.join("").slice(0, maxDecimales)}` : entero;
}
