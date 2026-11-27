"""Cálculos estadísticos por grupo. Todo se calcula en SQL con Decimal (NUMERIC)."""

from datetime import date, datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import EstadoItem, Item
from app.schemas import CategoriaResumen, ItemAlerta, ProductoFrecuente, ResumenAnalisis
from app.services.grupos import obtener_grupo

CERO = Decimal("0.00")
COMPRADOS = (EstadoItem.comprado, EstadoItem.en_inventario)


def _d(valor) -> Decimal:
    return Decimal(valor or 0).quantize(Decimal("0.01"))


def resumen_grupo(db: Session, grupo_id: int, dias_alerta: int | None = None) -> ResumenAnalisis:
    obtener_grupo(db, grupo_id)
    dias_alerta = dias_alerta if dias_alerta is not None else get_settings().DIAS_ALERTA_CADUCIDAD
    del_grupo = Item.grupo_id == grupo_id
    activos = (del_grupo, Item.consumido_en.is_(None))

    total_gastado = _d(
        db.scalar(select(func.sum(Item.precio_pagado)).where(del_grupo, Item.estado.in_(COMPRADOS)))
    )
    total_pendiente = _d(
        db.scalar(select(func.sum(Item.precio_estimado)).where(*activos, Item.estado == EstadoItem.pendiente))
    )
    hace_30 = datetime.now(timezone.utc) - timedelta(days=30)
    gasto_30 = _d(
        db.scalar(
            select(func.sum(Item.precio_pagado)).where(
                del_grupo, Item.estado.in_(COMPRADOS), Item.comprado_en >= hace_30
            )
        )
    )

    conteo = {e: 0 for e in EstadoItem}
    for estado, n in db.execute(
        select(Item.estado, func.count()).where(*activos).group_by(Item.estado)
    ).all():
        conteo[estado] = n

    por_categoria: list[CategoriaResumen] = []
    filas = db.execute(
        select(Item.categoria, func.sum(Item.precio_pagado), func.count())
        .where(del_grupo, Item.estado.in_(COMPRADOS))
        .group_by(Item.categoria)
        .order_by(func.sum(Item.precio_pagado).desc().nulls_last())
    ).all()
    for categoria, total, n in filas:
        total = _d(total)
        pct = (total * 100 / total_gastado).quantize(Decimal("0.1"), ROUND_HALF_UP) if total_gastado else CERO
        por_categoria.append(CategoriaResumen(categoria=categoria, total_gastado=total, num_items=n, porcentaje=pct))

    mas_comprados = [
        ProductoFrecuente(nombre=nombre, veces_comprado=n, total_gastado=_d(total))
        for nombre, n, total in db.execute(
            # Agrupa sin importar mayúsculas ("leche" y "Leche" cuentan juntas)
            select(func.min(Item.nombre), func.count(), func.sum(Item.precio_pagado))
            .where(del_grupo, Item.estado.in_(COMPRADOS))
            .group_by(func.lower(func.trim(Item.nombre)))
            .order_by(func.count().desc(), func.sum(Item.precio_pagado).desc().nulls_last())
            .limit(5)
        ).all()
    ]

    hoy = date.today()
    por_caducar: list[ItemAlerta] = []
    caducados: list[ItemAlerta] = []
    for item in db.scalars(
        select(Item)
        .where(
            *activos,
            Item.estado == EstadoItem.en_inventario,
            Item.fecha_caducidad.is_not(None),
            Item.fecha_caducidad <= hoy + timedelta(days=dias_alerta),
        )
        .order_by(Item.fecha_caducidad)
    ).all():
        alerta = ItemAlerta(
            id=item.id,
            nombre=item.nombre,
            categoria=item.categoria,
            fecha_caducidad=item.fecha_caducidad,
            dias_restantes=(item.fecha_caducidad - hoy).days,
        )
        (caducados if alerta.dias_restantes < 0 else por_caducar).append(alerta)

    return ResumenAnalisis(
        grupo_id=grupo_id,
        total_gastado=total_gastado,
        total_estimado_pendiente=total_pendiente,
        gasto_ultimos_30_dias=gasto_30,
        conteo_por_estado=conteo,
        por_categoria=por_categoria,
        mas_comprados=mas_comprados,
        por_caducar=por_caducar,
        caducados=caducados,
    )
