require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const handlebars = require('handlebars');
const app = express();
const port = process.env.APP_LISTEN_PORT;
const address = process.env.APP_LISTEN_IP_ADDRRESS;
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const kuroshiro = new Kuroshiro();
kuroshiro.init(new KuromojiAnalyzer());

const dataPath = path.join(__dirname, 'data');
const db = new sqlite3.Database(path.join(dataPath, 'database.db'));

app.use(express.json(), (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'main', 'index.html'));
});

app.post('/login', async (req, res) => {
    let { username, password } = req.body;
    username = username.trim();
    console.log(username, password);
    checkAndCreateDir();

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

app.get('/get/quizlet', async (req, res) => {
    const allowed_domains = [
        'quizlet.com',
    ];

    if (!req.query.url.includes(allowed_domains)) {
        return res.status(400).send('Invalid URL');
    }

    const quizlet_id_match = req.query.url.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    const quizlet_id = quizlet_id_match[1];

    let title = null;

    try {
        checkAndCreateDir();
        const terms = await quizlet(quizlet_id);
        let term = [];
        let def = [];
        for (let { cardSides: [{ media: [{ plainText: termText }] }, { media: [{ plainText: defText }] }] } of terms) {
            term.push(termText);
            def.push(defText);
            console.log(termText, defText);
        }

        const { quizlet_title, termLang, defLang } = await getQuizletDetails(quizlet_id);

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS quizlet
            (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quizlet_id TEXT,
                quizlet_title TEXT,
                quizlet_def_language TEXT,
                quizlet_term_language TEXT,
                UNIQUE(quizlet_id)
            )`);
            db.get('SELECT * FROM quizlet WHERE quizlet_id = ?', [quizlet_id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal server error');
                } else {
                    if (!row) {
                        db.run('INSERT INTO quizlet (quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language) VALUES (?, ?, ?, ?)', [quizlet_id, quizlet_title, defLang, termLang], (err) => {
                            if (err) {
                                console.error(err.message);
                                res.status(500).send('Internal server error');
                            } else {
                                res.json({term, def, title, quizlet_id});
                            }
                        });
                    } else {
                        db.run('UPDATE quizlet SET quizlet_title = ?, quizlet_def_language = ?, quizlet_term_language = ? WHERE quizlet_id = ?', [quizlet_title, defLang, termLang, quizlet_id], (err) => {
                            if (err) {
                                console.error(err.message);
                                res.status(500).send('Internal server error');
                            } else {
                                res.json({term, def, quizlet_title, quizlet_id});
                            }
                        });
                    }
                }
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error retrieving Quizlet data');
    }
});

function checkAndCreateDir() {
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
    checkAndCreateDir();
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

app.get('/get/history', async (req, res) => {
    const { username, quizlet_id } = req.query;
    console.log(username, quizlet_id);
    checkAndCreateDir();
    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, def TEXT, term TEXT, created_at TEXT)');
    });
    await db.serialize(() => {
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

app.get('/leaderboard', async (req, res) => {
    const quizlet_id = req.query.quizlet_id;
    checkAndCreateDir();
    try {
        const [result] = await queryDb(db, 'SELECT quizlet_title FROM quizlet WHERE quizlet_id = ?', [quizlet_id]);
        const quizlet_title = result.quizlet_title;
        const rows = await queryDb(db, 'SELECT user_id, COUNT(*) AS word_count FROM history WHERE quizlet_id = ? GROUP BY user_id ORDER BY word_count DESC', [quizlet_id]);

        const userIds = rows.map(row => row.user_id);
        const userRows = await queryDb(db, `SELECT id, username FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, userIds);
        const topRows = rows.slice(0, 10);
        const topUsernames = topRows.map(row => userRows.find(user => user.id === row.user_id).username);
        const topWordCounts = topRows.map(row => row.word_count);
        const rankList = topRows.map((row, index) => ({
            username: topUsernames[index],
            word_count: row.word_count,
            profile_url: `/profile?user=${topUsernames[index]}`
        }));

        const labels = JSON.stringify(topUsernames);
        const data = JSON.stringify(topWordCounts);

        const templatePath = path.join(__dirname, 'public', 'html', 'leaderboard', 'index.html')
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);
        const html = template({
            quizlet_title,
            quizlet_id,
            rankList,
            labels,
            data,
        });
        console.log(quizlet_title);
        console.log(rankList);
        console.log(labels);
        console.log(data);
        res.header('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error(err.message);
        let html = `<!DOCTYPE html><html><head><title>Leaderboard - ${quizlet_id}</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><link rel="icon" type="image/x-icon" href="/Files/favicon.ico" /><link rel="stylesheet" type="text/css" href="/css/lb/style.css" /></head><body>`;
        html += `<h1>Leaderboard - ${quizlet_id}</h1><p>No one has typed any words yet!</p>`;
        console.log("Sending ", html);
        res.header('Content-Type', 'text/html');
        res.send(`${html}</body></html>`);
    } finally {
        db.close();
    }
});

app.get('/profile', async (req, res) => {
    const username = req.query.user;
    checkAndCreateDir();
    try {
        const result = await getDataProfile(username, db);

        if (result.length !== 0) {
            const count_per_day = await getWordCountPerDay(username, db);
            const labelsLine = JSON.stringify(count_per_day.map(item => item.day));
            console.log(labelsLine);
            const dataLine = count_per_day.map(item => item.count_on_the_day);

            const labels = JSON.stringify(result.labels);
            const data = JSON.stringify(result.data);

            const minValue = Math.min(...result.data);
            const maxValue = Math.max(...result.data);

            const gradient = value => {
                if (maxValue === minValue) {
                    const hue = (200 - 0.5 * 200).toString(10);
                    return `hsl(${hue}, 70%, 60%)`;
                } else {
                    const position = (value - minValue) / (maxValue - minValue);
                    const hue = (200 - position * 200).toString(10);
                    return `hsl(${hue}, 70%, 60%)`;
                }
            };

            const colors = JSON.stringify(result.data.map(value => gradient(value)));
            const background = JSON.stringify(result.data.map(() => '#22587d'));

            const playtimeMS = await getPlaytime(username, db);

            let playtime;
            await formatDuration(playtimeMS)
                .then((formattedTime) => {
                    playtime = formattedTime;
                })
                .catch((error) => {
                    console.error(error);
                });
            console.log(playtime);
            const templatePath = path.join(path.join(__dirname, 'public', 'html', 'profile', 'index.html'))
            const templateSource = fs.readFileSync(templatePath, 'utf8');
            const template = handlebars.compile(templateSource);
            const html = template({
                username,
                labelsLine,
                dataLine,
                labels,
                data,
                colors,
                background,
                playtime,
            });
            res.header('Content-Type', 'text/html');
            res.send(html);
        }
    } catch (err) {
        let html = `<!DOCTYPE html><html><head><title>Profile - ${username}</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><link rel="icon" type="image/x-icon" href="/image/facicon/favicon.ico" /><link rel="stylesheet" type="text/css" href="/css/profile/style.css" /></head><body>`;
        html += `<h1>${username}'s profile</h1>`;
        html += `<p>${username} has not typed any words yet.</p>`;
        res.send(html);
    }
});

async function getPlaytime(username, db) {
    const user = (await queryDb(db, `SELECT id FROM users WHERE username = ?`, [username]))[0];
    if (!user) return 0;
    const row = (await queryDb(db, `SELECT playtime FROM playtime WHERE user_id = ?`, [user.id]))[0];
    if (!row) return 0;
    return row.playtime;
}

async function getWordCountPerDay(username, db) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT DATE(history.created_at) AS day, COUNT(*) AS word_count
      FROM history JOIN users
      ON history.user_id = users.id
      WHERE users.username = ?
      GROUP BY day;`, [username], (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                const wordCountPerDay = rows.map(row => ({ day: row.day, count_on_the_day: row.word_count }));
                resolve(wordCountPerDay);
            }
        });
    });
}

async function getDataProfile(username, db) {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else if (row.count === 0) {
                const err = new Error(`User ${username} does not exist.`);
                console.error(err.message);
                reject(err);
            } else {
                db.all('SELECT quizlet.quizlet_id, quizlet.quizlet_title, COUNT(*) AS word_count FROM history JOIN quizlet ON history.quizlet_id = quizlet.quizlet_id JOIN users ON history.user_id = users.id WHERE users.username = ? GROUP BY quizlet.quizlet_id, quizlet.quizlet_title', [username], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        const sortedRows = rows.sort((a, b) => b.word_count - a.word_count);
                        const labels = sortedRows.map(row => `${row.quizlet_title} - ${row.quizlet_id}`);
                        const data = sortedRows.map(row => row.word_count);
                        const result = {labels, data};
                        resolve(result);
                    }
                });
            }
        });
    });
}

app.post('/post/playtime', async (req, res) => {
    const { username, playtime } = req.body;

    console.log(username);
    console.log(playtime);

    try {
        await queryDb(db, `
      CREATE TABLE IF NOT EXISTS playtime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 0,
        playtime INTEGER NOT NULL DEFAULT 0
      )
    `);

        const user = await queryDb(db, `SELECT id FROM users WHERE username = ?`, [username]);

        if (!user || user.length === 0) {
            res.status(404).send('User not found');
            return;
        }

        const row = await queryDb(db, `SELECT playtime FROM playtime WHERE user_id = ?`, [user[0].id]);

        if (row && row.length > 0) {
            const existingPlaytime = row[0].playtime;
            const updatedPlaytime = existingPlaytime + playtime;
            await queryDb(db, `UPDATE playtime SET playtime = ? WHERE user_id = ?`, [updatedPlaytime, user[0].id]);
            res.send(`Playtime updated for ${username}`);
        } else {
            await queryDb(db, `INSERT INTO playtime (user_id, playtime) VALUES (?, ?)`, [user[0].id, playtime]);
            res.send(`Playtime inserted for ${username}`);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
    }
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function quizlet(id){
    let res = await fetch(`https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=${id}&filters%5BstudiableContainerType%5D=1&perPage=5&page=1`).then(res => res.json())
    let currentLength = 5;
    let token = res.responses[0].paging.token
    let terms = res.responses[0].models.studiableItem;
    let page = 2;
    //console.log({token, terms})
    while (currentLength >= 5){
        let res = await fetch(`https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=${id}&filters%5BstudiableContainerType%5D=1&perPage=5&page=${page++}&pagingToken=${token}`).then(res => res.json());
        terms.push(...res.responses[0].models.studiableItem);
        currentLength = res.responses[0].models.studiableItem.length;
        token = res.responses[0].paging.token;
    }
    return terms;
}

async function getQuizletDetails(id) {
    const response = await fetch(`https://quizlet.com/webapi/3.4/sets/${id}`).then(res => res.json());
    const set = response.responses[0].models.set[0];
    return {
        quizlet_title: set.title,
        termLang: set.wordLang,
        defLang: set.defLang
    };
}

async function queryDb(db, sql, params) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function formatDuration(durationInMs) {
    const seconds = Math.floor(durationInMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const parts = [];
    if (hours > 0) {
        parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    }
    if (remainingSeconds > 0 || parts.length === 0) {
        parts.push(`${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`);
    }
    return parts.join(' ');
}


app.listen(port, address, () => {
    console.log(`Server listening on http://${address}:${port}`);
});
