const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// Database initialization
const db = new sqlite3.Database('./library.db');

// Create books table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
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
    )
  `);

  // Insert sample data
  const sampleBooks = [
    ['The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 1925, 'available'],
    ['To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 1960, 'available'],
    ['1984', 'George Orwell', '978-0-452-28423-4', 'Dystopian Fiction', 1949, 'borrowed', 'John Doe', '2024-06-15'],
    ['Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 'Romance', 1813, 'available']
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO books (title, author, isbn, genre, publication_year, status, borrowed_by, borrowed_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleBooks.forEach(book => {
    stmt.run(book);
  });
  stmt.finalize();
});

// API Routes

// 1. GET /api/books - Get all books
app.get('/api/books', (req, res) => {
  const { status, genre, author } = req.query;
  
  let query = 'SELECT * FROM books WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (genre) {
    query += ' AND genre LIKE ?';
    params.push(`%${genre}%`);
  }
  if (author) {
    query += ' AND author LIKE ?';
    params.push(`%${author}%`);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// 2. GET /api/books/:id - Get a specific book
app.get('/api/books/:id', (req, res) => {
  const bookId = req.params.id;

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    if (!row) {
      return res.status(404).json({ 
        error: 'Book not found' 
      });
    }
    res.json({
      success: true,
      data: row
    });
  });
});

// 3. POST /api/books - Add a new book
app.post('/api/books', (req, res) => {
  const { title, author, isbn, genre, publication_year } = req.body;

  // Validation
  if (!title || !author) {
    return res.status(400).json({ 
      error: 'Title and author are required' 
    });
  }

  const query = `
    INSERT INTO books (title, author, isbn, genre, publication_year, status) 
    VALUES (?, ?, ?, ?, ?, 'available')
  `;

  db.run(query, [title, author, isbn, genre, publication_year], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ 
          error: 'A book with this ISBN already exists' 
        });
      }
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }

    // Get the newly created book
    db.get('SELECT * FROM books WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        return res.status(500).json({ 
          error: 'Error retrieving created book' 
        });
      }
      res.status(201).json({
        success: true,
        message: 'Book added successfully',
        data: row
      });
    });
  });
});

// 4. PUT /api/books/:id - Update a book
app.put('/api/books/:id', (req, res) => {
  const bookId = req.params.id;
  const { title, author, isbn, genre, publication_year, status, borrowed_by } = req.body;

  // First check if book exists
  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    if (!row) {
      return res.status(404).json({ 
        error: 'Book not found' 
      });
    }

    const query = `
      UPDATE books SET 
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        isbn = COALESCE(?, isbn),
        genre = COALESCE(?, genre),
        publication_year = COALESCE(?, publication_year),
        status = COALESCE(?, status),
        borrowed_by = CASE 
          WHEN ? = 'available' THEN NULL 
          ELSE COALESCE(?, borrowed_by) 
        END,
        borrowed_date = CASE 
          WHEN ? = 'borrowed' AND borrowed_date IS NULL THEN CURRENT_DATE
          WHEN ? = 'available' THEN NULL
          ELSE borrowed_date
        END
      WHERE id = ?
    `;

    db.run(query, [
      title, author, isbn, genre, publication_year, status, 
      status, borrowed_by, status, status, bookId
    ], function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ 
            error: 'A book with this ISBN already exists' 
          });
        }
        return res.status(500).json({ 
          error: 'Database error', 
          message: err.message 
        });
      }

      // Get the updated book
      db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, updatedRow) => {
        if (err) {
          return res.status(500).json({ 
            error: 'Error retrieving updated book' 
          });
        }
        res.json({
          success: true,
          message: 'Book updated successfully',
          data: updatedRow
        });
      });
    });
  });
});

// 5. DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', (req, res) => {
  const bookId = req.params.id;

  // First check if book exists
  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    if (!row) {
      return res.status(404).json({ 
        error: 'Book not found' 
      });
    }

    db.run('DELETE FROM books WHERE id = ?', [bookId], function(err) {
      if (err) {
        return res.status(500).json({ 
          error: 'Database error', 
          message: err.message 
        });
      }
      res.json({
        success: true,
        message: 'Book deleted successfully',
        data: row
      });
    });
  });
});

// 6. POST /api/books/:id/borrow - Borrow a book
app.post('/api/books/:id/borrow', (req, res) => {
  const bookId = req.params.id;
  const { borrower_name } = req.body;

  if (!borrower_name) {
    return res.status(400).json({ 
      error: 'Borrower name is required' 
    });
  }

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    if (!row) {
      return res.status(404).json({ 
        error: 'Book not found' 
      });
    }
    if (row.status === 'borrowed') {
      return res.status(400).json({ 
        error: 'Book is already borrowed' 
      });
    }

    const query = `
      UPDATE books SET 
        status = 'borrowed', 
        borrowed_by = ?, 
        borrowed_date = CURRENT_DATE 
      WHERE id = ?
    `;

    db.run(query, [borrower_name, bookId], function(err) {
      if (err) {
        return res.status(500).json({ 
          error: 'Database error', 
          message: err.message 
        });
      }

      db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, updatedRow) => {
        if (err) {
          return res.status(500).json({ 
            error: 'Error retrieving updated book' 
          });
        }
        res.json({
          success: true,
          message: 'Book borrowed successfully',
          data: updatedRow
        });
      });
    });
  });
});

// 7. POST /api/books/:id/return - Return a book
app.post('/api/books/:id/return', (req, res) => {
  const bookId = req.params.id;

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        error: 'Database error', 
        message: err.message 
      });
    }
    if (!row) {
      return res.status(404).json({ 
        error: 'Book not found' 
      });
    }
    if (row.status === 'available') {
      return res.status(400).json({ 
        error: 'Book is already available' 
      });
    }

    const query = `
      UPDATE books SET 
        status = 'available', 
        borrowed_by = NULL, 
        borrowed_date = NULL 
      WHERE id = ?
    `;

    db.run(query, [bookId], function(err) {
      if (err) {
        return res.status(500).json({ 
          error: 'Database error', 
          message: err.message 
        });
      }

      db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, updatedRow) => {
        if (err) {
          return res.status(500).json({ 
            error: 'Error retrieving updated book' 
          });
        }
        res.json({
          success: true,
          message: 'Book returned successfully',
          data: updatedRow
        });
      });
    });
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  const docs = {
    title: "Book Library Management API",
    version: "1.0.0",
    description: "A RESTful API for managing a book library with borrowing capabilities",
    base_url: `http://localhost:${PORT}`,
    endpoints: [
      {
        method: "GET",
        path: "/api/books",
        description: "Get all books with optional filtering",
        query_params: {
          status: "Filter by status (available/borrowed)",
          genre: "Filter by genre",
          author: "Filter by author"
        },
        example: "/api/books?status=available&genre=Fiction"
      },
      {
        method: "GET",
        path: "/api/books/:id",
        description: "Get a specific book by ID"
      },
      {
        method: "POST",
        path: "/api/books",
        description: "Add a new book",
        body: {
          title: "string (required)",
          author: "string (required)",
          isbn: "string (optional)",
          genre: "string (optional)",
          publication_year: "number (optional)"
        }
      },
      {
        method: "PUT",
        path: "/api/books/:id",
        description: "Update a book",
        body: {
          title: "string (optional)",
          author: "string (optional)",
          isbn: "string (optional)",
          genre: "string (optional)",
          publication_year: "number (optional)",
          status: "string (optional)"
        }
      },
      {
        method: "DELETE",
        path: "/api/books/:id",
        description: "Delete a book"
      },
      {
        method: "POST",
        path: "/api/books/:id/borrow",
        description: "Borrow a book",
        body: {
          borrower_name: "string (required)"
        }
      },
      {
        method: "POST",
        path: "/api/books/:id/return",
        description: "Return a borrowed book"
      }
    ]
  };
  res.json(docs);
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📚 Book Library API Server running on http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed.');
    }
    process.exit(0);
  });
});