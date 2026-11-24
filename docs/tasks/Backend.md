# Backend — MyShelf

## Visión general
Implementar la lógica de negocio, validación de datos, persistencia y cálculos estadísticos de **MyShelf** en **Python** con **FastAPI** y **PostgreSQL**, bajo una arquitectura modular por capas dentro de `backend/app/`.

## Cómo se complementa con las demás áreas
* **Con DB y Datos:** Traduce el modelo relacional (`grupos`, `usuarios`, `miembros_grupo`, `items_mandado_inventario`) y las reglas de integridad (filtrado por `grupo_id`, cantidades positivas, tipos numéricos exactos para dinero y `JSONB` en `detalles`) a modelos y consultas seguras.
* **Con API:** Provee las rutas HTTP (`api/routes/`), esquemas **Pydantic** (`schemas/`), manejo de errores y configuración de **CORS** en `main.py`.
* **Con Frontend:** Entrega respuestas consistentes y ya calculadas (totales, categorías y alertas de caducidad) para soportar refresco inmediato y *polling* sin sobrecargar el cliente.
* **Con Documentación:** Mantiene `backend/.env.example`, `backend/requirements.txt` y las instrucciones de ejecución local alineadas con el `README.md` principal.

## Tareas y guía de trabajo
* [ ] **Preparar entorno y estructura (`backend/`):** Configurar `.venv`, instalar dependencias (`fastapi[standard]`, `sqlalchemy`, `psycopg2-binary`, `pydantic-settings`) y mantener organizada la estructura bajo `backend/app/`.
* [ ] **Configurar `core/config.py` y `core/database.py`:** Cargar `DATABASE_URL` desde variables de entorno (nunca subir `.env` ni secretos reales) y gestionar sesiones de base de datos con inyección de dependencias (`Depends`).
* [ ] **Crear modelos y esquemas:** Definir tablas en `models/` y esquemas Pydantic (`Create`, `Update`, `Out`) en `schemas/`, incluyendo `detalles: dict[str, Any] | None = None` para atributos variables.
* [ ] **Desarrollar lógica en `services/`:** Separar reglas de negocio (transiciones de estado entre `pendiente`, `comprado` y `en_inventario`, validaciones de cantidad/categoría, alertas de caducidad y agregaciones de gasto/categoría) de las rutas HTTP.
* [ ] **Configurar `main.py` y CORS:** Permitir el origen del frontend (`http://localhost:3000` en desarrollo y el dominio de despliegue) y registrar los *routers*.

## Cómo se junta al final
Al iniciar FastAPI desde `backend/` (`fastapi dev app/main.py`), el servidor se conecta a PostgreSQL mediante `DATABASE_URL`, expone los *endpoints* validados y sirve `/docs` para integrarse con el frontend.

---