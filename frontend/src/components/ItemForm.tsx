"use client";

import { useState } from "react";
import { Boton, Campo, ErrorMensaje, inputClase } from "@/src/components/ui";
import { CATEGORIAS } from "@/src/lib/formato";
import { limpiarDecimal } from "@/src/lib/numero";
import type { DetallesItem, EstadoItem, Item, ItemCrear } from "@/src/types";

const UNIDADES = ["pza", "kg", "g", "L", "ml", "paquete"];
const UNIDADES_FRACCIONABLES = ["kg", "L", "ml"];

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
  const [unidad, setUnidad] = useState(item ? String(detallesIniciales.unidad ?? "") : "");
  const [marca, setMarca] = useState(String(detallesIniciales.marca ?? ""));
  const [precioEstimado, setPrecioEstimado] = useState(item?.precio_estimado ?? "");
  const [precioPagado, setPrecioPagado] = useState(item?.precio_pagado ?? "");
  const [caducidad, setCaducidad] = useState(item?.fecha_caducidad ?? "");
  const [imagen, setImagen] = useState(item?.imagen_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const estado = item?.estado ?? estadoInicial;
  const yaComprado = estado !== "pendiente";
  const permiteFracciones = UNIDADES_FRACCIONABLES.includes(unidad);

  function cambiarUnidad(nuevaUnidad: string) {
    const cantidadActual = Number(cantidad);
    if (
      !UNIDADES_FRACCIONABLES.includes(nuevaUnidad) &&
      cantidad !== "" &&
      Number.isFinite(cantidadActual) &&
      !Number.isInteger(cantidadActual)
    ) {
      setError("La cantidad debe ser un número entero antes de cambiar a esa unidad.");
      return;
    }

    if (!UNIDADES_FRACCIONABLES.includes(nuevaUnidad) && cantidad !== "" && Number.isInteger(cantidadActual)) {
      setCantidad(String(cantidadActual));
    }
    setUnidad(nuevaUnidad);
    setError(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!unidad) return setError("Selecciona una unidad de medida.");
    if (!(Number(cantidad) > 0)) return setError("La cantidad debe ser mayor a 0");
    if (!permiteFracciones && !Number.isInteger(Number(cantidad))) {
      return setError("Para esta unidad, la cantidad debe ser un número entero.");
    }
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

      <Campo etiqueta="Unidad de medida">
        <select className={inputClase} value={unidad} onChange={(e) => cambiarUnidad(e.target.value)} required>
          <option value="" disabled>Selecciona una unidad</option>
          {[...new Set([...UNIDADES, unidad].filter(Boolean))].map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </Campo>

      {unidad && (
        <Campo etiqueta="Cantidad" ayuda={permiteFracciones ? "Hasta 2 decimales" : "Usa un número entero"}>
          <input
            className={inputClase}
            inputMode={permiteFracciones ? "decimal" : "numeric"}
            value={cantidad}
            onChange={(e) => {
              const nuevo = limpiarDecimal(e.target.value, 8, permiteFracciones ? 2 : 0);
              if (nuevo !== null) {
                setCantidad(nuevo);
                setError(null);
              }
            }}
            required
          />
        </Campo>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Precio estimado" ayuda="Total del renglón · Máximo 2 decimales">
          <input className={inputClase} inputMode="decimal" value={precioEstimado} onChange={(e) => {
            const nuevo = limpiarDecimal(e.target.value, 10);
            if (nuevo !== null) setPrecioEstimado(nuevo);
          }} placeholder="$0.00" />
        </Campo>
        {yaComprado ? (
          <Campo etiqueta="Precio pagado" ayuda="Máximo 2 decimales">
            <input className={inputClase} inputMode="decimal" value={precioPagado} onChange={(e) => {
              const nuevo = limpiarDecimal(e.target.value, 10);
              if (nuevo !== null) setPrecioPagado(nuevo);
            }} placeholder="$0.00" />
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
