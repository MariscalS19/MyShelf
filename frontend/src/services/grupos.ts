import type { Grupo, Miembro, TipoGrupo } from "@/src/types";
import { api } from "./api";

export const gruposService = {
  crear: (datos: { nombre: string; tipo: TipoGrupo; usuario_id: number }) =>
    api<Grupo>("/grupos", { method: "POST", body: datos }),
  unirse: (codigo_invitacion: string, usuario_id: number) =>
    api<Grupo>("/grupos/unirse", { method: "POST", body: { codigo_invitacion, usuario_id } }),
  miembros: (grupoId: number, signal?: AbortSignal) => api<Miembro[]>(`/grupos/${grupoId}/miembros`, { signal }),
  salir: (grupoId: number, usuarioId: number) =>
    api<void>(`/grupos/${grupoId}/miembros/${usuarioId}`, { method: "DELETE" }),
};
