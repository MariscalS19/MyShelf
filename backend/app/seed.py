"""Datos semilla para probar la app.

Uso (desde backend/ con el .venv activo):
    python -m app.seed          # agrega los datos de ejemplo
    python -m app.seed --reset  # BORRA todas las tablas y las vuelve a crear con datos
"""

import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal as D

from app.core.database import Base, SessionLocal, crear_tablas, engine
from app.models import CatalogoBase, EstadoItem, Grupo, Item, MiembroGrupo, RolMiembro, TipoGrupo, Usuario

hoy = date.today()
ahora = datetime.now(timezone.utc)


def dias(n: int) -> date:
    return hoy + timedelta(days=n)


def hace(n: int) -> datetime:
    return ahora - timedelta(days=n)


CATALOGO = [
    ("Leche", "lacteos", "L"),
    ("Huevo", "proteina", "pza"),
    ("Pechuga de pollo", "proteina", "kg"),
    ("Arroz", "abarrotes", "kg"),
    ("Frijol", "abarrotes", "kg"),
    ("Tortillas", "abarrotes", "kg"),
    ("Jitomate", "frutas_verduras", "kg"),
    ("Plátano", "frutas_verduras", "kg"),
    ("Avena", "abarrotes", "kg"),
    ("Jabón para trastes", "limpieza", "pza"),
    ("Papel de baño", "limpieza", "pza"),
    ("Yogurt griego", "lacteos", "pza"),
]


def sembrar() -> None:
    db = SessionLocal()
    try:
        if db.query(Grupo).count():
            print("Ya hay datos; usa --reset para empezar de cero.")
            return

        emiliano, hector, daniel = Usuario(nombre="Emiliano"), Usuario(nombre="Héctor"), Usuario(nombre="Daniel")
        db.add_all([emiliano, hector, daniel])
        db.flush()

        familia = Grupo(nombre="Familia", tipo=TipoGrupo.familiar, codigo_invitacion="FAM123")
        gym = Grupo(nombre="Dieta Gym", tipo=TipoGrupo.fitness, codigo_invitacion="GYM456")
        db.add_all([familia, gym])
        db.flush()

        db.add_all(
            [
                MiembroGrupo(usuario_id=emiliano.id, grupo_id=familia.id, rol=RolMiembro.admin),
                MiembroGrupo(usuario_id=hector.id, grupo_id=familia.id),
                MiembroGrupo(usuario_id=daniel.id, grupo_id=familia.id),
                MiembroGrupo(usuario_id=emiliano.id, grupo_id=gym.id, rol=RolMiembro.admin),
            ]
        )

        P, C, I = EstadoItem.pendiente, EstadoItem.comprado, EstadoItem.en_inventario

        def item(grupo, quien, nombre, cat, estado, cant, est=None, pag=None, cad=None, compra=None, det=None):
            return Item(
                grupo_id=grupo.id,
                agregado_por_id=quien.id,
                nombre=nombre,
                categoria=cat,
                estado=estado,
                cantidad=D(cant),
                precio_estimado=D(est) if est else None,
                precio_pagado=D(pag) if pag else None,
                fecha_caducidad=cad,
                comprado_en=compra,
                detalles=det,
            )

        db.add_all(
            [
                # Familia — mandado pendiente
                item(familia, hector, "Tortillas", "abarrotes", P, "2", est="44.00", det={"unidad": "kg"}),
                item(familia, daniel, "Papel de baño", "limpieza", P, "1", est="89.90", det={"marca": "Pétalo"}),
                item(familia, emiliano, "Jitomate", "frutas_verduras", P, "1.5", est="37.50", det={"unidad": "kg"}),
                # Familia — comprado (en camino a la alacena)
                item(familia, hector, "Frijol", "abarrotes", C, "1", est="38.00", pag="35.50", compra=hace(0)),
                # Familia — inventario
                item(familia, emiliano, "Leche", "lacteos", I, "3", est="84.00", pag="81.00",
                     cad=dias(2), compra=hace(3), det={"unidad": "L", "marca": "Lala"}),
                item(familia, daniel, "Huevo", "proteina", I, "30", pag="98.00", cad=dias(15), compra=hace(5),
                     det={"unidad": "pza"}),
                item(familia, hector, "Arroz", "abarrotes", I, "2", pag="52.00", cad=dias(240), compra=hace(10)),
                item(familia, emiliano, "Jamón de pavo", "carnes_frias", I, "0.25", pag="45.00",
                     cad=dias(-1), compra=hace(9), det={"unidad": "kg", "marca": "FUD"}),
                item(familia, daniel, "Jabón para trastes", "limpieza", I, "1", pag="32.50", compra=hace(12)),
                item(familia, hector, "Leche", "lacteos", I, "2", pag="54.00", cad=dias(6), compra=hace(1),
                     det={"unidad": "L", "marca": "Alpura"}),
                # Dieta Gym
                item(gym, emiliano, "Pechuga de pollo", "proteina", P, "1", est="145.00", det={"unidad": "kg"}),
                item(gym, emiliano, "Avena", "abarrotes", P, "1", est="42.00", det={"unidad": "kg"}),
                item(gym, emiliano, "Yogurt griego", "lacteos", I, "4", pag="76.00", cad=dias(4), compra=hace(2)),
                item(gym, emiliano, "Huevo", "proteina", I, "18", pag="62.00", cad=dias(12), compra=hace(2)),
                item(gym, emiliano, "Plátano", "frutas_verduras", I, "1", pag="24.90", cad=dias(3), compra=hace(1),
                     det={"unidad": "kg"}),
                item(gym, emiliano, "Proteína whey", "suplementos", I, "1", pag="899.00", compra=hace(20),
                     det={"marca": "Optimum", "sabor": "chocolate", "porciones": 30}),
            ]
        )

        db.add_all([CatalogoBase(nombre=n, categoria_sugerida=c, unidad_sugerida=u) for n, c, u in CATALOGO])
        db.commit()
        print("Datos semilla creados: grupos 'Familia' (código FAM123) y 'Dieta Gym' (código GYM456).")
    finally:
        db.close()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        from app import models  # noqa: F401

        Base.metadata.drop_all(bind=engine)
        print("Tablas borradas.")
    crear_tablas()
    sembrar()
