# Documentación — MyShelf

## Visión general
Centralizar la visión del producto, decisiones técnicas, estructura del repositorio, guías de instalación, convenciones de Git y *checklist* de calidad de **MyShelf** para mantener alineado al equipo y evitar bloqueos.

## Cómo se complementa con las demás áreas
* **Con Frontend, Backend, DB y API:** Conecta el motivo de cada decisión técnica (Next.js *mobile-first*, refresco inmediato + *polling* en vez de WebSockets, FastAPI, PostgreSQL con `JSONB`, URLs externas de imágenes en el MVP) con las tareas de cada módulo.
* **Con el flujo del equipo:** Reduce conflictos en Git, impide subir `.env`, secretos reales o carpetas generadas (`.venv/`, `node_modules/`, `.next/`) y define el criterio de "listo" para cada entrega.

## Tareas y guía de trabajo
* [ ] **Mantener visión, alcance y *stack*:** Documentar qué resuelve MyShelf, el enfoque *mobile-first* y las razones de cada elección o alternativa descartada en el `README.md` principal.
* [ ] **Mantener estructura y guía local:** Reflejar el árbol real del repositorio (`frontend/`, `backend/`, `docs/tasks/`) y los pasos para levantar ambos servicios en local (`http://localhost:3000` y `http://127.0.0.1:8000`).
* [ ] **Alinear guías en `docs/tasks/` y `.env.example`:** Mantener coherentes `API.md`, `Backend.md`, `DB.md`, `Documentación.md`, `Frontend.md`, `backend/.env.example` y `frontend/.env.example`.
* [ ] **Verificar el *checklist* previo a la entrega:** Comprobar base de datos, *endpoints* en `/docs`, CORS, flujo de punta a punta, diseño móvil/escritorio y limpieza de archivos en Git.

## Cómo se junta al final
El `README.md` global y los documentos en `docs/tasks/` funcionan como referencia única: al revisar el *checklist* final, todo el equipo confirma que el proyecto corre en local y en despliegue siguiendo los mismos acuerdos.

---