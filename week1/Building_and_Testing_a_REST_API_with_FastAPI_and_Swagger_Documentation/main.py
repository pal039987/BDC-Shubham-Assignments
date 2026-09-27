from fastapi import FastAPI, HTTPException, status, Depends, Query, Path
from typing import Dict, List, Optional
from uuid import uuid4

from models import BookCreate, BookInDB, BookUpdate, BookSummary


app = FastAPI(
    title="My Tough Bookstore API",
    description="A challenging API for managing a collection of books.",
    version="1.0.0",
    contact={
        "name": "Your Name",
        "email": "your.email@example.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    }
)

# In-memory database
books_db: Dict[str, BookInDB] = {}

# Initial dummy data
initial_books = [
    {"title": "1984", "author": "George Orwell", "publication_year": 1949, "price": 9.99},
    {"title": "Brave New World", "author": "Aldous Huxley", "publication_year": 1932, "price": 10.50},
    {"title": "The Lord of the Rings", "author": "J.R.R. Tolkien", "publication_year": 1954, "price": 25.00}
]

for book_data in initial_books:
    book_id = str(uuid4())
    books_db[book_id] = BookInDB(id=book_id, **book_data)


@app.get("/", tags=["Root"], summary="Root endpoint of the API")
async def read_root():
    return {"message": "Welcome to the Tough Bookstore API!"}


# ============================================================
# Part 3.2: Dependency Injection
# ============================================================

async def get_db_session():
    print("Getting database session...")
    try:
        yield "fake_db_session_123"
    finally:
        print("Closing database session.")


# ============================================================
# Part 2.1: Create Book
# ============================================================

@app.post(
    "/books/",
    response_model=BookInDB,
    status_code=status.HTTP_201_CREATED,
    tags=["Books"],
    summary="Create a new book",
    description="Adds a new book to the inventory with a unique generated ID."
)
async def create_book(book: BookCreate):
    book_id = str(uuid4())
    new_book = BookInDB(id=book_id, **book.model_dump())
    books_db[book_id] = new_book
    return new_book


# ============================================================
# Part 2.2: Get All Books (with Part 3.2 dependency applied)
# ============================================================

@app.get(
    "/books/",
    response_model=List[BookInDB],
    tags=["Books"],
    summary="Retrieve all books",
    description="Retrieves a list of all books, with optional filtering and pagination."
)
async def get_all_books(
    db_session: str = Depends(get_db_session),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of items to return"),
    author: Optional[str] = Query(None, description="Filter by author name"),
    publication_year: Optional[int] = Query(None, ge=1800, description="Filter by publication year")
):
    print(f"Using DB Session: {db_session}")
    filtered_books = list(books_db.values())

    if author:
        filtered_books = [book for book in filtered_books if author.lower() in book.author.lower()]
    if publication_year:
        filtered_books = [book for book in filtered_books if book.publication_year == publication_year]

    return filtered_books[skip: skip + limit]


# ============================================================
# Part 2.3: Get Book by ID (with Part 3.3 response_model change)
# ============================================================

@app.get(
    "/books/{book_id}",
    response_model=BookSummary,
    tags=["Books"],
    summary="Retrieve a single book by ID",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Book not found"}
    }
)
async def get_book_by_id(
    book_id: str = Path(..., example="b123e456-e89b-12d3-a456-426614174000", description="The ID of the book to retrieve")
):
    book = books_db.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found."
        )
    return book


# ============================================================
# Part 2.4: Update Book (PUT - full replacement)
# ============================================================

@app.put(
    "/books/{book_id}",
    response_model=BookInDB,
    tags=["Books"],
    summary="Update an existing book",
    description="Replaces all fields of an existing book with the provided data."
)
async def update_book(
    book_data: BookCreate,
    book_id: str = Path(..., description="The ID of the book to update")
):
    if book_id not in books_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found."
        )
    updated_book = BookInDB(id=book_id, **book_data.model_dump())
    books_db[book_id] = updated_book
    return updated_book


# ============================================================
# Part 2.5: Partially Update Book (PATCH)
# ============================================================

@app.patch(
    "/books/{book_id}",
    response_model=BookInDB,
    tags=["Books"],
    summary="Partially update an existing book",
    description="Updates only the provided fields of an existing book."
)
async def patch_book(
    book_data: BookUpdate,
    book_id: str = Path(..., description="The ID of the book to partially update")
):
    existing_book = books_db.get(book_id)
    if not existing_book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found."
        )

    update_data = book_data.model_dump(exclude_unset=True)
    updated_item = existing_book.model_copy(update=update_data)

    books_db[book_id] = updated_item
    return updated_item


# ============================================================
# Part 2.6: Delete Book
# ============================================================

@app.delete(
    "/books/{book_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Books"],
    summary="Delete a book",
    description="Removes a book from the inventory by its ID."
)
async def delete_book(book_id: str = Path(..., description="The ID of the book to delete")):
    if book_id not in books_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found."
        )
    del books_db[book_id]
    return


# ============================================================
# Part 3.1: Custom Error Handling (optional, reference only)
# ============================================================
"""
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )
"""


# ============================================================
# Part 4.3: Scalability and Persistence (Conceptual)
# ============================================================
"""
Currently books_db is a plain in-memory dictionary, so all data is lost
when the server restarts. To make this production-ready, I would:

1. Replace books_db with a real database (e.g. PostgreSQL for production,
   SQLite for local dev/testing).
2. Use SQLAlchemy as the ORM:
   - Define a SQLAlchemy `Book` model (table) separately from the Pydantic
     models in models.py - Pydantic models stay for request/response
     validation, SQLAlchemy models represent the actual DB table.
   - Add a `database.py` with an engine, SessionLocal, and Base.
3. Replace the `get_db_session()` dummy dependency with a real one that
   yields a SQLAlchemy `Session` (opens a session, yields it, closes it
   in a `finally` block - same shape as now, just backed by a real DB).
4. In each endpoint, replace direct dict operations (books_db[book_id] = ...)
   with SQLAlchemy queries (db.add(), db.query(Book).filter(...), db.commit()).
5. Use Alembic for database migrations as the schema evolves.
"""