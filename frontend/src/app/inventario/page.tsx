"use client";

import { useState } from "react";
import { RequiereGrupo } from "@/src/components/AppShell";
import { useApp } from "@/src/components/AppProvider";
import { ItemCard } from "@/src/components/ItemCard";
import { ItemForm } from "@/src/components/ItemForm";
import { Boton, Cargando, ErrorMensaje, Modal, Vacio, inputClase } from "@/src/components/ui";
import { useDatos } from "@/src/hooks/useDatos";
import { categoria as infoCategoria, diasHasta } from "@/src/lib/formato";
import { itemsService } from "@/src/services/items";
import type { Item } from "@/src/types";

export default function InventarioPage() {
  return <RequiereGrupo>{(grupoId) => <Inventario grupoId={grupoId} />}</RequiereGrupo>;
}

function Inventario({ grupoId }: { grupoId: number }) {
  const { usuario } = useApp();
  const { datos: items, error, cargando, recargar } = useDatos(
    (signal) => itemsService.listar(grupoId, { estado: "en_inventario" }, signal),
    [grupoId],
  );
  const [filtro, setFiltro] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [acabado, setAcabado] = useState<Item | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  async function accion(fn: () => Promise<unknown>) {
    setErrorAccion(null);
    try {
      await fn();
      await recargar();
    } catch (e) {
      setErrorAccion((e as Error).message);
    }
  }

  if (cargando && !items) return <Cargando texto="Revisando la alacena…" />;
  if (error && !items) return <ErrorMensaje mensaje={error} reintentar={recargar} />;
  if (!items) return null;

  const categorias = [...new Set(items.map((i) => i.categoria))];
  const texto = busqueda.trim().toLowerCase();
  const visibles = items.filter((i) => (!filtro || i.categoria === filtro) && (!texto || i.nombre.toLowerCase().includes(texto)));
  const porVencer = items.filter((i) => i.fecha_caducidad && diasHasta(i.fecha_caducidad) <= 3).length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Inventario</h1>
          <p className="text-sm text-stone-500">
            {items.length} productos{porVencer > 0 && <span className="font-medium text-amber-700"> · {porVencer} por caducar</span>}
          </p>
        </div>
        <Boton onClick={() => setAgregando(true)}>＋ Agregar</Boton>
      </div>

      {error && <ErrorMensaje mensaje={`Sin conexión: ${error}`} />}
      {errorAccion && <ErrorMensaje mensaje={errorAccion} />}

      {items.length > 0 && (
        <>
          <input className={inputClase} type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en el inventario…" aria-label="Buscar" />
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip activo={!filtro} onClick={() => setFiltro(null)}>Todo</Chip>
            {categorias.map((c) => {
              const info = infoCategoria(c);
              return (
                <Chip key={c} activo={filtro === c} onClick={() => setFiltro(c)}>
                  {info.emoji} {info.etiqueta}
                </Chip>
              );
            })}
          </div>
        </>
      )}

      {items.length === 0 ? (
        <Vacio emoji="🧺" titulo="El inventario está vacío" texto="Lo que marques como comprado en el mandado aparecerá aquí." />
      ) : visibles.length === 0 ? (
        <Vacio emoji="🔍" titulo="Nada coincide con el filtro" />
      ) : (
        <ul className="space-y-2">
          {visibles.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => setEditando(item)}
              acciones={<Boton variante="secundario" className="px-3" onClick={() => setAcabado(item)}>Se acabó</Boton>}
            />
          ))}
        </ul>
      )}

      <Modal abierto={agregando} titulo="Agregar al inventario" onCerrar={() => setAgregando(false)}>
        <ItemForm
          estadoInicial="en_inventario"
          onCancelar={() => setAgregando(false)}
          onGuardar={async (d) => {
            await itemsService.crear(grupoId, { ...d, agregado_por_id: usuario?.id });
            setAgregando(false);
            await recargar();
          }}
        />
      </Modal>

      <Modal abierto={!!editando} titulo="Editar producto" onCerrar={() => setEditando(null)}>
        {editando && (
          <>
            <ItemForm
              key={editando.id}
              item={editando}
              estadoInicial={editando.estado}
              onCancelar={() => setEditando(null)}
              onGuardar={async (d) => {
                await itemsService.actualizar(grupoId, editando.id, { ...d, estado: undefined });
                setEditando(null);
                await recargar();
              }}
            />
            <Boton variante="peligro" className="mt-3 w-full" onClick={() => { const id = editando.id; setEditando(null); accion(() => itemsService.eliminar(grupoId, id)); }}>
              Eliminar (fue un error)
            </Boton>
          </>
        )}
      </Modal>

      <Modal abierto={!!acabado} titulo="¿Se acabó?" onCerrar={() => setAcabado(null)}>
        {acabado && (
          <div className="space-y-4">
            <p className="text-stone-600">
              <strong className="text-stone-900">{acabado.nombre}</strong> saldrá del inventario. Su gasto se sigue contando en el análisis.
            </p>
            <div className="grid gap-2">
              <Boton onClick={() => { const id = acabado.id; setAcabado(null); accion(() => itemsService.consumir(grupoId, id, true)); }}>Sí, y agregarlo al mandado</Boton>
              <Boton variante="secundario" onClick={() => { const id = acabado.id; setAcabado(null); accion(() => itemsService.consumir(grupoId, id, false)); }}>Sí, no volver a comprar</Boton>
              <Boton variante="fantasma" onClick={() => setAcabado(null)}>Cancelar</Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${activo ? "border-emerald-600 bg-emerald-600 font-semibold text-white" : "border-stone-300 bg-white text-stone-700"}`}
    >
      {children}
    </button>
  );
}
