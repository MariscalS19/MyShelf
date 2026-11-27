"""Reglas de negocio de usuarios, grupos y membresías."""

import secrets

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Grupo, MiembroGrupo, RolMiembro, Usuario
from app.schemas import GrupoCreate, GrupoOut, GrupoUpdate, MiembroOut

# Sin 0/O ni 1/I para que el código sea fácil de dictar
_ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _nuevo_codigo(db: Session) -> str:
    while True:
        codigo = "".join(secrets.choice(_ALFABETO) for _ in range(6))
        if not db.scalar(select(Grupo.id).where(Grupo.codigo_invitacion == codigo)):
            return codigo


def obtener_usuario(db: Session, usuario_id: int) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No existe el usuario {usuario_id}")
    return usuario


def obtener_grupo(db: Session, grupo_id: int) -> Grupo:
    grupo = db.get(Grupo, grupo_id)
    if not grupo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No existe el grupo {grupo_id}")
    return grupo


def _a_out(db: Session, grupo: Grupo) -> GrupoOut:
    num = db.scalar(select(func.count()).select_from(MiembroGrupo).where(MiembroGrupo.grupo_id == grupo.id)) or 0
    return GrupoOut(
        id=grupo.id,
        nombre=grupo.nombre,
        tipo=grupo.tipo,
        codigo_invitacion=grupo.codigo_invitacion,
        num_miembros=num,
    )


def crear_usuario(db: Session, nombre: str) -> Usuario:
    usuario = Usuario(nombre=nombre)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def listar_grupos(db: Session, usuario_id: int | None = None) -> list[GrupoOut]:
    stmt = select(Grupo).order_by(Grupo.nombre)
    if usuario_id is not None:
        obtener_usuario(db, usuario_id)
        stmt = stmt.join(MiembroGrupo).where(MiembroGrupo.usuario_id == usuario_id)
    return [_a_out(db, g) for g in db.scalars(stmt).all()]


def detalle_grupo(db: Session, grupo_id: int) -> GrupoOut:
    return _a_out(db, obtener_grupo(db, grupo_id))


def crear_grupo(db: Session, datos: GrupoCreate) -> GrupoOut:
    obtener_usuario(db, datos.usuario_id)
    grupo = Grupo(nombre=datos.nombre, tipo=datos.tipo, codigo_invitacion=_nuevo_codigo(db))
    db.add(grupo)
    db.flush()
    db.add(MiembroGrupo(usuario_id=datos.usuario_id, grupo_id=grupo.id, rol=RolMiembro.admin))
    db.commit()
    return _a_out(db, grupo)


def actualizar_grupo(db: Session, grupo_id: int, datos: GrupoUpdate) -> GrupoOut:
    grupo = obtener_grupo(db, grupo_id)
    for campo, valor in datos.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(grupo, campo, valor)
    db.commit()
    return _a_out(db, grupo)


def unirse_por_codigo(db: Session, codigo: str, usuario_id: int) -> GrupoOut:
    obtener_usuario(db, usuario_id)
    grupo = db.scalar(select(Grupo).where(Grupo.codigo_invitacion == codigo))
    if not grupo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Código de invitación no válido")
    ya = db.scalar(
        select(MiembroGrupo).where(MiembroGrupo.grupo_id == grupo.id, MiembroGrupo.usuario_id == usuario_id)
    )
    if ya:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya eres miembro de este grupo")
    db.add(MiembroGrupo(usuario_id=usuario_id, grupo_id=grupo.id, rol=RolMiembro.miembro))
    db.commit()
    return _a_out(db, grupo)


def listar_miembros(db: Session, grupo_id: int) -> list[MiembroOut]:
    obtener_grupo(db, grupo_id)
    filas = db.execute(
        select(MiembroGrupo.usuario_id, Usuario.nombre, MiembroGrupo.rol)
        .join(Usuario, Usuario.id == MiembroGrupo.usuario_id)
        .where(MiembroGrupo.grupo_id == grupo_id)
        .order_by(MiembroGrupo.rol, Usuario.nombre)
    ).all()
    return [MiembroOut(usuario_id=u, nombre=n, rol=r) for u, n, r in filas]


def salir_del_grupo(db: Session, grupo_id: int, usuario_id: int) -> None:
    miembro = db.scalar(
        select(MiembroGrupo).where(MiembroGrupo.grupo_id == grupo_id, MiembroGrupo.usuario_id == usuario_id)
    )
    if not miembro:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ese usuario no es miembro del grupo")
    db.delete(miembro)
    db.commit()
