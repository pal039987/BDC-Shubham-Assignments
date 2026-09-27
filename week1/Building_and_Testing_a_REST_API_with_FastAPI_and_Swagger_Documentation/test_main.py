"""
4.2 Automated Testing (Conceptual)

I would use pytest along with FastAPI's built-in TestClient
(from fastapi.testclient import TestClient) to write automated tests.

Scenarios to test for create_book:
- test_create_book_success: valid data returns 201 with correct fields + generated id
- test_create_book_missing_field: missing required field (e.g. no title) returns 422
- test_create_book_invalid_price: negative price returns 422
- test_create_book_invalid_year: year before 1800 or in the future returns 422

Similarly for other endpoints:
- get_all_books: test default pagination, custom skip/limit, author filter, empty results
- get_book_by_id: valid id returns 200, invalid id returns 404
- update_book (PUT): valid id updates all fields, invalid id returns 404
- patch_book: only provided fields change, others remain unchanged
- delete_book: valid id returns 204 and book no longer retrievable, invalid id returns 404
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_book():
    response = client.post("/books/", json={
        "title": "Test Book",
        "author": "Test Author",
        "publication_year": 2020,
        "price": 15.99
    })
    assert response.status_code == 201
    assert response.json()["title"] == "Test Book"


