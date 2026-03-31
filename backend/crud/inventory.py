from sqlalchemy.orm import Session

from models.inventory import Inventory
from schemas.inventory import InventoryCreate, InventoryUpdate


def get_inventory(db: Session):
    return db.query(Inventory).all()


def get_inventory_by_id(db: Session, item_id: int):
    return db.query(Inventory).filter(Inventory.id == item_id).first()


def create_inventory_item(db: Session, payload: InventoryCreate):
    db_obj = Inventory(**payload.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_inventory_item(db: Session, db_obj: Inventory, payload: InventoryUpdate):
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_inventory_item(db: Session, db_obj: Inventory):
    db.delete(db_obj)
    db.commit()
