# Frontend — MyShelf

## Visión general
Construir la interfaz web *mobile-first* de **MyShelf** con **Next.js (App Router)** para alternar entre grupos (ej. *Familia* o *Dieta Gym*), gestionar listas de mandado e inventario y consultar resúmenes de gastos y categorías.

## Cómo se complementa con las demás áreas
* **Con API y Backend:** Consume los *endpoints* HTTP de FastAPI de forma desacoplada a través de `frontend/src/services/` y tipa las respuestas en `frontend/src/types/`, delegando al backend la validación, persistencia y cálculos.
* **Con DB y Datos:** Trabaja siempre sobre el `grupo_id` activo, refleja los estados (`pendiente`, `comprado`, `en_inventario`) y muestra campos de `detalles` (`JSONB`) y montos sin errores de redondeo en el cliente.
* **Con Documentación:** Sigue la estructura de `frontend/src/`, las variables de entorno (como `NEXT_PUBLIC_API_URL`) y las convenciones acordadas en el repositorio.

## Tareas y guía de trabajo
* [ ] **Configurar base y entorno:** Levantar Next.js en `http://localhost:3000`, configurar `NEXT_PUBLIC_API_URL` a partir de `.env.example` y verificar la comunicación sin bloqueos de CORS.
* [ ] **Definir tipos en `frontend/src/types/`:** Crear tipos o interfaces para `Grupo`, `Usuario`, `Item` (con `detalles` opcional) y `ResumenAnalisis`.
* [ ] **Crear capa de servicios en `frontend/src/services/`:** Centralizar llamadas HTTP por recurso en vez de escribir `fetch` dispersos dentro de los componentes.
* [ ] **Construir vistas y componentes en `frontend/src/app/` y `frontend/src/components/`:**
  * [ ] Selector de grupo activo que actualice el contexto y recargue los datos del grupo seleccionado.
  * [ ] Vista de lista de mandado (`pendiente`) con acción rápida para pasar ítems a `comprado` o `en_inventario`.
  * [ ] Vista de inventario para consultar cantidades, alertas de caducidad, y crear, editar o eliminar ítems.
  * [ ] Vista de análisis/resumen para revisar gasto total, categorías y alertas/hábitos.
* [ ] **Implementar sincronización y estados de UX:** Refrescar datos tras `POST`, `PATCH` y `DELETE`, usar *polling* controlado limpiando el intervalo al desmontar la vista, y mostrar estados de **carga**, **vacío** y **error**.

## Cómo se junta al final
El frontend se conecta a FastAPI y completa el flujo de extremo a extremo (**seleccionar/crear grupo $\rightarrow$ agregar ítem $\rightarrow$ actualizar estado/cantidad $\rightarrow$ ver resumen/análisis**), validado tanto en móvil como en escritorio.