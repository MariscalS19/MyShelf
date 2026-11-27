"use client";

import { useState } from "react";
import { useApp } from "@/src/components/AppProvider";
import { Boton, Campo, ErrorMensaje, inputClase } from "@/src/components/ui";
import { useDatos } from "@/src/hooks/useDatos";
import { TIPOS_GRUPO, tipoGrupo } from "@/src/lib/formato";
import { gruposService } from "@/src/services/grupos";
import type { TipoGrupo } from "@/src/types";

export default function GruposPage() {
  const { usuario, grupos, grupoActivo, seleccionarGrupo, recargarGrupos, cerrarSesion, errorGrupos } = useApp();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoGrupo>("familiar");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<"crear" | "unirse" | null>(null);
  const [copiado, setCopiado] = useState(false);

  const miembros = useDatos(
    grupoActivo ? (signal) => gruposService.miembros(grupoActivo.id, signal) : null,
    [grupoActivo?.id],
    10000,
  );

  if (!usuario) return null;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setEnviando("crear");
    setError(null);
    try {
      const g = await gruposService.crear({ nombre: nombre.trim(), tipo, usuario_id: usuario!.id });
      setNombre("");
      await recargarGrupos(g.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(null);
    }
  }

  async function unirse(e: React.FormEvent) {
    e.preventDefault();
    setEnviando("unirse");
    setError(null);
    try {
      const g = await gruposService.unirse(codigo, usuario!.id);
      setCodigo("");
      await recargarGrupos(g.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(null);
    }
  }

  async function copiarCodigo() {
    if (!grupoActivo) return;
    try {
      await navigator.clipboard.writeText(grupoActivo.codigo_invitacion);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* sin permiso de portapapeles */
    }
  }

  async function salir() {
    if (!grupoActivo || !confirm(`¿Salir del grupo "${grupoActivo.nombre}"?`)) return;
    try {
      await gruposService.salir(grupoActivo.id, usuario!.id);
      await recargarGrupos();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Hola, {usuario.nombre} 👋</h1>
        <p className="text-sm text-stone-500">Tu número de usuario es <strong>#{usuario.id}</strong> (úsalo para entrar en otro dispositivo).</p>
      </div>

      {errorGrupos && <ErrorMensaje mensaje={errorGrupos} reintentar={() => recargarGrupos()} />}
      {error && <ErrorMensaje mensaje={error} />}

      {grupos.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">Tus grupos</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {grupos.map((g) => {
              const activo = g.id === grupoActivo?.id;
              const t = tipoGrupo(g.tipo);
              return (
                <li key={g.id}>
                  <button
                    onClick={() => seleccionarGrupo(g.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition ${activo ? "bg-emerald-50 ring-2 ring-emerald-500" : "bg-white ring-1 ring-stone-200 hover:ring-stone-300"}`}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="flex-1">
                      <span className="block font-semibold text-stone-900">{g.nombre}</span>
                      <span className="block text-sm text-stone-500">{t.etiqueta} · {g.num_miembros} {g.num_miembros === 1 ? "miembro" : "miembros"}</span>
                    </span>
                    {activo && <span className="text-sm font-semibold text-emerald-700">Activo</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {grupoActivo && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">Código para invitar a {grupoActivo.nombre}</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-stone-900">{grupoActivo.codigo_invitacion}</p>
            </div>
            <Boton variante="secundario" onClick={copiarCodigo}>{copiado ? "¡Copiado!" : "Copiar"}</Boton>
          </div>
          {miembros.datos && (
            <ul className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {miembros.datos.map((m) => (
                <li key={m.usuario_id} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
                  {m.nombre}{m.rol === "admin" && " ⭐"}{m.usuario_id === usuario.id && " (tú)"}
                </li>
              ))}
            </ul>
          )}
          <button onClick={salir} className="mt-4 text-sm font-medium text-red-700">Salir de este grupo</button>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold text-stone-900">Crear un grupo</h2>
        <form onSubmit={crear} className="space-y-3">
          <Campo etiqueta="Nombre">
            <input className={inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Casa, Depa Chapalita, Dieta Gym" maxLength={80} required />
          </Campo>
          <div className="flex flex-wrap gap-2">
            {TIPOS_GRUPO.map((t) => (
              <button
                type="button"
                key={t.valor}
                onClick={() => setTipo(t.valor)}
                aria-pressed={tipo === t.valor}
                className={`rounded-full border px-3 py-1.5 text-sm ${tipo === t.valor ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-800" : "border-stone-300 bg-white text-stone-700"}`}
              >
                {t.emoji} {t.etiqueta}
              </button>
            ))}
          </div>
          <Boton type="submit" className="w-full" disabled={enviando !== null}>{enviando === "crear" ? "Creando…" : "Crear grupo"}</Boton>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold text-stone-900">Unirme con un código</h2>
        <form onSubmit={unirse} className="flex gap-2">
          <input
            className={`${inputClase} font-mono tracking-widest uppercase`}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="ABC123"
            maxLength={12}
            minLength={4}
            required
            aria-label="Código de invitación"
          />
          <Boton type="submit" disabled={enviando !== null}>{enviando === "unirse" ? "…" : "Unirme"}</Boton>
        </form>
      </section>

      <button onClick={cerrarSesion} className="w-full py-2 text-center text-sm text-stone-500">Cerrar sesión</button>
    </div>
  );
}
