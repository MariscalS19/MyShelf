"""Esquemas Pydantic de entrada (Create/Update) y salida (Out).

El dinero se maneja como Decimal y viaja en JSON como string ("45.50")
para no perder precisión en el frontend.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import EstadoItem, RolMiembro, TipoGrupo

Nombre = Annotated[str, Field(min_length=1, max_length=120)]
Dinero = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=2)]
Cantidad = Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)]


class _Base(BaseModel):
    @field_validator("nombre", "categoria", mode="before", check_fields=False)
    @classmethod
    def _limpiar_texto(cls, v: Any) -> Any:
        return v.strip() if isinstance(v, str) else v


# ---------- Usuarios ----------
class UsuarioCreate(_Base):
    nombre: Annotated[str, Field(min_length=1, max_length=80)]


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str


# ---------- Grupos ----------
class GrupoCreate(_Base):
    nombre: Annotated[str, Field(min_length=1, max_length=80)]
    tipo: TipoGrupo = TipoGrupo.familiar
    usuario_id: int = Field(description="Usuario que crea el grupo; queda como admin")


class GrupoUpdate(_Base):
    nombre: Annotated[str, Field(min_length=1, max_length=80)] | None = None
    tipo: TipoGrupo | None = None


class UnirseGrupo(BaseModel):
    codigo_invitacion: Annotated[str, Field(min_length=4, max_length=12)]
    usuario_id: int

    @field_validator("codigo_invitacion")
    @classmethod
    def _normalizar(cls, v: str) -> str:
        return v.strip().upper()


class GrupoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    tipo: TipoGrupo
    codigo_invitacion: str
    num_miembros: int = 0


class MiembroOut(BaseModel):
    usuario_id: int
    nombre: str
    rol: RolMiembro


# ---------- Ítems ----------
class ItemCreate(_Base):
    nombre: Nombre
    categoria: Annotated[str, Field(min_length=1, max_length=50)] = "otros"
    estado: EstadoItem = EstadoItem.pendiente
    cantidad: Cantidad = Decimal("1")
    precio_estimado: Dinero | None = None
    precio_pagado: Dinero | None = None
    fecha_caducidad: date | None = None
    imagen_url: Annotated[str, Field(max_length=500)] | None = None
    detalles: dict[str, Any] | None = None
    agregado_por_id: int | None = None


class ItemUpdate(_Base):
    """Actualización parcial: solo se cambian los campos enviados."""

    nombre: Nombre | None = None
    categoria: Annotated[str, Field(min_length=1, max_length=50)] | None = None
    estado: EstadoItem | None = None
    cantidad: Cantidad | None = None
    precio_estimado: Dinero | None = None
    precio_pagado: Dinero | None = None
    fecha_caducidad: date | None = None
    imagen_url: Annotated[str, Field(max_length=500)] | None = None
    detalles: dict[str, Any] | None = None


class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    grupo_id: int
    agregado_por_id: int | None
    agregado_por_nombre: str | None = None
    nombre: str
    categoria: str
    estado: EstadoItem
    cantidad: Decimal
    precio_estimado: Decimal | None
    precio_pagado: Decimal | None
    fecha_caducidad: date | None
    imagen_url: str | None
    detalles: dict[str, Any] | None
    creado_en: datetime
    comprado_en: datetime | None


# ---------- Análisis ----------
class CategoriaResumen(BaseModel):
    categoria: str
    total_gastado: Decimal
    num_items: int
    porcentaje: Decimal


class ProductoFrecuente(BaseModel):
    nombre: str
    veces_comprado: int
    total_gastado: Decimal


class ItemAlerta(BaseModel):
    id: int
    nombre: str
    categoria: str
    fecha_caducidad: date
    dias_restantes: int


class ResumenAnalisis(BaseModel):
    grupo_id: int
    total_gastado: Decimal
    total_estimado_pendiente: Decimal
    gasto_ultimos_30_dias: Decimal
    conteo_por_estado: dict[EstadoItem, int]
    por_categoria: list[CategoriaResumen]
    mas_comprados: list[ProductoFrecuente]
    por_caducar: list[ItemAlerta]
    caducados: list[ItemAlerta]
