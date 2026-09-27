from pydantic import BaseModel, Field, PositiveInt, NonNegativeFloat
from typing import Optional
from datetime import datetime


class BookBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, example="The Great Gatsby")
    author: str = Field(..., min_length=3, max_length=100, example="F. Scott Fitzgerald")
    publication_year: PositiveInt = Field(..., ge=1800, le=datetime.now().year, description="Year of publication")
    price: NonNegativeFloat = Field(..., gt=0.0, example=12.99)
    # Challenge: genre and isbn fields can be added here if needed


class BookCreate(BookBase):
    # Used for creating new books. Inherits from BookBase.
    pass


class BookUpdate(BaseModel):
    # Used for updating existing books. All fields optional.
    title: Optional[str] = None
    author: Optional[str] = None
    publication_year: Optional[PositiveInt] = None
    price: Optional[NonNegativeFloat] = None


class BookInDB(BookBase):
    # Represents a book as stored in our in-memory 'database'.
    id: str = Field(..., example="b123e456-e89b-12d3-a456-426614174000", description="Unique Book ID")

    class Config:
        from_attributes = True  # Pydantic v2 equivalent of orm_mode = True


# Part 3.3 - Response model customization for GET /books/{book_id}
class BookSummary(BaseModel):
    title: str
    author: str
    price: NonNegativeFloat