# 📚 Book Library Management API

A complete RESTful API for managing a book library with borrowing capabilities, built with Node.js, Express, and SQLite.

## 🌟 Features

- **Complete CRUD Operations** for books
- **Book Borrowing System** with borrower tracking
- **Advanced Filtering** by status, genre, and author
- **Beautiful Web Interface** for easy interaction
- **SQLite Database** for data persistence
- **Comprehensive API Documentation**
- **Error Handling** and validation
- **Sample Data** included for testing

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone or download the project files**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the server:**
   ```bash
   npm start
   ```
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - **Frontend Interface:** http://localhost:3000
   - **API Documentation:** http://localhost:3000/api/docs
   - **API Base URL:** http://localhost:3000/api

## 📁 Project Structure

```
book-library-api/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── library.db             # SQLite database (auto-created)
├── public/
│   └── index.html         # Frontend interface
└── README.md              # This file
```

## 🔗 API Endpoints

### 1. **GET /api/books** - Get All Books
Retrieve all books with optional filtering.

**Query Parameters:**
- `status` - Filter by status (`available` or `borrowed`)
- `genre` - Filter by genre (partial match)
- `author` - Filter by author (partial match)

**Example Request:**
```bash
curl "http://localhost:3000/api/books?status=available&genre=Fiction"
```

**Example Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "genre": "Fiction",
      "publication_year": 1925,
      "status": "available",
      "borrowed_by": null,
      "borrowed_date": null,
      "created_at": "2024-06-22 10:30:00"
    }
  ]
}
```

### 2. **GET /api/books/:id** - Get Specific Book
Retrieve details of a specific book by ID.

**Example Request:**
```bash
curl http://localhost:3000/api/books/1
```

### 3. **POST /api/books** - Add New Book
Create a new book in the library.

**Required Fields:** `title`, `author`
**Optional Fields:** `isbn`, `genre`, `publication_year`

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Catcher in the Rye",
    "author": "J.D. Salinger",
    "isbn": "978-0-316-76948-0",
    "genre": "Fiction",
    "publication_year": 1951
  }'
```

### 4. **PUT /api/books/:id** - Update Book
Update an existing book's information.

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "genre": "Updated Genre"
  }'
```

### 5. **DELETE /api/books/:id** - Delete Book
Remove a book from the library.

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/books/1
```

### 6. **POST /api/books/:id/borrow** - Borrow Book
Mark a book as borrowed by a specific person.

**Required Field:** `borrower_name`

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/books/1/borrow \
  -H "Content-Type: application/json" \
  -d '{"borrower_name": "John Doe"}'
```

### 7. **POST /api/books/:id/return** - Return Book
Mark a borrowed book as returned and available.

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/books/1/return
```

## 🗄️ Database Schema

The application uses SQLite with the following schema:

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  genre TEXT,
  publication_year INTEGER,
  status TEXT DEFAULT 'available',
  borrowed_by TEXT,
  borrowed_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Frontend Features

The web interface provides:

- **Dashboard** with library statistics
- **Add Book Form** for creating new entries
- **Book Grid** with search and filtering
- **Interactive Actions** (borrow, return, edit, delete)
- **Responsive Design** that works on all devices
- **Real-time Updates** after each action

## 🧪 Testing the API

### Using curl (Command Line)

**Get all books:**
```bash
curl http://localhost:3000/api/books
```

**Add a new book:**
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Book", "author": "Test Author"}'
```

**Borrow a book:**
```bash
curl -X POST http://localhost:3000/api/books/1/borrow \
  -H "Content-Type: application/json" \
  -d '{"borrower_name": "Test User"}'
```

### Using the Web Interface

1. Open http://localhost:3000 in your browser
2. Use the forms and buttons to interact with the API
3. View real-time statistics and updates

### Using Postman

Import the following endpoints into Postman:
- GET: http://localhost:3000/api/books
- POST: http://localhost:3000/api/books
- PUT: http://localhost:3000/api/books/1
- DELETE: http://localhost:3000/api/books/1
- POST: http://localhost:3000/api/books/1/borrow
- POST: http://localhost:3000/api/books/1/return

## 🔧 Configuration

### Environment Variables

You can customize the server by setting these environment variables:

```bash
PORT=3000                    # Server port (default: 3000)
DB_PATH=./library.db         # Database file path
```

### Sample Data

The application automatically creates sample books on first run:
- The Great Gatsby by F. Scott Fitzgerald
- To Kill a Mockingbird by Harper Lee
- 1984 by George Orwell (borrowed)
- Pride and Prejudice by Jane Austen

## 🚀 Deployment

### Local Deployment
```bash
npm start
```

### Production Deployment
1. Set NODE_ENV=production
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "library-api"
   ```

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Styling:** Custom CSS with modern design
- **Additional:** CORS, Error handling middleware

## 📝 API Response Format

All API responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## 🔒 Error Handling

The API handles various error scenarios:
- **400 Bad Request:** Invalid input data
- **404 Not Found:** Resource doesn't exist
- **500 Internal Server Error:** Database or server errors
- **Validation Errors:** Missing required fields
- **Constraint Violations:** Duplicate ISBN, etc.

## 🎯 Assignment Requirements Met

✅ **Custom API:** 7 different endpoints with full CRUD functionality  
✅ **Database Integration:** SQLite with complete data persistence  
✅ **Frontend:** Beautiful, responsive web interface  
✅ **API Documentation:** Comprehensive documentation with examples  
✅ **Testing:** Multiple testing methods provided  
✅ **GitHub Ready:** Complete project structure with clear README  

## 🚀 Future Enhancements

Potential improvements you could add:
- User authentication and authorization
- Book categories and tags
- Advanced search with full-text search
- Book cover image uploads
- Due date tracking and overdue notifications
- Email notifications for borrowing/returning
- Export data to CSV/PDF reports
- REST API rate limiting
- Database migrations system

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

---

**Happy Coding! 🎉**

For any questions or issues, please check the API documentation at http://localhost:3000/api/docs when the server is running.
