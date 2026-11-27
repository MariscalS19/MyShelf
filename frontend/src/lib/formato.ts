// Utilidades de formato. Aquí solo se FORMATEA: las sumas de dinero las hace el backend.

import type { EstadoItem, TipoGrupo } from "@/src/types";

const moneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function dinero(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  return moneda.format(Number(valor));
}

/** "2.00" -> "2", "1.50" -> "1.5" */
export function cantidad(valor: string): string {
  return valor.includes(".") ? valor.replace(/\.?0+$/, "") : valor;
}

export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/** Días que faltan para una fecha YYYY-MM-DD (negativo si ya pasó). */
export function diasHasta(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  const objetivo = new Date(a, m - 1, d).getTime();
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  return Math.round((objetivo - inicioHoy) / 86_400_000);
}

export function textoCaducidad(dias: number): string {
  if (dias < 0) return dias === -1 ? "Caducó ayer" : `Caducó hace ${-dias} días`;
  if (dias === 0) return "Caduca hoy";
  if (dias === 1) return "Caduca mañana";
  return `Caduca en ${dias} días`;
}

export const CATEGORIAS: { valor: string; etiqueta: string; emoji: string }[] = [
  { valor: "frutas_verduras", etiqueta: "Frutas y verduras", emoji: "🥬" },
  { valor: "lacteos", etiqueta: "Lácteos", emoji: "🥛" },
  { valor: "proteina", etiqueta: "Proteína", emoji: "🥚" },
  { valor: "carnes_frias", etiqueta: "Carnes frías", emoji: "🥓" },
  { valor: "abarrotes", etiqueta: "Abarrotes", emoji: "🍚" },
  { valor: "bebidas", etiqueta: "Bebidas", emoji: "🧃" },
  { valor: "limpieza", etiqueta: "Limpieza", emoji: "🧽" },
  { valor: "higiene", etiqueta: "Higiene", emoji: "🧴" },
  { valor: "suplementos", etiqueta: "Suplementos", emoji: "💪" },
  { valor: "otros", etiqueta: "Otros", emoji: "📦" },
];

export function categoria(valor: string) {
  return (
    CATEGORIAS.find((c) => c.valor === valor) ?? {
      valor,
      etiqueta: valor.replace(/_/g, " ").replace(/^\w/, (l) => l.toUpperCase()),
      emoji: "📦",
    }
  );
}

export const TIPOS_GRUPO: { valor: TipoGrupo; etiqueta: string; emoji: string }[] = [
  { valor: "familiar", etiqueta: "Familiar", emoji: "🏠" },
  { valor: "compartido", etiqueta: "Depa compartido", emoji: "🔑" },
  { valor: "fitness", etiqueta: "Dieta / Gym", emoji: "🏋️" },
  { valor: "personal", etiqueta: "Personal", emoji: "🙋" },
  { valor: "otro", etiqueta: "Otro", emoji: "✨" },
];

export const tipoGrupo = (v: TipoGrupo) => TIPOS_GRUPO.find((t) => t.valor === v) ?? TIPOS_GRUPO[4];

export const ESTADOS: Record<EstadoItem, string> = {
  pendiente: "Pendiente",
  comprado: "Comprado",
  en_inventario: "En inventario",
};
