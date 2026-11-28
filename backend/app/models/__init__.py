"""Modelos de tablas (SQLAlchemy). El contrato está documentado en docs/tasks/DB.md."""

import enum
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EstadoItem(str, enum.Enum):
    pendiente = "pendiente"
    comprado = "comprado"
    en_inventario = "en_inventario"


class TipoGrupo(str, enum.Enum):
    familiar = "familiar"
    personal = "personal"
    fitness = "fitness"
    compartido = "compartido"
    otro = "otro"


class RolMiembro(str, enum.Enum):
    admin = "admin"
    miembro = "miembro"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    membresias: Mapped[list["MiembroGrupo"]] = relationship(back_populates="usuario", cascade="all, delete-orphan")


class Grupo(Base):
    __tablename__ = "grupos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))
    tipo: Mapped[TipoGrupo] = mapped_column(Enum(TipoGrupo, name="tipo_grupo"), default=TipoGrupo.familiar)
    codigo_invitacion: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    miembros: Mapped[list["MiembroGrupo"]] = relationship(back_populates="grupo", cascade="all, delete-orphan")
    items: Mapped[list["Item"]] = relationship(back_populates="grupo", cascade="all, delete-orphan")


class MiembroGrupo(Base):
    """Relación N:M entre usuarios y grupos."""

    __tablename__ = "miembros_grupo"
    __table_args__ = (UniqueConstraint("usuario_id", "grupo_id", name="uq_miembro_usuario_grupo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    grupo_id: Mapped[int] = mapped_column(ForeignKey("grupos.id", ondelete="CASCADE"), index=True)
    rol: Mapped[RolMiembro] = mapped_column(Enum(RolMiembro, name="rol_miembro"), default=RolMiembro.miembro)

    usuario: Mapped[Usuario] = relationship(back_populates="membresias")
    grupo: Mapped[Grupo] = relationship(back_populates="miembros")


class Item(Base):
    """Un producto del mandado o del inventario de un grupo.

    Los precios son el total del renglón (no por unidad).
    """

    __tablename__ = "items_mandado_inventario"
    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_item_cantidad_positiva"),
        CheckConstraint("precio_estimado IS NULL OR precio_estimado >= 0", name="ck_item_precio_estimado"),
        CheckConstraint("precio_pagado IS NULL OR precio_pagado >= 0", name="ck_item_precio_pagado"),
        Index("ix_items_grupo_estado", "grupo_id", "estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    grupo_id: Mapped[int] = mapped_column(ForeignKey("grupos.id", ondelete="CASCADE"))
    agregado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    nombre: Mapped[str] = mapped_column(String(120))
    categoria: Mapped[str] = mapped_column(String(50), default="otros", index=True)
    estado: Mapped[EstadoItem] = mapped_column(Enum(EstadoItem, name="estado_item"), default=EstadoItem.pendiente)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1"))
    precio_estimado: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    precio_pagado: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    fecha_caducidad: Mapped[date | None] = mapped_column(Date)
    imagen_url: Mapped[str | None] = mapped_column(String(500))
    detalles: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # Extras para el análisis de hábitos (no rompen el contrato original):
    # cuándo se compró y cuándo se acabó (los consumidos ya no salen en las listas
    # pero su gasto sigue contando en el resumen).
    comprado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    consumido_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    grupo: Mapped[Grupo] = relationship(back_populates="items")
    agregado_por: Mapped[Usuario | None] = relationship()


class CatalogoBase(Base):
    """(Opcional) Sugerencias para capturar productos más rápido."""

    __tablename__ = "catalogo_base"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True)
    categoria_sugerida: Mapped[str] = mapped_column(String(50))
    unidad_sugerida: Mapped[str | None] = mapped_column(String(20))
    imagen_default_url: Mapped[str | None] = mapped_column(String(500))
