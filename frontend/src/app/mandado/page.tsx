"use client";

import { useState } from "react";
import { RequiereGrupo } from "@/src/components/AppShell";
import { useApp } from "@/src/components/AppProvider";
import { ItemCard } from "@/src/components/ItemCard";
import { ItemForm } from "@/src/components/ItemForm";
import { Boton, Campo, Cargando, ErrorMensaje, Modal, Vacio, inputClase } from "@/src/components/ui";
import { useDatos } from "@/src/hooks/useDatos";
import { dinero } from "@/src/lib/formato";
import { limpiarDecimal } from "@/src/lib/numero";
import { analisisService } from "@/src/services/analisis";
import { itemsService } from "@/src/services/items";
import type { Item } from "@/src/types";

export default function MandadoPage() {
  return <RequiereGrupo>{(grupoId) => <Mandado grupoId={grupoId} />}</RequiereGrupo>;
}

function Mandado({ grupoId }: { grupoId: number }) {
  const { usuario } = useApp();
  const { datos, error, cargando, recargar } = useDatos(
    async (signal) => {
      const [pendientes, comprados, resumen] = await Promise.all([
        itemsService.listar(grupoId, { estado: "pendiente" }, signal),
        itemsService.listar(grupoId, { estado: "comprado" }, signal),
        analisisService.resumen(grupoId, signal),
      ]);
      return { pendientes, comprados, estimado: resumen.total_estimado_pendiente };
    },
    [grupoId],
  );
  const [agregando, setAgregando] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [comprando, setComprando] = useState<Item | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  async function accion(fn: () => Promise<unknown>) {
    setErrorAccion(null);
    try {
      await fn();
      await recargar(); // refresco inmediato después de cada cambio
    } catch (e) {
      setErrorAccion((e as Error).message);
    }
  }

  if (cargando && !datos) return <Cargando texto="Cargando la lista…" />;
  if (error && !datos) return <ErrorMensaje mensaje={error} reintentar={recargar} />;
  if (!datos) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Lista de mandado</h1>
          <p className="text-sm text-stone-500">
            {datos.pendientes.length} por comprar · aprox. {dinero(datos.estimado)}
          </p>
        </div>
        <Boton onClick={() => setAgregando(true)}>＋ Agregar</Boton>
      </div>

      {error && <ErrorMensaje mensaje={`Sin conexión: ${error}`} />}
      {errorAccion && <ErrorMensaje mensaje={errorAccion} />}

      {datos.pendientes.length === 0 ? (
        <Vacio emoji="🛒" titulo="No hay nada pendiente" texto="Agrega lo que haga falta y tu grupo lo verá al momento.">
          <Boton onClick={() => setAgregando(true)}>Agregar producto</Boton>
        </Vacio>
      ) : (
        <ul className="space-y-2">
          {datos.pendientes.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => setEditando(item)}
              acciones={
                <button
                  onClick={() => setComprando(item)}
                  aria-label={`Marcar ${item.nombre} como comprado`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500 text-lg text-emerald-600 hover:bg-emerald-50"
                >
                  ✓
                </button>
              }
            />
          ))}
        </ul>
      )}

      {datos.comprados.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">Ya comprado · falta guardar</h2>
          <ul className="space-y-2">
            {datos.comprados.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => setEditando(item)}
                acciones={
                  <>
                    <Boton variante="fantasma" className="px-2" aria-label="Deshacer compra" onClick={() => accion(() => itemsService.cambiarEstado(grupoId, item.id, "pendiente"))}>↩</Boton>
                    <Boton className="px-3" onClick={() => accion(() => itemsService.cambiarEstado(grupoId, item.id, "en_inventario"))}>Guardar</Boton>
                  </>
                }
              />
            ))}
          </ul>
          <Boton
            variante="secundario"
            className="mt-3 w-full"
            onClick={() => accion(() => Promise.all(datos.comprados.map((i) => itemsService.cambiarEstado(grupoId, i.id, "en_inventario"))))}
          >
            Guardar todo en inventario
          </Boton>
        </section>
      )}

      <Modal abierto={agregando} titulo="Agregar al mandado" onCerrar={() => setAgregando(false)}>
        <ItemForm
          estadoInicial="pendiente"
          onCancelar={() => setAgregando(false)}
          onGuardar={async (d) => {
           let test = await itemsService.crear(grupoId, { ...d, agregado_por_id: usuario?.id });
           console.log(test)
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
              Eliminar de la lista
            </Boton>
          </>
        )}
      </Modal>

      <Modal abierto={!!comprando} titulo="¿Cuánto costó?" onCerrar={() => setComprando(null)}>
        {comprando && (
          <ModalCompra
            key={comprando.id}
            item={comprando}
            onCerrar={() => setComprando(null)}
            onConfirmar={async (precio, guardar) => {
              await itemsService.cambiarEstado(grupoId, comprando.id, guardar ? "en_inventario" : "comprado", precio);
              setComprando(null);
              await recargar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function ModalCompra({ item, onConfirmar, onCerrar }: { item: Item; onConfirmar: (precio: string | undefined, guardar: boolean) => Promise<void>; onCerrar: () => void }) {
  const [precio, setPrecio] = useState(item.precio_estimado ?? "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function confirmar(guardar: boolean) {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar(precio || undefined, guardar);
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-stone-600">
        Marcando <strong className="text-stone-900">{item.nombre}</strong> como comprado.
      </p>
      <Campo etiqueta="Precio pagado (total)" ayuda={`${item.precio_estimado ? `Estimado: ${dinero(item.precio_estimado)} · ` : "Déjalo vacío si no lo sabes · "}Máximo 2 decimales`}>
        <input className={inputClase} inputMode="decimal" autoFocus value={precio} onChange={(e) => {
          const nuevo = limpiarDecimal(e.target.value, 10);
          if (nuevo !== null) setPrecio(nuevo);
        }} placeholder="$0.00" />
      </Campo>
      {error && <ErrorMensaje mensaje={error} />}
      <div className="grid gap-2">
        <Boton disabled={enviando} onClick={() => confirmar(true)}>Comprado y guardado en inventario</Boton>
        <Boton variante="secundario" disabled={enviando} onClick={() => confirmar(false)}>Solo comprado (guardo después)</Boton>
        <Boton variante="fantasma" onClick={onCerrar}>Cancelar</Boton>
      </div>
    </div>
  );
}
