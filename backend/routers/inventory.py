from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import inventory as inventory_crud
from database import get_db
from schemas.inventory import InventoryCreate, InventoryOut, InventoryUpdate

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryOut], dependencies=[Depends(get_current_user)])
def list_inventory(db: Session = Depends(get_db)):
    return inventory_crud.get_inventory(db)


@router.post("", response_model=InventoryOut, dependencies=[Depends(get_current_user)])
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    return inventory_crud.create_inventory_item(db, payload)


@router.put("/{item_id}", response_model=InventoryOut, dependencies=[Depends(get_current_user)])
def update_inventory(item_id: int, payload: InventoryUpdate, db: Session = Depends(get_db)):
    record = inventory_crud.get_inventory_by_id(db, item_id)
    if not record:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return inventory_crud.update_inventory_item(db, record, payload)


@router.delete("/{item_id}", dependencies=[Depends(get_current_user)])
def delete_inventory(item_id: int, db: Session = Depends(get_db)):
    record = inventory_crud.get_inventory_by_id(db, item_id)
    if not record:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    inventory_crud.delete_inventory_item(db, record)
    return {"message": "Inventory item deleted"}
