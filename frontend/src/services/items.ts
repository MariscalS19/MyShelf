import type { EstadoItem, Item, ItemActualizar, ItemCrear } from "@/src/types";
import { api } from "./api";

const base = (grupoId: number) => `/grupos/${grupoId}/items`;

export const itemsService = {
  listar: (grupoId: number, filtros: { estado?: EstadoItem; categoria?: string } = {}, signal?: AbortSignal) =>
    api<Item[]>(base(grupoId), { query: filtros, signal }),
  crear: (grupoId: number, datos: ItemCrear) => api<Item>(base(grupoId), { method: "POST", body: datos }),
  actualizar: (grupoId: number, itemId: number, datos: ItemActualizar) =>
    api<Item>(`${base(grupoId)}/${itemId}`, { method: "PATCH", body: datos }),
  cambiarEstado: (grupoId: number, itemId: number, estado: EstadoItem, precio_pagado?: string) =>
    api<Item>(`${base(grupoId)}/${itemId}`, {
      method: "PATCH",
      body: precio_pagado ? { estado, precio_pagado } : { estado },
    }),
  consumir: (grupoId: number, itemId: number, reponer: boolean) =>
    api<Item | null>(`${base(grupoId)}/${itemId}/consumir`, { method: "POST", query: { reponer } }),
  eliminar: (grupoId: number, itemId: number) => api<void>(`${base(grupoId)}/${itemId}`, { method: "DELETE" }),
};
