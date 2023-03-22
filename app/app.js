require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.APP_LISTEN_PORT;
const address = process.env.APP_LISTEN_IP_ADDRRESS;
const Chart = require('chart.js');
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
        const dataPath = path.join(__dirname, 'data');
        checkAndCreateDir(dataPath);
        const terms = await quizlet(quizlet_id);
        let term = [];
        let def = [];
        for (let { cardSides: [{ media: [{ plainText: termText }] }, { media: [{ plainText: defText }] }] } of terms) {
            term.push(termText);
            def.push(defText);
            console.log(termText, defText);
        }

        const { quizlet_title, termLang, defLang } = await getQuizletDetails(quizlet_id);

        const db = new sqlite3.Database(path.join(dataPath, 'database.db'));
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

app.get('/get/history', async (req, res) => {
    const { username, quizlet_id } = req.query;
    console.log(username, quizlet_id);
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));
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

app.get('/leaderboard', (req, res) => {
    const quizlet_id = req.query.quizlet_id;
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));

    // Retrieve the title from the quizlet table
    db.get('SELECT quizlet_title FROM quizlet WHERE quizlet_id = ?', [quizlet_id], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        } else {
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
                            // Get the top 10 users and their word counts
                            const topRows = rows.slice(0, 10);
                            const topUsernames = topRows.map(row => {
                                const userRow = userRows.find(user => user.id === row.user_id);
                                return userRow.username;
                            });
                            const topWordCounts = topRows.map(row => row.word_count);

                            // Map the history rows to HTML list items with usernames and word counts
                            const rankList = topRows.map((row, index) => {
                                const username = topUsernames[index];
                                return `<li><a href="/profile?user=${username}">${username}</a>: ${row.word_count} words</li>`;
                            });

                            let html = `<!DOCTYPE html><html><head><title>Leaderboard - ${row.quizlet_title}</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><link rel="icon" type="image/x-icon" href="/Files/favicon.ico" /><link rel="stylesheet" type="text/css" href="/lb/style.css" /></head><body>`;

                            if (rankList.length != 0) {
                                // Combine the list items into an ordered list
                                html += `<h1>Leaderboard - <a href="https://quizlet.com/${quizlet_id}">${row.quizlet_title}</a></h1><ol>${rankList.join('')}</ol>`;
                                res.header('Content-Type', 'text/html');
                                res.write(html);

                                const labels = topUsernames;
                                const data = topWordCounts;
                                const chartCanvas = `<canvas id="bar-chart" width="1000" height="400"></canvas>`;
                                const chartScript = `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script><script>new Chart(document.getElementById('bar-chart'), { type: 'bar', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Word Count', data: ${JSON.stringify(data)} }] }, options: { responsive: false } });</script>`;
                                res.write(chartCanvas);
                                res.write(chartScript);
                                res.write(`</body></html>`);
                                console.log("Sending ", html);
                                res.end();
                            } else {
                                html += `<h1>Leaderboard</h1><p>No one has typed any words yet!</p>`;
                                console.log("Sending ", html);
                                res.header('Content-Type', 'text/html');
                                res.send(`${html}</body></html>`);
                            }
                        }
                    });
                }
            });
        }
    });
});

app.get('/profile', async (req, res) => {
    const username = req.query.user;
    const dataPath = path.join(__dirname, 'data');
    checkAndCreateDir(dataPath);
    const db = new sqlite3.Database(path.join(dataPath, 'database.db'));

    try {
        const result = await getDataProfile(username, db);

        const count_per_day = await getWordCountPerDay(username, db);

        console.log(username);

        if (result.length != 0) {

            const labels = result.labels;
            const data = result.data;

            const minValue = Math.min(...data);
            const maxValue = Math.max(...data);
            const gradient = (value) => {
                if (maxValue === minValue) {
                    // Use the first color that would be generated if there were more data points
                    const hue = (200 - 0.5 * 200).toString(10);
                    return `hsl(${hue}, 70%, 60%)`;
                } else {
                    // Calculate a value between 0 and 1 based on the position of the value between the min and max values
                    const position = (value - minValue) / (maxValue - minValue);
                    // Calculate a hue value between 200 (dark blue) and 0 (light pink)
                    const hue = (200 - position * 200).toString(10);
                    // Return a hsl color with 70% saturation and 60% lightness
                    return `hsl(${hue}, 70%, 60%)`;
                }
            };

            const colors = data.map(value => gradient(value));
            const barCanvas = `<canvas id="bar-chart" width="1000" height="400"></canvas>`;
            const barScript = `<script>new Chart(document.getElementById('bar-chart'), { type: 'bar', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Word Count', data: ${JSON.stringify(data)}, backgroundColor: ${JSON.stringify(data.map(() => '#22587d'))} }] }, options: { responsive: false } });</script>`;
            const circleCanvas = `<canvas id="circle-chart" width="400" height="400"></canvas>`;
            const circleScript = `<script>new Chart(document.getElementById('circle-chart'), { type: 'doughnut', data: { labels: ${JSON.stringify(labels)}, datasets: [{ label: 'Word Count', data: ${JSON.stringify(data)}, backgroundColor: ${JSON.stringify(colors)} }] }, options: { responsive: false } });</script>`;

            const labelsLine = count_per_day.map((item) => item.day);
            const dataLine = count_per_day.map((item) => item.count_on_the_day);

            console.log(labelsLine);
            console.log(dataLine);

            const lineCanvas = `<canvas id="line-chart" width="1000" height="400"></canvas>`;
            const lineScript = `<script>new Chart(document.getElementById('line-chart'), { type: 'line', data: { labels: ${JSON.stringify(labelsLine)}, datasets: [{ label: 'Word Count', data: ${JSON.stringify(dataLine)}, backgroundColor: '#22587d' }] }, options: { responsive: false, scales: { y: { beginAtZero: true } } } });</script>`;
            res.send(`<!DOCTYPE html><html><head><title>Profile - ${username}</title><link rel="icon" type="image/x-icon" href="/Files/favicon.ico" /><link rel="stylesheet" type="text/css" href="/profiles/style.css" /></head><body><h1>${username}'s profile</h1><div id="line">${lineCanvas}</div><div id="bar">${barCanvas}</div><div id="circle">${circleCanvas}</div><script src="https://cdn.jsdelivr.net/npm/chart.js"></script>${lineScript}${barScript}${circleScript}</body></html>`);
        } else {
            let html = `<!DOCTYPE html><html><head><title>Profile - ${username}</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><link rel="icon" type="image/x-icon" href="/Files/favicon.ico" /><link rel="stylesheet" type="text/css" href="/profiles/style.css" /></head><body>`;
            html += `<h1>${username}'s profile</h1>`;
            html += `<p>${username} has not typed any words yet.</p>`;
            res.send(html);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

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
        db.all('SELECT quizlet.quizlet_id, quizlet.quizlet_title, COUNT(*) AS word_count FROM history JOIN quizlet ON history.quizlet_id = quizlet.quizlet_id JOIN users ON history.user_id = users.id WHERE users.username = ? GROUP BY quizlet.quizlet_id, quizlet.quizlet_title', [username], (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            } else {
                const sortedRows = rows.sort((a, b) => b.word_count - a.word_count);
                const labels = sortedRows.map(row => `${row.quizlet_title} - ${row.quizlet_id}`);
                const data = sortedRows.map(row => row.word_count);
                const result = { labels, data };
                resolve(result);
            }
        });
    });
}

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

app.listen(port, address, () => {
    console.log(`Server listening on http://${address}:${port}`);
});
