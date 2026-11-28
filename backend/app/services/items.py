"""Reglas de negocio de los ítems de mandado e inventario.

Flujo de estados permitido:

    pendiente ──► comprado ──► en_inventario
        │                          ▲
        └──────────────────────────┘
    comprado ──► pendiente   (deshacer: borra precio_pagado)

Un ítem en inventario no regresa a pendiente: cuando se acaba se "consume"
(sale del inventario pero su gasto sigue contando en el análisis) y, si se
pide, se crea un ítem pendiente nuevo para volver a comprarlo.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import EstadoItem, Item, MiembroGrupo
from app.schemas import ItemCreate, ItemOut, ItemUpdate
from app.services.grupos import obtener_grupo

E = EstadoItem

TRANSICIONES: dict[EstadoItem, set[EstadoItem]] = {
    E.pendiente: {E.comprado, E.en_inventario},
    E.comprado: {E.en_inventario, E.pendiente},
    E.en_inventario: set(),
}


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def a_out(item: Item) -> ItemOut:
    out = ItemOut.model_validate(item)
    out.agregado_por_nombre = item.agregado_por.nombre if item.agregado_por else None
    return out


def obtener_item(db: Session, grupo_id: int, item_id: int) -> Item:
    """Busca el ítem SIEMPRE dentro del grupo (aislamiento por grupo_id)."""
    item = db.scalar(
        select(Item)
        .options(joinedload(Item.agregado_por))
        .where(Item.id == item_id, Item.grupo_id == grupo_id, Item.consumido_en.is_(None))
    )
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No existe el ítem {item_id} en el grupo {grupo_id}")
    return item


def _validar_coherencia(estado: EstadoItem, precio_pagado) -> None:
    if estado == E.pendiente and precio_pagado is not None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Un ítem pendiente todavía no tiene precio pagado; márcalo como comprado primero",
        )


def listar_items(
    db: Session,
    grupo_id: int,
    estado: EstadoItem | None = None,
    categoria: str | None = None,
    buscar: str | None = None,
) -> list[ItemOut]:
    obtener_grupo(db, grupo_id)
    stmt = (
        select(Item)
        .options(joinedload(Item.agregado_por))
        .where(Item.grupo_id == grupo_id, Item.consumido_en.is_(None))
    )
    if estado:
        stmt = stmt.where(Item.estado == estado)
    if categoria:
        stmt = stmt.where(Item.categoria == categoria)
    if buscar:
        stmt = stmt.where(Item.nombre.ilike(f"%{buscar}%"))
    # Lo que caduca primero arriba; luego lo más reciente
    stmt = stmt.order_by(Item.fecha_caducidad.asc().nulls_last(), Item.creado_en.desc())
    return [a_out(i) for i in db.scalars(stmt).all()]


def crear_item(db: Session, grupo_id: int, datos: ItemCreate) -> ItemOut:
    obtener_grupo(db, grupo_id)
    if datos.agregado_por_id is not None:
        es_miembro = db.scalar(
            select(MiembroGrupo.id).where(
                MiembroGrupo.grupo_id == grupo_id, MiembroGrupo.usuario_id == datos.agregado_por_id
            )
        )
        if not es_miembro:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quien agrega el ítem debe ser miembro del grupo")
    _validar_coherencia(datos.estado, datos.precio_pagado)

    item = Item(grupo_id=grupo_id, **datos.model_dump())
    item.categoria = item.categoria.lower()
    if item.estado != E.pendiente:
        item.comprado_en = _ahora()
    db.add(item)
    db.commit()
    return a_out(obtener_item(db, grupo_id, item.id))


def actualizar_item(db: Session, grupo_id: int, item_id: int, datos: ItemUpdate) -> ItemOut:
    item = obtener_item(db, grupo_id, item_id)
    cambios = datos.model_dump(exclude_unset=True)

    for campo in ("nombre", "categoria", "estado", "cantidad"):
        if campo in cambios and cambios[campo] is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"'{campo}' no puede ser nulo")

    nuevo_estado = cambios.pop("estado", item.estado)
    if nuevo_estado != item.estado:
        if nuevo_estado not in TRANSICIONES[item.estado]:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"No se puede pasar de '{item.estado.value}' a '{nuevo_estado.value}'",
            )
        if item.estado == E.pendiente:
            item.comprado_en = _ahora()
        if nuevo_estado == E.pendiente:  # deshacer compra
            item.comprado_en = None
            item.precio_pagado = None
            cambios.pop("precio_pagado", None)
        # Si se compró sin capturar precio, se toma el estimado como pagado
        if item.estado == E.pendiente and "precio_pagado" not in cambios and item.precio_pagado is None:
            item.precio_pagado = item.precio_estimado
        item.estado = nuevo_estado

    for campo, valor in cambios.items():
        setattr(item, campo, valor)
    if "categoria" in cambios:
        item.categoria = item.categoria.lower()

    _validar_coherencia(item.estado, item.precio_pagado)
    db.commit()
    return a_out(obtener_item(db, grupo_id, item_id))


def consumir_item(db: Session, grupo_id: int, item_id: int, reponer: bool) -> ItemOut | None:
    """El ítem se acabó: sale del inventario y opcionalmente se agrega otra vez al mandado."""
    item = obtener_item(db, grupo_id, item_id)
    if item.estado != E.en_inventario:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Solo se pueden consumir ítems que están en inventario")
    item.consumido_en = _ahora()
    nuevo = None
    if reponer:
        nuevo = Item(
            grupo_id=grupo_id,
            agregado_por_id=item.agregado_por_id,
            nombre=item.nombre,
            categoria=item.categoria,
            estado=E.pendiente,
            cantidad=item.cantidad,
            precio_estimado=item.precio_pagado or item.precio_estimado,
            imagen_url=item.imagen_url,
            detalles=item.detalles,
        )
        db.add(nuevo)
    db.commit()
    return a_out(obtener_item(db, grupo_id, nuevo.id)) if nuevo else None


def eliminar_item(db: Session, grupo_id: int, item_id: int) -> None:
    item = obtener_item(db, grupo_id, item_id)
    db.delete(item)
    db.commit()
