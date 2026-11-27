"use client";

import { categoria, cantidad, diasHasta, dinero, textoCaducidad } from "@/src/lib/formato";
import type { Item } from "@/src/types";

export function BadgeCaducidad({ fecha }: { fecha: string }) {
  const dias = diasHasta(fecha);
  const color = dias < 0 ? "bg-red-100 text-red-800" : dias <= 3 ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{textoCaducidad(dias)}</span>;
}

export function ItemCard({ item, acciones, onClick }: { item: Item; acciones?: React.ReactNode; onClick?: () => void }) {
  const cat = categoria(item.categoria);
  const unidad = item.detalles?.unidad ? ` ${item.detalles.unidad}` : "";
  const precio = item.precio_pagado ?? item.precio_estimado;

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Editar ${item.nombre}`}>
        {item.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imagen_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl">{cat.emoji}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-stone-900">{item.nombre}</span>
          <span className="block truncate text-sm text-stone-500">
            {cantidad(item.cantidad)}
            {unidad}
            {item.detalles?.marca ? ` · ${item.detalles.marca}` : ""}
            {precio ? ` · ${dinero(precio)}` : ""}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.fecha_caducidad && <BadgeCaducidad fecha={item.fecha_caducidad} />}
            {item.estado === "comprado" && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">Comprado</span>}
            {item.agregado_por_nombre && <span className="text-xs text-stone-400">por {item.agregado_por_nombre}</span>}
          </span>
        </span>
      </button>
      {acciones && <div className="flex shrink-0 items-center gap-1">{acciones}</div>}
    </li>
  );
}
