"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usuariosService } from "@/src/services/usuarios";
import type { Grupo, Usuario } from "@/src/types";

interface Contexto {
  listo: boolean; // ya se leyó localStorage
  usuario: Usuario | null;
  grupos: Grupo[];
  grupoActivo: Grupo | null;
  errorGrupos: string | null;
  iniciarSesion: (u: Usuario) => void;
  cerrarSesion: () => void;
  seleccionarGrupo: (id: number) => void;
  recargarGrupos: (seleccionar?: number) => Promise<void>;
}

const AppContext = createContext<Contexto | null>(null);

const K_USUARIO = "myshelf:usuario";
const K_GRUPO = "myshelf:grupo";

function leer<T>(clave: string): T | null {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* modo privado: se ignora */
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [errorGrupos, setErrorGrupos] = useState<string | null>(null);

  useEffect(() => {
    // Leer la sesión guardada solo existe en el navegador
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(leer<Usuario>(K_USUARIO));
    setGrupoId(leer<number>(K_GRUPO));
    setListo(true);
  }, []);

  const aplicarLista = useCallback((lista: Grupo[], seleccionar?: number) => {
    setGrupos(lista);
    setErrorGrupos(null);
    setGrupoId((actual) => {
      const deseado = seleccionar ?? actual;
      const valido = lista.some((g) => g.id === deseado) ? deseado : (lista[0]?.id ?? null);
      guardar(K_GRUPO, valido);
      return valido;
    });
  }, []);

  const recargarGrupos = useCallback(
    async (seleccionar?: number) => {
      if (!usuario) return;
      try {
        aplicarLista(await usuariosService.grupos(usuario.id), seleccionar);
      } catch (e) {
        setErrorGrupos((e as Error).message);
      }
    },
    [usuario, aplicarLista],
  );

  useEffect(() => {
    if (!usuario) return;
    const controlador = new AbortController();
    usuariosService
      .grupos(usuario.id, controlador.signal)
      .then((lista) => aplicarLista(lista))
      .catch((e: Error) => e.name !== "AbortError" && setErrorGrupos(e.message));
    return () => controlador.abort();
  }, [usuario, aplicarLista]);

  const valor = useMemo<Contexto>(
    () => ({
      listo,
      usuario,
      grupos: usuario ? grupos : [],
      grupoActivo: !usuario ? null : grupos.find((g) => g.id === grupoId) ?? null,
      errorGrupos,
      iniciarSesion: (u) => {
        guardar(K_USUARIO, u);
        setUsuario(u);
      },
      cerrarSesion: () => {
        guardar(K_USUARIO, null);
        guardar(K_GRUPO, null);
        setUsuario(null);
        setGrupoId(null);
      },
      seleccionarGrupo: (id) => {
        guardar(K_GRUPO, id);
        setGrupoId(id);
      },
      recargarGrupos,
    }),
    [listo, usuario, grupos, grupoId, errorGrupos, recargarGrupos],
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
