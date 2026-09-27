# 1. Create Book:
curl -X POST "http://127.0.0.1:8000/books/" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Book", "author": "Test Author", "publication_year": 2020, "price": 15.99}'

# 2. Get All Books (with filters/pagination):
curl -X GET "http://127.0.0.1:8000/books/?skip=0&limit=5&author=George%20Orwell"

# 3. Get Book by ID (replace {book_id} with an actual ID):
curl -X GET "http://127.0.0.1:8000/books/{book_id}"

# 4. Update Book (PUT):
curl -X PUT "http://127.0.0.1:8000/books/{book_id}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "author": "Updated Author", "publication_year": 2021, "price": 19.99}'

# 5. Partially Update Book (PATCH):
curl -X PATCH "http://127.0.0.1:8000/books/{book_id}" \
  -H "Content-Type: application/json" \
  -d '{"price": 12.50}'

# 6. Delete Book:
curl -X DELETE "http://127.0.0.1:8000/books/{book_id}"