require('dotenv').config();
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT;
const address = process.env.ADDRESS;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));

    db.serialize(() => {
        db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
      )
    `);
    });

    try {
        let user = await findUser(db, username);

        await validateCredentials(db, user, username, password);
        return res.json({success: true});
    } catch (err) {
        console.error(err);
        return res.json({success: false, error: 'Invalid credentials.'});
    }
});

async function findUser(db, username) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

async function validateCredentials(db, user, username, password) {
    console.log(password);
    if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const timeNow = new Date().toLocaleString('ja-JP', {
            timeZone: 'Pacific/Auckland',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
        db.run(`INSERT OR IGNORE INTO users (username, password, time) VALUES (?, ?, ?)`, [username, hashedPassword, timeNow]);
        console.log("Created new account.");
    } else {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Incorrect password.');
        }
    }
}


app.get('/get/quizlet', async (req, res) => {
    const allowed_domains = [
        'quizlet.com',
    ];
    if (req.query.url.includes(allowed_domains)) {
        const browser = await puppeteer.launch({
            userDataDir: path.join(__dirname, 'userData')
        });
        const page = await browser.newPage();
        await page.goto(req.query.url);
        const list = await page.$$eval('.TermText', terms => terms.map(term => term.textContent));

        let term = [];
        let def = [];
        for (let i = 0; i < list.length; i += 2) {
            term.push(list[i]);
            def.push(list[i + 1]);
        }
        await browser.close();
        res.json({term, def});
    } else {
        res.status(400).send('Error: URL not allowed');
    }
});

function checkAndCreateDir(dataPath) {
    // Check if directory exists
    if (fs.existsSync(dataPath)) {
        console.log(`Directory already exists at ${dataPath}`);
    } else {
        // Create directory
        fs.mkdirSync(dataPath, { recursive: true });
        console.log(`Created directory at ${dataPath}`);
    }
}

app.post('/submitTyped', (req, res) => {
    const { def, term, username } = req.body;
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));
    db.serialize(() => {
        db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (!row) {
                res.status(400).send('User not found');
                return;
            }

            const {id} = row;
            db.serialize(() => {
                db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER, def TEXT, term TEXT, time TEXT)');
                const timeNow = new Date().toLocaleString('ja-JP', {
                    timeZone: 'Pacific/Auckland',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(/\//g, '-');
                db.run('INSERT INTO history (id, def, term, time) VALUES (?, ?, ?, ?)', [id, def, term, timeNow], (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }

                    res.status(200).json({ message: 'Success' });
                });
            });
        });
    });
});

const server = app.listen(port, () => {
    console.log(`Server listening on ${address}:${port}`);
});