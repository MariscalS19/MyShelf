# MyShelf

Plataforma web colaborativa para gestionar listas de mandado, inventario y gastos por grupos (como despensa familiar, depa compartido o dietas/metas personales), con resumen estadístico de hábitos de consumo y compras.

---

## Tabla de contenidos

- [MyShelf](#myshelf)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Visión y alcance del proyecto](#visión-y-alcance-del-proyecto)
    - [Enfoque de entrega](#enfoque-de-entrega)
  - [Stack tecnológico y justificación de decisiones](#stack-tecnológico-y-justificación-de-decisiones)
  - [Estructura del repositorio](#estructura-del-repositorio)
  - [Modelo de datos y reglas de negocio](#modelo-de-datos-y-reglas-de-negocio)
    - [Tablas núcleo](#tablas-núcleo)
    - [Reglas obligatorias de datos](#reglas-obligatorias-de-datos)
  - [Especificaciones y lista de tareas por área](#especificaciones-y-lista-de-tareas-por-área)
  - [Roles, flujo de trabajo en Git y convenciones](#roles-flujo-de-trabajo-en-git-y-convenciones)
  - [Guía de instalación y ejecución local](#guía-de-instalación-y-ejecución-local)
    - [1. Clonar y preparar el repositorio](#1-clonar-y-preparar-el-repositorio)
    - [2. Backend (FastAPI)](#2-backend-fastapi)
    - [3. Frontend (Next.js)](#3-frontend-nextjs)
  - [Consideraciones técnicas importantes para el equipo](#consideraciones-técnicas-importantes-para-el-equipo)
  - [Checklist previo a la entrega](#checklist-previo-a-la-entrega)

---

## Visión y alcance del proyecto

**MyShelf** permite organizar lo que se compra y lo que se tiene disponible dentro de distintos **grupos** (por ejemplo: *Familia* para el mandado compartido o *Dieta Gym* para seguimiento personal), manteniendo los datos separados por grupo y ofreciendo métricas sencillas de gasto y categorías.

### Enfoque de entrega
* **Entregable principal:** Aplicación web *mobile-first* funcional de punta a punta (frontend + backend + base de datos).
* **Prioridad:** Estabilidad, claridad del flujo principal y datos consistentes antes que agregados complejos que consuman demasiado tiempo.

---

## Stack tecnológico y justificación de decisiones

| Capa / Área | Tecnología elegida | ¿Por qué se eligió? | Alternativas descartadas por ahora |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js** (App Router) | Permite estructurar rutas rápidas, mantener una experiencia *mobile-first* en navegador y conectar limpiamente con la API. | **React Native** como prioridad inicial: mayor curva de configuración de entorno, compilación y navegación en poco tiempo. |
| **Actualización en vivo** | **Refresco inmediato + Polling** | Con el tiempo disponible y sin experiencia previa del equipo en sockets, refrescar tras cada acción y consultar cada pocos segundos resuelve la sincronización entre miembros sin complejidad extra. | **WebSockets**: mayor complejidad de conexión/reconexión frente al beneficio en este MVP. |
| **Backend** | **FastAPI** (Python) | Sintaxis clara en Python, validación automática con **Pydantic**, documentación interactiva automática en `/docs` y rápida puesta en marcha. | Múltiples servicios backend simultáneos o frameworks con mayor configuración inicial: fragmentarían el tiempo del equipo. |
| **Base de datos** | **PostgreSQL** (con `JSONB`) | Combina integridad relacional (grupos, miembros, ítems, montos) con flexibilidad mediante columnas `JSONB` para detalles variables por producto sin inflar tablas de columnas nulas. | Base puramente documental o esquema rígido sin campos variables: dificultaría equilibrar relaciones de gasto/grupos con atributos opcionales. |
| **Imágenes** | **URLs / Alojamiento externo gratuito** | Evita complicar el servidor principal con almacenamiento pesado de archivos en la etapa inicial. | Subir y procesar binarios pesados directamente en el servidor de la API en el MVP. |

---

## Estructura del repositorio

El repositorio está organizado como un **monorepo** sencillo para separar responsabilidades y reducir conflictos en Git:

```text
PI_MyShelf/
├── .gitignore
├── README.md
├── docs/
│   └── tasks/                   # Guías de trabajo por área (API, Backend, DB, Documentación, Frontend)
├── frontend/                    # Aplicación web en Next.js
│   ├── .env.example             # Plantilla de variables del frontend (ej. NEXT_PUBLIC_API_URL)
│   ├── package.json
│   └── src/
│       ├── app/                 # Páginas y rutas (grupos, mandado, inventario, análisis)
│       ├── components/          # Componentes UI reutilizables (selector de grupo, tarjetas, modales)
│       ├── services/            # Funciones de consumo de la API separadas por recurso
│       └── types/               # Tipos / interfaces de datos del frontend
└── backend/                     # API y lógica de negocio en FastAPI + PostgreSQL
    ├── .env.example             # Plantilla de variables de entorno (sin credenciales reales)
    ├── requirements.txt         # Dependencias de Python
    └── app/
        ├── main.py              # Instancia de FastAPI, CORS y registro de routers
        ├── core/
        │   ├── config.py        # Lectura de configuración y variables de entorno
        │   └── database.py      # Conexión a PostgreSQL y manejo de sesiones
        ├── api/
        │   └── routes/          # Endpoints HTTP (grupos, ítems, análisis)
        ├── models/              # Modelos de tablas / persistencia
        ├── schemas/             # Modelos Pydantic de entrada, actualización y respuesta
        └── services/            # Reglas de negocio y cálculos estadísticos
```

---

## Modelo de datos y reglas de negocio

### Tablas núcleo
* **`grupos`**: `id`, `nombre`, `tipo` (*familiar*, *personal*, *fitness*, etc.), `codigo_invitacion`.
* **`usuarios`**: `id`, `nombre` (sin amarrar a un solo grupo).
* **`miembros_grupo`**: `id`, `usuario_id`, `grupo_id`, `rol` (relación N:M).
* **`items_mandado_inventario`**: `id`, `grupo_id`, `agregado_por_id`, `nombre`, `categoria`, `estado` (`pendiente`, `comprado`, `en_inventario`), `cantidad`, `precio_estimado`, `precio_pagado`, `fecha_caducidad`, `imagen_url`, `detalles` (`JSONB`), `creado_en`.
* **`catalogo_base` (opcional)**: sugerencias y valores por defecto para agilizar la carga de productos.

### Reglas obligatorias de datos
* **Aislamiento por grupo:** Toda consulta de ítems, inventario o métricas debe filtrar por `grupo_id`.
* **Precisión monetaria:** Usar tipos numéricos exactos (`NUMERIC` / `Decimal`) para dinero y evitar *float* binario en sumas o cálculos.
* **Columnas vs. `JSONB`:** Mantener en columnas normales lo que se filtra, ordena o suma (`grupo_id`, `estado`, `categoria`, precios) y dejar en `detalles` (`JSONB`) atributos variables u opcionales (ej. unidad o marca).
* **Cantidades y estados:** Validar que `cantidad` sea positiva y coherente con el estado del ítem (`pendiente`, `comprado`, `en_inventario`).

---

## Especificaciones y lista de tareas por área

El detalle específico de cada eje se documenta en `docs/tasks/` (`API.md`, `Backend.md`, `DB.md`, `Documentación.md` y `Frontend.md`):

1. **DB y Datos:** Modelar las tablas núcleo en PostgreSQL, aplicar las reglas de `grupo_id`, `NUMERIC` y `JSONB`, y preparar datos semilla/pruebas para validar consultas y agregaciones.
2. **Backend:** Configurar `.venv`, `core/config.py` y `core/database.py`, definir modelos y esquemas Pydantic (`Create`, `Update`, `Out`), y aislar la lógica de negocio (cambios de estado, validaciones, caducidades y métricas) en `services/`.
3. **API:** Exponer los *endpoints* HTTP en `api/routes/` (grupos, ítems, análisis), validar entradas/salidas, manejar errores HTTP claros (`400`, `404`, `422`), habilitar CORS y verificar en `/docs`.
4. **Frontend:** Construir las vistas *mobile-first* (selector de grupo, mandado, inventario, análisis), centralizar llamadas HTTP en `src/services/`, tipar respuestas en `src/types/` y manejar refresco inmediato + *polling* limpio.
5. **Documentación y QA:** Mantener `README.md`, `.env.example` y `docs/tasks/` al día, probar el flujo completo con datos reales y verificar el *checklist* antes de entregar.

---

## Roles, flujo de trabajo en Git y convenciones

* **Ramas:** Trabajar sobre ramas dedicadas por tarea o módulo (ej. `feat/...`, `fix/...`, `docs/...`) y fusionar a `main` mediante revisión o *pull request* para mantener `main` estable.
* **Mensajes de *commit*:** Usar mensajes breves y descriptivos (ej. `feat(backend): add items endpoints`, `docs: update project readme`).
* **Archivos prohibidos en Git:** Nunca subir `.env`, credenciales reales, `.venv/`, `node_modules/` ni `.next/`; usar siempre `.env.example` como plantilla.
* **Criterio de "listo" (Definition of Done):** Cada tarea se considera terminada cuando funciona integrada con su capa vecina, pasa pruebas básicas y no deja errores en consola ni en `/docs`.

---

## Guía de instalación y ejecución local

### 1. Clonar y preparar el repositorio
```bash
git clone https://github.com/MariscalS19/MyShelf.git
cd PI_MyShelf
```

### 2. Backend (FastAPI)
Ejecutar desde la carpeta `backend/` con el entorno virtual activo:

```bash
cd backend
python -m venv .venv

# Activar entorno virtual:
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Windows (Git Bash):   source .venv/Scripts/activate
# macOS / Linux:        source .venv/bin/activate

pip install -r requirements.txt
# Copiar backend/.env.example a backend/.env y configurar DATABASE_URL
fastapi dev app/main.py
```

* **API disponible en:** `http://127.0.0.1:8000`
* **Documentación interactiva:** `http://127.0.0.1:8000/docs`

### 3. Frontend (Next.js)
Ejecutar desde la carpeta `frontend/`:

```bash
cd frontend
npm install
# Copiar frontend/.env.example a frontend/.env.local si aplica (ej. NEXT_PUBLIC_API_URL)
npm run dev
```

* **Aplicación disponible en:** `http://localhost:3000`

---

## Consideraciones técnicas importantes para el equipo

* **CORS:** El backend debe permitir el origen del frontend (`http://localhost:3000` en desarrollo y el dominio de producción cuando se despliegue) para que el navegador no bloquee las peticiones.
* **Limpieza del *polling*:** Si el frontend consulta periódicamente los ítems de un grupo, debe detener el intervalo al desmontar o cambiar de vista para no acumular peticiones ni fugas de memoria.
* **Estados de carga y error:** Mostrar indicadores de carga, estados vacíos (cuando un grupo no tiene ítems aún) y mensajes de error claros si falla la red o la API.
* **Pruebas con datos realistas:** Probar tanto con un grupo con pocos ítems como con varios ítems de distintas categorías y precios para verificar que las sumas y filtros se comporten bien.

---

## Checklist previo a la entrega

* [ ] La base de datos responde y crea/conecta las tablas sin errores.
* [ ] Los *endpoints* principales funcionan y se pueden probar en `/docs`.
* [ ] El frontend se conecta a la API sin errores de CORS ni variables faltantes.
* [ ] El flujo principal funciona de punta a punta: crear/seleccionar grupo -> agregar ítem -> actualizar estado/cantidad -> ver resumen/análisis.
* [ ] La interfaz se ve bien tanto en vista móvil como en escritorio.
* [ ] No hay credenciales reales, `.env` ni carpetas pesadas (`node_modules`, `.venv`, `.next`) subidas al repositorio.