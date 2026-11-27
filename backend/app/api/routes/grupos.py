from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import GrupoCreate, GrupoOut, GrupoUpdate, MiembroOut, UnirseGrupo
from app.services import grupos as svc

router = APIRouter(prefix="/grupos", tags=["Grupos"])


@router.get("", response_model=list[GrupoOut])
def listar_grupos(
    usuario_id: int | None = Query(None, description="Solo los grupos de este usuario"),
    db: Session = Depends(get_db),
):
    return svc.listar_grupos(db, usuario_id)


@router.post("", response_model=GrupoOut, status_code=status.HTTP_201_CREATED)
def crear_grupo(datos: GrupoCreate, db: Session = Depends(get_db)):
    """Crea el grupo, genera su código de invitación y agrega al creador como admin."""
    return svc.crear_grupo(db, datos)


@router.post("/unirse", response_model=GrupoOut)
def unirse(datos: UnirseGrupo, db: Session = Depends(get_db)):
    return svc.unirse_por_codigo(db, datos.codigo_invitacion, datos.usuario_id)


@router.get("/{grupo_id}", response_model=GrupoOut)
def detalle(grupo_id: int, db: Session = Depends(get_db)):
    return svc.detalle_grupo(db, grupo_id)


@router.patch("/{grupo_id}", response_model=GrupoOut)
def actualizar(grupo_id: int, datos: GrupoUpdate, db: Session = Depends(get_db)):
    return svc.actualizar_grupo(db, grupo_id, datos)


@router.get("/{grupo_id}/miembros", response_model=list[MiembroOut])
def miembros(grupo_id: int, db: Session = Depends(get_db)):
    return svc.listar_miembros(db, grupo_id)


@router.delete("/{grupo_id}/miembros/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def salir(grupo_id: int, usuario_id: int, db: Session = Depends(get_db)):
    svc.salir_del_grupo(db, grupo_id, usuario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
