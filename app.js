require('dotenv').config();
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const userAgent = require('user-agents');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT;
const address = process.env.ADDRESS;

const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const kuroshiro = new Kuroshiro();
kuroshiro.init(new KuromojiAnalyzer());

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/rank/words', (req, res) => {
    const quizlet_id = req.query.quizlet_id;
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));

    // Retrieve all history records with the given Quizlet ID
    db.all('SELECT user_id, COUNT(*) AS word_count FROM history WHERE quizlet_id = ? GROUP BY user_id ORDER BY word_count DESC', [quizlet_id], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        } else {
            // Get the usernames for all users in the list
            const userIds = rows.map(row => row.user_id);
            db.all('SELECT id, username FROM users WHERE id IN (' + userIds.map(() => '?').join(',') + ')', userIds, (err, userRows) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal server error');
                } else {
                    // Map the history rows to HTML list items with usernames and word counts
                    const rankList = rows.map((row, index) => {
                        const userRow = userRows.find(user => user.id === row.user_id);
                        const username = userRow ? userRow.username : '[unknown]';
                        return `<li>${username}: ${row.word_count} words</li>`;
                    });

                    // Combine the list items into an ordered list and send the response
                    const html = `<ol id="word">${rankList.join('')}</ol>`;
                    res.send(`<!DOCTYPE html><html><head><link rel="stylesheet" href="rank/style.css"></head><body>${html}</body></html>`);
                }
            });
        }
    });
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
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
        last_login_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
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
        db.run(`INSERT OR IGNORE INTO users (username, password, created_at) VALUES (?, ?, ?)`, [username, hashedPassword, timeNow]);
        console.log("Created new account.");
    } else {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await sleep(5000);
            throw new Error('Incorrect password.');
        } else {
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
            db.run(`UPDATE users SET last_login_at = ? WHERE username = ?`, [timeNow, username]);
            console.log("Updated last login time.");
        }
    }
}

// create global browser instance
let browser;

// initialize global browser instance
(async () => {
    browser = await puppeteer.launch({
        userDataDir: path.join(__dirname, 'userData')
    });
})();

app.get('/get/quizlet', async (req, res) => {
    const allowed_domains = [
        'quizlet.com',
    ];
    const quizlet_id_match = req.query.url.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    const quizlet_id = quizlet_id_match[1];
    const url = `https://quizlet.com/${quizlet_id}`;
    if (url.includes(allowed_domains)) {
        const page = await browser.newPage();
        await page.setUserAgent(userAgent.random().toString());
        await page.goto(url);
        const list = await page.$$eval('.TermText', terms => terms.map(term => term.textContent));
        const title = (await page.title()).replace(' | Quizlet', '');

        let term = [];
        let def = [];
        for (let i = 0; i < list.length; i += 2) {
            term.push(list[i]);
            def.push(list[i + 1]);
        }
        await page.close();
        res.json({term, def, title, quizlet_id});
    } else {
        res.status(400).send('Error: URL not allowed');
    }
});

// close global browser instance when application exits
process.on('exit', () => {
    browser.close();
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

app.post('/post/typed', (req, res) => {
    const { def, term, username, quizlet_id } = req.body;
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
                db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, def TEXT, term TEXT, created_at TEXT)');
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
                db.run('INSERT INTO history (user_id, quizlet_id, def, term, created_at) VALUES (?, ?, ?, ?, ?)', [id, quizlet_id, def, term, timeNow], (err) => {
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

app.get('/get/history', (req, res) => {
    const { username, quizlet_id } = req.query;
    console.log(username, quizlet_id);
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));
    db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, def TEXT, term TEXT, created_at TEXT)');
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

            const { id } = row;
            db.serialize(() => {
                db.all('SELECT * FROM history WHERE user_id = ? AND quizlet_id = ?', [id, quizlet_id], (err, rows) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }

                    res.status(200).json({ history: rows });
                });
            });
        });
    });
});

app.get('/get/furigana', async (req, res) => {
    const { term } = req.query;
    // Check if the term has kanji
    const result = Kuroshiro.Util.hasKanji(term);
    if (result === true) {
        const furigana = await kuroshiro.convert(term, {mode:"furigana", to:"hiragana"});
        console.log(furigana);
        res.json({ furigana });
    }
    else {
        res.json({ furigana: term });
    }
});

// Define a route that returns the ranking of users based on word count
app.get('/rank/words', (req, res) => {
    const quizlet_id = req.query.quizlet_id;
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));

    // Retrieve all history records with the given Quizlet ID
    db.all('SELECT user_id, COUNT(*) AS word_count FROM history WHERE quizlet_id = ? GROUP BY user_id ORDER BY word_count DESC', [quizlet_id], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        } else {
            // Get the usernames for all users in the list
            const userIds = rows.map(row => row.user_id);
            db.all('SELECT id, username FROM users WHERE id IN (' + userIds.map(() => '?').join(',') + ')', userIds, (err, userRows) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal server error');
                } else {
                    // Map the history rows to HTML list items with usernames and word counts
                    const rankList = rows.map((row, index) => {
                        const userRow = userRows.find(user => user.id === row.user_id);
                        const username = userRow ? userRow.username : '[unknown]';
                        return `<li>${username}: ${row.word_count} words</li>`;
                    });
                    if (rankList.length != 0)
                    // Combine the list items into an ordered list and send the response
                    {
                        const html = `<h1>Leaderboard</h1><ol>${rankList.join('')}</ol>`;
                        res.send(html);
                    }
                    else {
                        const html = `<h1>Leaderboard</h1><p>No one has typed any words yet!</p>`;
                        res.send(html);
                    }
                }
            });
        }
    });
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const server = app.listen(port, () => {
    console.log(`Server listening on ${address}:${port}`);
});