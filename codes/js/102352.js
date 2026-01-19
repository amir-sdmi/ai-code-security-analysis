const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const config = require('./dbconfig');

const app = express();
const port = 4000;

const jwt = require('jsonwebtoken');
const SECRET_KEY = '7N84V';
const bcrypt = require('bcrypt');

app.use(express.json());

const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
    res.send('Find Books: /api/media');
});

let db = new sqlite3.Database(config.DB, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});


// displays media
app.get('/api/media', (req, res) => {
    db.all(`SELECT * FROM media`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ media: rows });
    });
});

// delete a book by ID
app.delete('/api/media/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM media WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: "Book not found" });
            return;
        }

        res.json({ message: "Book deleted successfully!" });
    });
});






const saltRounds = 10;

app.post('/api/register', async (req, res) => {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ error: "Full name, email, and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `INSERT INTO User (full_name, email, password) VALUES (?, ?, ?)`;
        const params = [full_name, email, hashedPassword];

        db.run(query, params, function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "User registered successfully!", userId: this.lastID });
        });
    } catch (err) {
        console.error("Error hashing password:", err.message);
        res.status(500).json({ error: "Failed to register user. Please try again later." });
    }
});


app.get('/api/register', (req, res) => {
    db.all(`SELECT * FROM User`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ users: rows });
    });
});
app.delete('/api/register/:id', (req, res) => {
    const userId = req.params.id;

    db.run(`DELETE FROM User WHERE userid = ?`, [userId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "User deleted successfully" });
    });
});

  // some snippets of this code were found using chatgpt
app.put("/api/register/:userid", (req, res) => {
    const { userid } = req.params;
    const { full_name, email, password } = req.body;
  
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
  
    const sql = `UPDATE User SET full_name = ?, email = ?, password = ? WHERE userid = ?`;
    const params = [full_name, email, password, userid];
  
    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, message: "User updated successfully" });
    });
  });
  


  // some snippets of this code were found using chatgpt
app.post('/api/registerbranchlib', (req, res) => {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ error: "Full name, email, and password are required." });
    }

    const query = `INSERT INTO BranchLibrarian (full_name, email, password) VALUES (?, ?, ?)`;
    const params = [full_name, email, password];

    db.run(query, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "User registered successfully!", userId: this.lastID });
    });
});


app.get('/api/registerbranchlib', (req, res) => {
    db.all(`SELECT * FROM BranchLibrarian`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ users: rows });
    });
});

  // some snippets of this code were found using chatgpt
app.post('/api/addmedia', (req, res) => {
    const { name, genre, publishedate, mediatype } = req.body;

    if (!name || !genre || !publishedate || !mediatype) {
        return res.status(400).json({ error: "User ID, name, genre, publish date, and media type are required." });
    }

    const query = `
        INSERT INTO media (name, genre, publishedate, mediatype)
        VALUES (?, ?, ?, ?)
    `;
    const params = [name, genre, publishedate, mediatype];

    db.run(query, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Media added successfully!",
            mediaId: this.lastID,
        });
    });
});

app.post('/api/adminlogin', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = `SELECT * FROM Admin WHERE email = ? AND password = ?`;
    const params = [email, password];

    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign({ userId: row.userid, email: row.email, role: 'admin' }, SECRET_KEY, {
            expiresIn: '1h',
        });

        res.json({ 
            message: "Login successful!", 
            token, 
            user: { id: row.userid, email: row.email, fullName: row.full_name } 
        });
    });
});



app.post('/api/branchlibrarian', (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = `SELECT * FROM BranchLibrarian WHERE email = ? AND password = ?`;
    const params = [email, password];

    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign({ BranchLibrarianID: row.userid, email: row.email }, SECRET_KEY, {
            expiresIn: '1h', // Token expires in 1 hour
        });

        // respond with token and user details
        res.json({ 
            message: "Login successful!", 
            token, 
            user: { id: row.BranchLibrarianID, email: row.email, fullName: row.full_name } 
        });
    });
});

app.post('/api/branchlibrarian', (req, res) => {
    res.json({ message: "Logout successful!" });
});


