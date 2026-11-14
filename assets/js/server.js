const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// 1. Initialize local SQLite database
const db = new sqlite3.Database('./messages.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to local SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// 2. Setup Email Transporter (using Gmail with an App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yeyintlwin30@gmail.com',        // Replace with your Gmail address
        pass: 'hlqfqwouovhyqpan'     // Replace with your Gmail App Password
    }
});

// 3. Form Submission Endpoint
app.post('/send', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Save submission to database
    const stmt = db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)');
    stmt.run(name, email, message, function (err) {
        if (err) {
            console.error('Database Error:', err.message);
            return res.status(500).json({ error: 'Failed to save message.' });
        }

        // Email 1: Send notification to you (Site Owner)
        const ownerMailOptions = {
            from: 'yeyintlwin30@gmail.com',
            to: 'camlotmail@gmail.com',     // Your personal receiving email address
            subject: `New Contact Form Submission from ${name}`,
            text: `You received a new message:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        transporter.sendMail(ownerMailOptions, (error, info) => {
            if (error) {
                console.error('Owner Email Error:', error);
            } else {
                console.log('Notification email sent to owner.');
            }
        });

        // Email 2: Send auto-reply to the visitor (Recipient)
        const visitorMailOptions = {
            from: 'yeyintlwin30@gmail.com',
            to: email,                     // The email entered into the contact form
            subject: 'Thank you for reaching out!',
            text: `Hi ${name},\n\nThank you for getting in touch. We have received your message and will respond shortly.\n\nBest regards,\nYour Team`
        };

        transporter.sendMail(visitorMailOptions, (error, info) => {
            if (error) {
                console.error('Visitor Auto-reply Error:', error);
            } else {
                console.log('Auto-reply email sent to visitor.');
            }
        });

        res.status(200).json({ success: true, message: 'Message saved and emails triggered!' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});