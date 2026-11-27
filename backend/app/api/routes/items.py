from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import EstadoItem
from app.schemas import ItemCreate, ItemOut, ItemUpdate
from app.services import items as svc

# Todas las rutas de ítems cuelgan del grupo para forzar el aislamiento por grupo_id
router = APIRouter(prefix="/grupos/{grupo_id}/items", tags=["Ítems"])


@router.get("", response_model=list[ItemOut])
def listar(
    grupo_id: int,
    estado: EstadoItem | None = Query(None),
    categoria: str | None = Query(None),
    buscar: str | None = Query(None, description="Texto contenido en el nombre"),
    db: Session = Depends(get_db),
):
    return svc.listar_items(db, grupo_id, estado, categoria, buscar)


@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def crear(grupo_id: int, datos: ItemCreate, db: Session = Depends(get_db)):
    return svc.crear_item(db, grupo_id, datos)


@router.get("/{item_id}", response_model=ItemOut)
def detalle(grupo_id: int, item_id: int, db: Session = Depends(get_db)):
    return svc.a_out(svc.obtener_item(db, grupo_id, item_id))


@router.patch("/{item_id}", response_model=ItemOut)
def actualizar(grupo_id: int, item_id: int, datos: ItemUpdate, db: Session = Depends(get_db)):
    """Actualización parcial (estado, cantidad, precios, etc.). Valida las transiciones de estado."""
    return svc.actualizar_item(db, grupo_id, item_id, datos)


@router.post("/{item_id}/consumir", response_model=ItemOut | None)
def consumir(
    grupo_id: int,
    item_id: int,
    reponer: bool = Query(True, description="Agregar de nuevo a la lista de mandado"),
    db: Session = Depends(get_db),
):
    """Se acabó un producto del inventario. Devuelve el nuevo ítem pendiente si `reponer=true`."""
    return svc.consumir_item(db, grupo_id, item_id, reponer)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(grupo_id: int, item_id: int, db: Session = Depends(get_db)):
    svc.eliminar_item(db, grupo_id, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
