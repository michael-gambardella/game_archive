// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules (CommonJS)
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create an instance of express for our app
const app = express();

// Define the port to run the server on
const port = process.env.PORT || 3001;

// Middleware to parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Middleware to enable CORS (Cross-Origin Resource Sharing)
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({
    origin: allowedOrigin,
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
}));

// Initialize performance metrics storage
const performanceMetrics = {
    requests: 0,
    totalTime: 0,
    slowRequests: 0,
    startTime: Date.now()
};

// Add metrics collection to the monitoring middleware
app.use((req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const time = diff[0] * 1e3 + diff[1] * 1e-6;
        
        performanceMetrics.requests++;
        performanceMetrics.totalTime += time;
        
        if (time > 1000) {
            performanceMetrics.slowRequests++;
        }
    });
    
    next();
});

// Add endpoint to view performance metrics
app.get('/api/performance', (req, res) => {
    const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
    const avgResponseTime = performanceMetrics.requests > 0 
        ? (performanceMetrics.totalTime / performanceMetrics.requests).toFixed(2)
        : 0;

    res.json({
        uptime: `${uptime} seconds`,
        totalRequests: performanceMetrics.requests,
        averageResponseTime: `${avgResponseTime}ms`,
        slowRequests: performanceMetrics.slowRequests
    });
});

// Function to start the server and handle database connection
async function startServer() {
    try {
        // Create a connection to the MySQL database using configuration from environment variables
        const host = process.env.DB_HOST || 'localhost';
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        const connection = await mysql.createConnection({
            host,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
          });          

        console.log('Connected to MySQL Server!');

        // Define a route to fetch data for a single video game by its ID
        app.get('/videogames/:id', async (req, res) => {
            const { id } = req.params;
            try {
                console.log(`Fetching game with ID: ${id}`);
                const [results] = await connection.query('SELECT * FROM videogames WHERE id = ?', [id]);
                if (results.length === 0) {
                    return res.json({ message: 'Game not found' });
                }
                res.json(results[0]);
            } catch (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Database error' });
            }
        });

    // Define a route to fetch all video games optionally filtered by query parameters
    app.get('/videogames', async (req, res) => {
        //console.log('Received request for /videogames with query:', req.query);
    
        const { title, developer, publisher, genre, platform } = req.query;
        let query = 'SELECT * FROM videogames';
        const queryParams = [];
    
        if (title || developer || publisher || genre || platform) {
            query += ' WHERE ';
            const conditions = [];
            if (title) {
                conditions.push('title LIKE ?');
                queryParams.push(`%${title}%`);
            }
            if (developer) {
                conditions.push('developer LIKE ?');
                queryParams.push(`%${developer}%`);
            }
            if (publisher) {
                conditions.push('publisher LIKE ?');
                queryParams.push(`%${publisher}%`);
            }
            if (genre) {
                conditions.push('genre LIKE ?');
                queryParams.push(`%${genre}%`);
            }
            if (platform) {
                conditions.push('platform LIKE ?');
                queryParams.push(`%${platform}%`);
            }
            query += conditions.join(' AND ');
        }
    
        try {
            console.log('Executing query:', query, queryParams);
            const [results] = await connection.query(query, queryParams);
            //console.log('Query results:', results);
    
            res.setHeader('Content-Type', 'application/json');
            res.json(results);
        } catch (err) {
            console.error('Database error during /videogames:', err);
            res.status(500).json({ error: 'Database error' });
        }
    });

        // Define a route to fetch artwork URL for a specific video game by its ID
        app.get('/videogames/:id/artwork', async (req, res) => {
            const { id } = req.params;
            try {
                console.log(`Fetching artwork for game with ID: ${id}`);
                const [results] = await connection.query('SELECT artwork_url FROM videogames WHERE id = ?', [id]);
                if (results.length === 0) {
                    return res.status(404).json({ message: 'Game not found' });
                }
                const artworkUrl = results[0].artwork_url;
                res.json({ artworkUrl });
            } catch (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Database error' });
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

    } catch (err) {
        console.error('Error connecting to MySQL Server:', err);
        process.exit(1); // Exit the process with an error code
    }
}

// Run the server
startServer();