app.post('/api/callcentreoperator', (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = `SELECT * FROM CallCentreOperator WHERE email = ? AND password = ?`;
    const params = [email, password];

    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign({ id: row.userid, email: row.email }, SECRET_KEY, {
            expiresIn: '1h', // Token expires in 1 hour
        });

        // respond with token and user details
        res.json({ 
            message: "Login successful!", 
            token, 
            user: { id: row.id, email: row.email, password: row.password } 
        });
    });
});

app.post('/api/callcentreoperator', (req, res) => {
    res.json({ message: "Logout successful!" });
});


app.post('/api/login', (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = `SELECT * FROM User WHERE email = ?`;
    const params = [email];

    db.get(query, params, async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // compare hashed password with the provided password
        const passwordMatch = await bcrypt.compare(password, row.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign({ userId: row.userid, email: row.email, role: 'user' }, SECRET_KEY, {
            expiresIn: '1h',
        });

        res.json({
            message: "Login successful!",
            token,
            user: { id: row.userid, email: row.email, fullName: row.full_name }
        });
    });
});



const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });

        req.user = user;
        next();
    });
};


app.get('/api/user', authenticateToken, (req, res) => {
    const { userId } = req.user;

    const query = `SELECT full_name FROM User WHERE userid = ?`;
    const params = [userId];

    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json({ fullName: row.full_name });
    });
});


app.get('/api/useraccountinfo', authenticateToken, (req, res) => {
    const { userId } = req.user;

    const query = `SELECT full_name, email, password FROM User WHERE userid = ?`;
    const params = [userId];

    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json(row);
    });
});


app.post('/api/logout', (req, res) => {
    res.json({ message: "Logout successful!" });
});


app.post('/api/borrow', authenticateToken, (req, res) => {
    const { userId } = req.user;
    const { id } = req.body;

    const currentDate = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date());

    const updateMediaQuery = `UPDATE media SET userid = ? WHERE id = ? AND userid IS NULL`;
    const params = [userId, id];

    db.run(updateMediaQuery, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(400).json({ error: "Media is already borrowed or doesn't exist." });
        }

        const fetchMediaQuery = `SELECT name, genre, publishedate FROM media WHERE id = ?`;
        db.get(fetchMediaQuery, [id], (err, media) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch media details." });
            }
            if (!media) {
                return res.status(400).json({ error: "Media details not found." });
            }

            const insertHistoryQuery = `
                INSERT INTO borrowinghistory (userid, bookname, genre, publishedate, dateborrowed)
                VALUES (?, ?, ?, ?, ?)
            `;
            const historyParams = [userId, media.name, media.genre, media.publishedate, currentDate];

            db.run(insertHistoryQuery, historyParams, function (err) {
                if (err) {
                    return res.status(500).json({ error: "Failed to update borrowing history." });
                }
                res.status(200).json({ message: "Media borrowed successfully and history updated!" });
            });
        });
    });
});




app.get('/api/borrowed-books', authenticateToken, (req, res) => {
    const { userId } = req.user; 

    const query = `SELECT * FROM media WHERE userid = ?`;
    const params = [userId];

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "No borrowed books found." });
        }

        res.status(200).json({ borrowedBooks: rows });
    });
});

  // some snippets of this code were found using chatgpt
app.post('/api/return', authenticateToken, (req, res) => {
    const { userId } = req.user;
    const { id } = req.body;

    const query = `UPDATE media SET userid = NULL WHERE id = ? AND userid = ?`;
    const params = [id, userId];

    db.run(query, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(400).json({ error: "Book not found or not borrowed by this user." });
        }
        res.status(200).json({ message: "Book returned successfully!" });
    });
});




app.get('/api/borrow/history', authenticateToken, (req, res) => {
    const { userId } = req.user;

    const query = `
        SELECT borrowinghistoryid, bookname, genre, publishedate, dateborrowed
        FROM borrowinghistory
        WHERE userid = ?
        ORDER BY dateborrowed DESC
    `;
    const params = [userId];

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch borrowing history." });
        }
        res.status(200).json({ history: rows });
    });
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});
