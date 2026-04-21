from pydantic import BaseModel


class InventoryBase(BaseModel):
    item_name: str
    category: str
    quantity: int
    condition: str
    location: str | None = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    item_name: str | None = None
    category: str | None = None
    quantity: int | None = None
    condition: str | None = None
    location: str | None = None


class InventoryOut(InventoryBase):
    id: int

    class Config:
        from_attributes = True
