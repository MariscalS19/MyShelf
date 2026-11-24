# DB y Datos — MyShelf

## Visión general
Definir y mantener el **contrato de datos** de **MyShelf** en **PostgreSQL**, asegurando relaciones claras entre grupos, usuarios e ítems, precisión monetaria, flexibilidad con `JSONB` y datos de prueba realistas.

## Cómo se complementa con las demás áreas
* **Con Backend y API:** Sirve como fuente de verdad sobre nombres de tablas, columnas, tipos y reglas que el backend modela y la API valida/expone.
* **Con Frontend:** Define los campos disponibles para aislar datos por `grupo_id`, separar mandado e inventario, mostrar alertas de caducidad y resumir gastos por categoría.
* **Con Documentación:** Documenta el esquema, reglas de datos y datos semilla/pruebas en `README.md` y `docs/tasks/DB.md`.

## Tareas y guía de trabajo
* [ ] **Modelar las tablas núcleo en PostgreSQL:**
  * [ ] `grupos`: `id`, `nombre`, `tipo` (*familiar*, *personal*, *fitness*, etc.), `codigo_invitacion`.
  * [ ] `usuarios`: `id`, `nombre` (sin vincular a un solo grupo).
  * [ ] `miembros_grupo`: `id`, `usuario_id`, `grupo_id`, `rol` (relación muchos a muchos N:M).
  * [ ] `items_mandado_inventario`: `id`, `grupo_id`, `agregado_por_id`, `nombre`, `categoria`, `estado` (`pendiente`, `comprado`, `en_inventario`), `cantidad`, `precio_estimado`, `precio_pagado`, `fecha_caducidad`, `imagen_url`, `detalles` (`JSONB`), `creado_en`.
  * [ ] *(Opcional)* `catalogo_base`: `id`, `nombre`, `categoria_sugerida`, `unidad_sugerida`, `imagen_default_url` para sugerencias al capturar ítems.
* [ ] **Aplicar reglas obligatorias de datos:**
  * [ ] Filtrar toda consulta de ítems o métricas por `grupo_id` para evitar mezclar información entre grupos.
  * [ ] Usar tipos numéricos exactos (`NUMERIC` / `Decimal`) para montos y evitar *float* binario en sumas o cálculos.
  * [ ] Mantener en columnas normales lo que se filtra, ordena o suma (`grupo_id`, `estado`, `categoria`, precios) y dejar en `JSONB` (`detalles`) atributos variables u opcionales (ej. `{"unidad": "L", "marca": "Lala"}`).
  * [ ] Validar que `cantidad` sea positiva y coherente con el estado del ítem.
* [ ] **Preparar datos semilla / pruebas:** Crear datos o *scripts* de prueba con al menos 2 grupos (ej. *Familia* y *Dieta Gym*), distintas categorías, precios y fechas de caducidad para probar filtros, sumas y vistas.

## Cómo se junta al final
Las tablas se crean en PostgreSQL sin errores, cuentan con datos semilla representativos y el backend ejecuta consultas y agregaciones (`SUM`, `COUNT`, `GROUP BY`, filtros por `grupo_id`) consistentes para toda la aplicación.

---