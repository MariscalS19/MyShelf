// Cliente HTTP base. Todos los servicios usan esta función en lugar de fetch directo.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function construirUrl(ruta: string, query?: Query) {
  const url = new URL(API_URL + ruta);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** Convierte el "detail" de FastAPI (texto o lista de errores de validación) en un mensaje legible. */
function mensajeDeError(cuerpo: unknown, status: number): string {
  const detail = (cuerpo as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: { loc?: (string | number)[]; msg?: string }) => {
        const campo = e.loc?.filter((p) => p !== "body").join(".");
        return campo ? `${campo}: ${e.msg}` : e.msg;
      })
      .join(" · ");
  }
  return `Error ${status}`;
}

export async function api<T>(
  ruta: string,
  opciones: { method?: string; body?: unknown; query?: Query; signal?: AbortSignal } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(construirUrl(ruta, opciones.query), {
      method: opciones.method ?? "GET",
      headers: opciones.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
      signal: opciones.signal,
      cache: "no-store",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError("No se pudo conectar con el servidor. ¿Está corriendo la API?", 0);
  }

  if (res.status === 204) return undefined as T;
  const cuerpo = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(mensajeDeError(cuerpo, res.status), res.status);
  return cuerpo as T;
}
