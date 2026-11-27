"use client";

import { useState } from "react";
import { Boton, Campo, ErrorMensaje, inputClase } from "@/src/components/ui";
import { CATEGORIAS } from "@/src/lib/formato";
import type { DetallesItem, EstadoItem, Item, ItemCrear } from "@/src/types";

const UNIDADES = ["pza", "kg", "g", "L", "ml", "paquete"];

/** Acepta "45", "45.5" o "45.50" y lo deja como string con 2 decimales máximo. */
function limpiarNumero(v: string) {
  const s = v.replace(",", ".").replace(/[^\d.]/g, "");
  const [ent, ...dec] = s.split(".");
  return dec.length ? `${ent}.${dec.join("").slice(0, 2)}` : ent;
}

interface Props {
  estadoInicial: EstadoItem;
  item?: Item; // si viene, es edición
  onGuardar: (datos: ItemCrear) => Promise<void>;
  onCancelar: () => void;
}

export function ItemForm({ estadoInicial, item, onGuardar, onCancelar }: Props) {
  const detallesIniciales = item?.detalles ?? {};
  const [nombre, setNombre] = useState(item?.nombre ?? "");
  const [categoria, setCategoria] = useState(item?.categoria ?? "otros");
  const [cantidad, setCantidad] = useState(item ? item.cantidad.replace(/\.00$/, "") : "1");
  const [unidad, setUnidad] = useState(String(detallesIniciales.unidad ?? "pza"));
  const [marca, setMarca] = useState(String(detallesIniciales.marca ?? ""));
  const [precioEstimado, setPrecioEstimado] = useState(item?.precio_estimado ?? "");
  const [precioPagado, setPrecioPagado] = useState(item?.precio_pagado ?? "");
  const [caducidad, setCaducidad] = useState(item?.fecha_caducidad ?? "");
  const [imagen, setImagen] = useState(item?.imagen_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const estado = item?.estado ?? estadoInicial;
  const yaComprado = estado !== "pendiente";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!(Number(cantidad) > 0)) return setError("La cantidad debe ser mayor a 0");
    setGuardando(true);
    setError(null);
    // Se conservan otros detalles que ya existieran en el JSONB
    const detalles: DetallesItem = { ...detallesIniciales, unidad };
    if (marca.trim()) detalles.marca = marca.trim();
    else delete detalles.marca;

    try {
      await onGuardar({
        nombre: nombre.trim(),
        categoria,
        estado,
        cantidad,
        precio_estimado: precioEstimado || null,
        precio_pagado: yaComprado ? precioPagado || null : null,
        fecha_caducidad: caducidad || null,
        imagen_url: imagen.trim() || null,
        detalles,
      });
    } catch (err) {
      setError((err as Error).message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo etiqueta="Producto">
        <input className={inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Leche" required maxLength={120} autoFocus={!item} />
      </Campo>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-stone-700">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              type="button"
              key={c.valor}
              onClick={() => setCategoria(c.valor)}
              aria-pressed={categoria === c.valor}
              className={`rounded-full border px-3 py-1.5 text-sm ${categoria === c.valor ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-800" : "border-stone-300 bg-white text-stone-700"}`}
            >
              {c.emoji} {c.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Cantidad">
          <input className={inputClase} inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(limpiarNumero(e.target.value))} required />
        </Campo>
        <Campo etiqueta="Unidad">
          <select className={inputClase} value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            {[...new Set([...UNIDADES, unidad])].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Precio estimado" ayuda="Total del renglón">
          <input className={inputClase} inputMode="decimal" value={precioEstimado} onChange={(e) => setPrecioEstimado(limpiarNumero(e.target.value))} placeholder="$0.00" />
        </Campo>
        {yaComprado ? (
          <Campo etiqueta="Precio pagado">
            <input className={inputClase} inputMode="decimal" value={precioPagado} onChange={(e) => setPrecioPagado(limpiarNumero(e.target.value))} placeholder="$0.00" />
          </Campo>
        ) : (
          <Campo etiqueta="Marca (opcional)">
            <input className={inputClase} value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej. Lala" />
          </Campo>
        )}
      </div>

      {yaComprado && (
        <Campo etiqueta="Marca (opcional)">
          <input className={inputClase} value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej. Lala" />
        </Campo>
      )}

      <Campo etiqueta="Fecha de caducidad (opcional)">
        <input type="date" className={inputClase} value={caducidad} onChange={(e) => setCaducidad(e.target.value)} />
      </Campo>

      <Campo etiqueta="URL de imagen (opcional)" ayuda="Pega el link de una foto alojada en internet">
        <input type="url" className={inputClase} value={imagen} onChange={(e) => setImagen(e.target.value)} placeholder="https://…" />
      </Campo>

      {error && <ErrorMensaje mensaje={error} />}

      <div className="flex gap-3 pt-2">
        <Boton type="button" variante="secundario" className="flex-1" onClick={onCancelar}>Cancelar</Boton>
        <Boton type="submit" className="flex-1" disabled={guardando}>{guardando ? "Guardando…" : item ? "Guardar cambios" : "Agregar"}</Boton>
      </div>
    </form>
  );
}
