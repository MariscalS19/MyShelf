"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Resultado<T> {
  clave: string;
  datos: T | null;
  error: string | null;
}

/**
 * Carga datos de la API y los mantiene al día con polling.
 * - Recarga cuando cambian las dependencias (por ejemplo el grupo activo).
 * - Consulta cada `intervaloMs` solo mientras la pestaña está visible.
 * - Limpia el intervalo y cancela la petición al desmontar (sin fugas de memoria).
 */
export function useDatos<T>(
  cargar: ((signal: AbortSignal) => Promise<T>) | null,
  deps: unknown[],
  intervaloMs = 5000,
) {
  const clave = JSON.stringify(deps);
  const [resultado, setResultado] = useState<Resultado<T>>({ clave: "", datos: null, error: null });
  const cargarRef = useRef(cargar);
  const claveRef = useRef(clave);
  const controladorRef = useRef<AbortController | null>(null);

  useEffect(() => {
    cargarRef.current = cargar;
    claveRef.current = clave;
  });

  const recargar = useCallback(async () => {
    const fn = cargarRef.current;
    if (!fn) return;
    const claveActual = claveRef.current;
    controladorRef.current?.abort();
    const controlador = new AbortController();
    controladorRef.current = controlador;
    try {
      const datos = await fn(controlador.signal);
      if (!controlador.signal.aborted) setResultado({ clave: claveActual, datos, error: null });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const error = (e as Error).message;
      // Si ya había datos de este mismo grupo se conservan y solo se avisa del error
      setResultado((prev) => ({ clave: claveActual, datos: prev.clave === claveActual ? prev.datos : null, error }));
    }
  }, []);

  useEffect(() => {
    if (!cargar) return;
    recargar();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") recargar();
    }, intervaloMs);
    const alVolver = () => {
      if (document.visibilityState === "visible") recargar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
      controladorRef.current?.abort();
    };
    // `cargar` cambia en cada render; lo que importa son las dependencias declaradas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intervaloMs, cargar === null]);

  const vigente = resultado.clave === clave ? resultado : { datos: null, error: null };
  return {
    datos: vigente.datos,
    error: vigente.error,
    cargando: cargar !== null && vigente.datos === null && vigente.error === null,
    recargar,
  };
}
