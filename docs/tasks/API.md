# API — MyShelf

## Visión general
Definir y exponer la interfaz HTTP de **MyShelf** en **FastAPI**, funcionando como el puente tipado y validado entre el frontend (**Next.js**) y los servicios/datos del backend (**PostgreSQL**).

## Cómo se complementa con las demás áreas
* **Con Backend:** Las rutas en `backend/app/api/routes/` reciben la petición, validan entradas y salidas con esquemas **Pydantic** (`schemas/`) y delegan la lógica de negocio a `services/`.
* **Con DB y Datos:** Respeta las entidades (`grupos`, `usuarios`, `miembros_grupo`, `items_mandado_inventario`), el aislamiento obligatorio por `grupo_id`, los estados válidos (`pendiente`, `comprado`, `en_inventario`) y la precisión monetaria.
* **Con Frontend:** Expone contratos JSON previsibles, acepta `grupo_id` en rutas o parámetros de consulta y devuelve códigos HTTP claros (`400`, `404`, `422`) para que `frontend/src/services/` y `frontend/src/types/` consuman la API sin ambigüedad.
* **Con Documentación:** Se apoya en la documentación interactiva automática de FastAPI (`/docs`) y en `docs/tasks/API.md` para verificar contratos antes y durante la integración.

## Tareas y guía de trabajo
* [ ] **Organizar rutas por recurso (`backend/app/api/routes/`):** Separar los *endpoints* en módulos claros (por ejemplo `grupos.py`, `items.py` y `analisis.py`).
* [ ] **Implementar *endpoints* mínimos del MVP:**
  * [ ] **Grupos:** listar y crear grupos, además de unir/gestionar miembros (ej. `GET /grupos`, `POST /grupos`, unión por código de invitación).
  * [ ] **Ítems:** listar ítems filtrados por `grupo_id` (y filtros opcionales como `estado`), crear ítem (`POST`), actualizar parcialmente (`PATCH` para estado, cantidad o datos) y eliminar (`DELETE`).
  * [ ] **Análisis:** consultar resúmenes por `grupo_id` (totales de gasto, desglose por categoría y alertas de caducidad/hábitos calculadas en backend).
* [ ] **Validar entradas, salidas y errores:** Usar esquemas Pydantic (`Create`, `Update`, `Out`), distinguir parámetros de ruta vs. *query params* y responder con códigos HTTP adecuados (`400`, `404`, `422`).
* [ ] **Probar en `/docs`:** Verificar cada ruta con casos válidos e inválidos en Swagger antes de darla por terminada.

## Cómo se junta al final
Las rutas quedan registradas en `backend/app/main.py` con **CORS** habilitado para el origen del frontend y validadas en `/docs`, listas para que el frontend las consuma desde `src/services/` con refresco inmediato y *polling* controlado.

---