import type { ResumenAnalisis } from "@/src/types";
import { api } from "./api";

export const analisisService = {
  resumen: (grupoId: number, signal?: AbortSignal) => api<ResumenAnalisis>(`/grupos/${grupoId}/analisis`, { signal }),
};
