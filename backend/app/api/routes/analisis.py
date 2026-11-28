from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import ResumenAnalisis
from app.services import analisis as svc

router = APIRouter(prefix="/grupos/{grupo_id}/analisis", tags=["Análisis"])


@router.get("", response_model=ResumenAnalisis)
def resumen(
    grupo_id: int,
    dias_alerta: int | None = Query(None, ge=0, le=60, description="Días para alertar caducidad"),
    db: Session = Depends(get_db),
):
    """Gasto total, gasto por categoría, productos más comprados y alertas de caducidad."""
    return svc.resumen_grupo(db, grupo_id, dias_alerta)
