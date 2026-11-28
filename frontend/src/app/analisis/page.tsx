"use client";

import { RequiereGrupo } from "@/src/components/AppShell";
import { Cargando, ErrorMensaje, Vacio } from "@/src/components/ui";
import { useDatos } from "@/src/hooks/useDatos";
import { categoria, dinero, fechaCorta, textoCaducidad } from "@/src/lib/formato";
import { analisisService } from "@/src/services/analisis";
import type { ItemAlerta } from "@/src/types";

export default function AnalisisPage() {
  return <RequiereGrupo>{(grupoId) => <Analisis grupoId={grupoId} />}</RequiereGrupo>;
}

function Tarjeta({ titulo, valor, nota, destacada }: { titulo: string; valor: string; nota?: string; destacada?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${destacada ? "bg-emerald-600 text-white" : "bg-white ring-1 ring-stone-200"}`}>
      <p className={`text-xs font-medium ${destacada ? "text-emerald-100" : "text-stone-500"}`}>{titulo}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>
      {nota && <p className={`mt-0.5 text-xs ${destacada ? "text-emerald-100" : "text-stone-400"}`}>{nota}</p>}
    </div>
  );
}

function ListaAlertas({ titulo, items, tono }: { titulo: string; items: ItemAlerta[]; tono: "rojo" | "ambar" }) {
  if (!items.length) return null;
  const estilo = tono === "rojo" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <section className={`rounded-2xl border p-4 ${estilo}`}>
      <h2 className="mb-2 font-semibold">{titulo}</h2>
      <ul className="space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2">
            <span>{categoria(i.categoria).emoji} {i.nombre}</span>
            <span className="shrink-0 opacity-80">{textoCaducidad(i.dias_restantes)} · {fechaCorta(i.fecha_caducidad)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Analisis({ grupoId }: { grupoId: number }) {
  // El análisis cambia menos seguido: se consulta cada 15 s
  const { datos, error, cargando, recargar } = useDatos((signal) => analisisService.resumen(grupoId, signal), [grupoId], 15000);

  if (cargando && !datos) return <Cargando texto="Haciendo cuentas…" />;
  if (error && !datos) return <ErrorMensaje mensaje={error} reintentar={recargar} />;
  if (!datos) return null;

  const c = datos.conteo_por_estado;
  const sinCompras = datos.por_categoria.length === 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-stone-900">Análisis</h1>

      <div className="grid grid-cols-2 gap-3">
        <Tarjeta destacada titulo="Gasto total" valor={dinero(datos.total_gastado)} nota={`${dinero(datos.gasto_ultimos_30_dias)} en 30 días`} />
        <Tarjeta titulo="Mandado pendiente" valor={dinero(datos.total_estimado_pendiente)} nota={`${c.pendiente} productos (estimado)`} />
        <Tarjeta titulo="En inventario" valor={String(c.en_inventario)} nota="productos" />
        <Tarjeta titulo="Por guardar" valor={String(c.comprado)} nota="comprados" />
      </div>

      <ListaAlertas titulo="⚠️ Ya caducaron" items={datos.caducados} tono="rojo" />
      <ListaAlertas titulo="⏰ Por caducar" items={datos.por_caducar} tono="ambar" />

      {sinCompras ? (
        <Vacio emoji="📊" titulo="Todavía no hay compras" texto="Cuando marquen productos como comprados verás aquí en qué se va el dinero." />
      ) : (
        <>
          <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="mb-3 font-semibold text-stone-900">Gasto por categoría</h2>
            <ul className="space-y-3">
              {datos.por_categoria.map((cat) => {
                const info = categoria(cat.categoria);
                return (
                  <li key={cat.categoria}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-stone-700">{info.emoji} {info.etiqueta}</span>
                      <span className="font-semibold text-stone-900 tabular-nums">
                        {dinero(cat.total_gastado)} <span className="font-normal text-stone-400">· {cat.porcentaje}%</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${cat.porcentaje}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="mb-3 font-semibold text-stone-900">Lo que más compran</h2>
            <ol className="divide-y divide-stone-100">
              {datos.mas_comprados.map((p, i) => (
                <li key={p.nombre} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 font-semibold text-stone-600">{i + 1}</span>
                  <span className="flex-1 text-stone-800">{p.nombre}</span>
                  <span className="text-stone-500">{p.veces_comprado}×</span>
                  <span className="w-20 text-right font-semibold tabular-nums text-stone-900">{dinero(p.total_gastado)}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
