import type { Grupo, Usuario } from "@/src/types";
import { api } from "./api";

export const usuariosService = {
  crear: (nombre: string) => api<Usuario>("/usuarios", { method: "POST", body: { nombre } }),
  obtener: (id: number) => api<Usuario>(`/usuarios/${id}`),
  grupos: (id: number, signal?: AbortSignal) => api<Grupo[]>(`/usuarios/${id}/grupos`, { signal }),
};
