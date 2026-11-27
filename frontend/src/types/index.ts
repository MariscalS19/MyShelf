// Tipos que reflejan las respuestas de la API (backend/app/schemas).
// El dinero y las cantidades llegan como string ("45.50") para no perder precisión.

export type Dinero = string;

export type EstadoItem = "pendiente" | "comprado" | "en_inventario";
export type TipoGrupo = "familiar" | "personal" | "fitness" | "compartido" | "otro";
export type RolMiembro = "admin" | "miembro";

export interface Usuario {
  id: number;
  nombre: string;
}

export interface Grupo {
  id: number;
  nombre: string;
  tipo: TipoGrupo;
  codigo_invitacion: string;
  num_miembros: number;
}

export interface Miembro {
  usuario_id: number;
  nombre: string;
  rol: RolMiembro;
}

/** Atributos variables guardados en JSONB (unidad, marca, etc.). */
export type DetallesItem = Record<string, string | number | boolean | null>;

export interface Item {
  id: number;
  grupo_id: number;
  agregado_por_id: number | null;
  agregado_por_nombre: string | null;
  nombre: string;
  categoria: string;
  estado: EstadoItem;
  cantidad: string;
  precio_estimado: Dinero | null;
  precio_pagado: Dinero | null;
  fecha_caducidad: string | null; // YYYY-MM-DD
  imagen_url: string | null;
  detalles: DetallesItem | null;
  creado_en: string;
  comprado_en: string | null;
}

export interface ItemCrear {
  nombre: string;
  categoria?: string;
  estado?: EstadoItem;
  cantidad?: string;
  precio_estimado?: Dinero | null;
  precio_pagado?: Dinero | null;
  fecha_caducidad?: string | null;
  imagen_url?: string | null;
  detalles?: DetallesItem | null;
  agregado_por_id?: number | null;
}

export type ItemActualizar = Partial<Omit<ItemCrear, "agregado_por_id">>;

export interface CategoriaResumen {
  categoria: string;
  total_gastado: Dinero;
  num_items: number;
  porcentaje: string;
}

export interface ProductoFrecuente {
  nombre: string;
  veces_comprado: number;
  total_gastado: Dinero;
}

export interface ItemAlerta {
  id: number;
  nombre: string;
  categoria: string;
  fecha_caducidad: string;
  dias_restantes: number;
}

export interface ResumenAnalisis {
  grupo_id: number;
  total_gastado: Dinero;
  total_estimado_pendiente: Dinero;
  gasto_ultimos_30_dias: Dinero;
  conteo_por_estado: Record<EstadoItem, number>;
  por_categoria: CategoriaResumen[];
  mas_comprados: ProductoFrecuente[];
  por_caducar: ItemAlerta[];
  caducados: ItemAlerta[];
}
