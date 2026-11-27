"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/src/components/AppProvider";
import { Boton, Campo, Cargando, ErrorMensaje, inputClase } from "@/src/components/ui";
import { tipoGrupo } from "@/src/lib/formato";
import { usuariosService } from "@/src/services/usuarios";

const TABS = [
  { href: "/", etiqueta: "Grupos", icono: "👥" },
  { href: "/mandado", etiqueta: "Mandado", icono: "🛒" },
  { href: "/inventario", etiqueta: "Inventario", icono: "🧺" },
  { href: "/analisis", etiqueta: "Análisis", icono: "📊" },
];

function SelectorGrupo() {
  const { grupos, grupoActivo, seleccionarGrupo } = useApp();
  if (!grupos.length) return <span className="text-sm text-emerald-100">Sin grupo</span>;
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Grupo activo</span>
      <select
        value={grupoActivo?.id ?? ""}
        onChange={(e) => seleccionarGrupo(Number(e.target.value))}
        className="w-full appearance-none truncate rounded-xl bg-emerald-700/60 py-2 pr-8 pl-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/60"
      >
        {grupos.map((g) => (
          <option key={g.id} value={g.id} className="text-stone-900">
            {tipoGrupo(g.tipo).emoji} {g.nombre}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-white">▼</span>
    </label>
  );
}

function Bienvenida() {
  const { iniciarSesion } = useApp();
  const [nombre, setNombre] = useState("");
  const [idExistente, setIdExistente] = useState("");
  const [modoEntrar, setModoEntrar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const u = modoEntrar
        ? await usuariosService.obtener(Number(idExistente))
        : await usuariosService.crear(nombre.trim());
      iniciarSesion(u);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl shadow-lg">🧺</div>
        <h1 className="text-3xl font-extrabold text-stone-900">MyShelf</h1>
        <p className="mt-2 text-stone-600">El mandado, la alacena y los gastos de tu grupo, en un solo lugar.</p>
      </div>
      <form onSubmit={enviar} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        {modoEntrar ? (
          <Campo etiqueta="Tu número de usuario" ayuda="Lo ves en la pantalla de Grupos de quien ya está registrado.">
            <input className={inputClase} inputMode="numeric" value={idExistente} onChange={(e) => setIdExistente(e.target.value.replace(/\D/g, ""))} placeholder="Ej. 1" required />
          </Campo>
        ) : (
          <Campo etiqueta="¿Cómo te llamas?">
            <input className={inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" maxLength={80} required autoFocus />
          </Campo>
        )}
        {error && <ErrorMensaje mensaje={error} />}
        <Boton type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Un momento…" : modoEntrar ? "Entrar" : "Empezar"}
        </Boton>
        <button type="button" onClick={() => { setModoEntrar(!modoEntrar); setError(null); }} className="w-full text-center text-sm font-medium text-emerald-700">
          {modoEntrar ? "Soy nuevo, quiero registrarme" : "Ya tengo usuario"}
        </button>
      </form>
    </main>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { listo, usuario } = useApp();
  const pathname = usePathname();

  if (!listo) return <Cargando />;
  if (!usuario) return <Bienvenida />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-stone-50 md:max-w-2xl md:border-x md:border-stone-200">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-emerald-600 px-4 py-3 shadow-sm">
        <Link href="/" className="shrink-0 text-lg font-extrabold text-white">🧺 MyShelf</Link>
        <SelectorGrupo />
        <span title={usuario.nombre} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-bold text-emerald-700">
          {usuario.nombre.charAt(0).toUpperCase()}
        </span>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:max-w-2xl">
        <ul className="grid grid-cols-4">
          {TABS.map((t) => {
            const activo = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={activo ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${activo ? "text-emerald-700" : "text-stone-500"}`}
                >
                  <span className={`text-xl transition ${activo ? "scale-110" : "opacity-70"}`}>{t.icono}</span>
                  {t.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Envuelve las vistas que necesitan un grupo activo. */
export function RequiereGrupo({ children }: { children: (grupoId: number) => React.ReactNode }) {
  const { grupoActivo, errorGrupos, recargarGrupos } = useApp();
  if (errorGrupos) return <ErrorMensaje mensaje={errorGrupos} reintentar={() => recargarGrupos()} />;
  if (!grupoActivo)
    return (
      <div className="py-10 text-center">
        <p className="text-4xl">👥</p>
        <p className="mt-2 font-semibold text-stone-800">Primero crea o únete a un grupo</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Ir a Grupos</Link>
      </div>
    );
  return <>{children(grupoActivo.id)}</>;
}
