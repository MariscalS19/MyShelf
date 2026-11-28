"use client";

// Piezas de UI reutilizables: estados de carga/vacío/error, modal y botones.

import { useEffect } from "react";

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-stone-500" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function Vacio({ emoji, titulo, texto, children }: { emoji: string; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-semibold text-stone-800">{titulo}</p>
      {texto && <p className="text-sm text-stone-500">{texto}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function ErrorMensaje({ mensaje, reintentar }: { mensaje: string; reintentar?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <span>⚠️</span>
      <div className="flex-1">
        <p>{mensaje}</p>
        {reintentar && (
          <button onClick={reintentar} className="mt-2 font-semibold underline underline-offset-2">
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "peligro" | "fantasma" }) {
  const estilos = {
    primario: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
    secundario: "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50",
    peligro: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
    fantasma: "text-stone-600 hover:bg-stone-100",
  }[variante];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${className}`}
    />
  );
}

export const inputClase =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-stone-500">{ayuda}</span>}
    </label>
  );
}

export function Modal({ abierto, titulo, onCerrar, children }: { abierto: boolean; titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{titulo}</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-2 text-stone-500 hover:bg-stone-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
