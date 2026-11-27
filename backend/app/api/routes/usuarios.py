from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import GrupoOut, UsuarioCreate, UsuarioOut
from app.services import grupos as svc

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra a una persona solo con su nombre (el MVP no maneja contraseñas)."""
    return svc.crear_usuario(db, datos.nombre)


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return svc.obtener_usuario(db, usuario_id)


@router.get("/{usuario_id}/grupos", response_model=list[GrupoOut])
def grupos_del_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return svc.listar_grupos(db, usuario_id)
