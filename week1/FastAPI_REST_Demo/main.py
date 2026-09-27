from fastapi import FastAPI
from pydantic import BaseModel

# Create an instance of FastAPI
app = FastAPI()

# Define a request body model using Pydantic for validation
class Item(BaseModel):
    name: str
    price: float
    quantity: int

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI app!"}

# GET endpoint with path parameter
@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "description": "This is a sample item"}

# POST endpoint to create an item
@app.post("/items/")
def create_item(item: Item):
    total_cost = item.price * item.quantity
    return {
        "name": item.name,
        "total_cost": total_cost,
        "details": item
    }