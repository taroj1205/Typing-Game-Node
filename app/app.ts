require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcrypt');
const handlebars = require('handlebars');
const winston = require('winston');
const moment = require('moment-timezone');
const StackTrace = require('stacktrace-js');
const uuid = require('uuid');
const app = express();
const port = Number(process.env.APP_LISTEN_PORT || 3000);
const address = process.env.APP_LISTEN_IP_ADDRESS || '0.0.0.0';
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const kuroshiro = new Kuroshiro();
kuroshiro.init(new KuromojiAnalyzer());

const dataPath = path.join(__dirname, 'data');
const db = new sqlite3.Database(path.join(dataPath, 'database.db'));
const logsDir = path.join(__dirname, 'logs');
let currentDateLogsDir = path.join(logsDir, moment().tz('Pacific/Auckland').format('YYYY-MM-DD'));

app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.use((req: Request, res: Response, next: NextFunction) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

app.get('/', (req: Request, res: Response) => {
	logMessage('Sending index.html...', 'info');
	try {
		res.sendFile(path.join(__dirname, 'public', 'html', 'main', 'index.html'));
	} catch (error: any) {
		logMessage(error.message, 'error');
	}
});

/**
 * Returns a formatted timestamp in the format of 'yyyy-mm-ddThh:mm:ss' for the Pacific/Auckland timezone.
 * @returns {string} The formatted timestamp.
 */
function getTimestamp(): string {
	// get the current date and time
	const now = new Date();
	// set options for formatting the date and time
	const options: Intl.DateTimeFormatOptions = {
		timeZone: 'Pacific/Auckland',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	};
	// format the date and time using the specified options
	const formattedDate = now.toLocaleString('ja-JP', options);
	// replace the forward slashes with dashes to match the desired format
	const timestamp = formattedDate.replace(/\//g, '-');
	// return the formatted timestamp
	return timestamp;
}


interface AuthToken {
	authToken: string;
	expirationDate?: Date;
}

/**
 * Generates a unique authentication token for the given user and saves it to the database.
 * @param {string} username - The username of the user.
 * @returns {Promise<AuthToken>} - An object containing the generated authentication token and its expiration date.
 */
async function generateAuthToken(username: string): Promise<AuthToken> {
	logMessage('Generating auth token...', 'info');
	// Get the current timestamp
	const timeNow = getTimestamp();

	// Set the time zone
	const timeZone = 'Pacific/Auckland';

	// Set the expiration date to 7 days from now
	const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	// Set the options for formatting the date string
	const options: Intl.DateTimeFormatOptions = {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	};

	// Generate a random authentication token
	const uniqueAuthToken = await getUniqueAuthToken();

	console.log("Generated unique auth token!");

	const authToken = uniqueAuthToken?.authToken;
	const expirationDate = uniqueAuthToken?.expirationDate ? new Date(uniqueAuthToken.expirationDate) : date;

	// Check that the authToken exists before hashing it
	if (!authToken) {
		throw new Error('Could not generate auth token.');
	}

	// Log the current timestamp
	console.log(timeNow); // Output: "2023-03-29 08:15:30"

	// Log the generated authentication token
	console.log(authToken);

	// Hash the authentication token
	const hashedAuthToken = await bcrypt.hash(authToken, 10);

	// Save the hashed authentication token and expiration date to the database
	await queryDb(`UPDATE users
                       SET auth_token            = ?,
                           auth_token_expiration = ?,
                           last_login_at         = ?
                       WHERE username = ?`, [hashedAuthToken, expirationDate, timeNow, username]);

	// Log a message indicating that the authentication token has been generated
	console.log("Generated auth token.");
	logMessage('Generating auth token...', 'info');

	// Return the authentication token and its expiration date
	return {
		authToken: authToken,
		expirationDate: expirationDate
	};
}

async function getUniqueAuthToken(): Promise<AuthToken | undefined> {
	while (true) {
		const authToken = uuid.v4();
		const existingUser = await queryDb(`
      SELECT auth_token, auth_token_expiration
      FROM users
      WHERE auth_token = ?
    `, [authToken]) as AuthToken[];

		if (existingUser && existingUser.length === 0) {
			const expirationDate = new Date();
			console.log(expirationDate);
			expirationDate.setDate(expirationDate.getDate() + 7);

			return {
				authToken: authToken,
				expirationDate: expirationDate
			};
		}
	}
}

/**
 * Authenticates a user with a given token.
 *
 * @param {string} token - The authentication token.
 * @returns {string|null} The authenticated username, or null if authentication failed.
 */
async function authenticateUser(token: string): Promise<string | null> {
	try {
		// Get all rows from the users table and log them for debugging.
		const rows: { auth_token: string, username: string }[] = await queryDb(`SELECT auth_token, username FROM users`, []) as { auth_token: string, username: string }[];
		console.log('All users:', rows);

		// Find a user with a matching token and extract their username.
		let username: string | null = null;
		for (const row of rows) {
			const match = await bcrypt.compare(token, row.auth_token);
			if (match) {
				username = row.username;
				break;
			}
		}

		// Throw an error if no user was found.
		if (!username) {
			throw new Error('Invalid token');
		}

		// Update the user's last login time to the current time.
		const timeNow: string = getTimestamp();
		console.log('Current timestamp:', timeNow);
		await queryDb(`UPDATE users
                             SET last_login_at = ?
                             WHERE username = ?`, [timeNow, username]);

		// Log a success message and return the authenticated username.
		console.log(`User ${username} authenticated successfully.`);
		return username;
	} catch (err: any) {
		// Log an error message and return null if authentication failed.
		console.log('Authentication failed:', err.message);
		return null;
	}
}


app.post('/auth', async (req, res) => {
	const token = req.body.auth_token;
	console.log(token);
	const username = await authenticateUser(token);
	console.log(username);
	if (username) {
		res.json({
			success: true,
			message: 'Authentication successful',
			username: username
		});
	} else {
		res.status(401).json({
			success: false,
			message: 'Authentication failed'
		});
	}
});

app.post('/login', async (req, res) => {
	let {
		username,
		password
	} = req.body;
	username = username.trim();
	console.log(`Username: ${username}, Password: ${password}`);
	checkAndCreateDir();

	await db.serialize(() => {
		db.run(`
			CREATE TABLE IF NOT EXISTS users
			(
				id                    INTEGER PRIMARY KEY,
				username              TEXT      NOT NULL,
				password              TEXT      NOT NULL,
				created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				auth_token            TEXT               DEFAULT NULL,
				auth_token_expiration TEXT               DEFAULT NULL,
				last_login_at         TEXT               DEFAULT NULL
			);
		`);
		logMessage('Creating users table...', 'info');
	});

	try {
		let user = await findUser(username) as User;

		console.log(`User found: ${username}`);

		await validateCredentials(user, username, password);

		console.log("Valid Credentials!");

		// Generate an authentication token and send it to the client in a cookie
		const {
			authToken,
			expirationDate
		} = await generateAuthToken(username);

		console.log("Generated auth token and expiration date!");

		return res.json({
			success: true,
			auth_token: authToken,
			expires_at: expirationDate
		});
	} catch (err) {
		console.error(err);
		return res.json({
			success: false,
			error: 'Invalid credentials.'
		});
	}
});

app.get('/account', (req, res) => {
	// Read the HTML file
	fs.readFile(__dirname + '/public/html/account/index.html', 'utf8', (err: any, data: any) => {
		if (err) {
			console.error(err);
			res.status(500).send('Internal server error');
			return;
		}

		// Compile the Handlebars template
		const template = handlebars.compile(data);

		// Render the template with the username
		const html = template({ username: req.query.user });

		// Send the modified HTML file
		res.send(html);
	});
});

app.post('/change-password', (req, res) => {
	const { username, currentPassword, newPassword } = req.body;

	db.get('SELECT * FROM users WHERE username = ?', [username], (error: any, row: any) => {
		if (error || !row) {
			console.error(error);
			res.json({ success: false, error: 'User not found' });
			return;
		}

		bcrypt.compare(currentPassword, row.password, (err: any, result: any) => {
			if (err || !result) {
				setTimeout(() => {
					res.json({ success: false, error: 'Invalid current password' });
				}, 5000); // Delay execution by 5 seconds (5000 milliseconds)
				return;
			}

			bcrypt.hash(newPassword, 10, (err: any, hash: any) => {
				if (err) {
					res.json({ success: false, error: 'Error hashing new password' });
					return;
				}

				db.run('UPDATE users SET password = ? WHERE username = ?', [hash, username], (error: any) => {
					if (error) {
						console.error(error);
						res.json({ success: false, error: 'Error updating password' });
						return;
					}

					res.json({ success: true });
				});
			});
		});
	});
});

/**
 * Finds a user in the database based on their username
 * @param {string} username - The username to search for
 * @returns {Promise<Object>} - A Promise that resolves with the user object if found, or rejects with an error if not found
 */
async function findUser(username: string): Promise<object> {
	return new Promise((resolve, reject) => {
		// Execute a SQL query to find the user
		db.get(`SELECT *
				FROM users
				WHERE username = ?`, [username], (err: Error, row: Object) => {
			if (err) {
				// If there was an error, reject the Promise with the error object
				reject(err);
			} else {
				// If the user was found, resolve the Promise with the user object
				resolve(row);
			}
			// This code is unreachable because the Promise is already resolved or rejected.
			// It should be removed.
			logMessage('Finding User...', 'info');
		});
	});
}

/**
 * Interface for user object with required password property.
 */
interface User {
	username: string;
	password: string;
	created_at?: number;
	last_login_at?: number;
}

/**
 * Validates user credentials against the provided database.
 * If user does not exist, a new account will be created.
 * If user exists, their password will be checked against the provided password.
 * If password is correct, their last login time will be updated.
 * @param {User} user - The user object.
 * @param {string} username - The username to validate.
 * @param {string} password - The password to validate.
 */
async function validateCredentials(user: User, username: string, password: string): Promise<void> {
	console.log(password); // Log password for debugging purposes
	if (!user) {
		// If user does not exist, create new account
		const hashedPassword = await bcrypt.hash(password, 10); // Hash password
		const timeNow = getTimestamp(); // Get current timestamp
		console.log(timeNow); // Log timestamp for debugging purposes
		db.run(
			`INSERT OR IGNORE INTO users (username, password, created_at)
             VALUES (?, ?, ?)`,
			[username, hashedPassword, timeNow]
		); // Insert new user into database
		console.log("Created new account."); // Log success
		logMessage("Creating New Account...", "info"); // Log to external logging service
	} else {
		// If user exists, check password
		const isMatch = await bcrypt.compare(password, user.password); // Compare hashed password with stored password
		if (!isMatch) {
			// If passwords do not match, throw error
			await sleep(5000); // Delay to prevent brute force attacks
			throw new Error("Incorrect password.");
		} else {
			// If passwords match, update last login time
			const timeNow = getTimestamp(); // Get current timestamp
			console.log(timeNow); // Log timestamp for debugging purposes
			db.run(`UPDATE users SET last_login_at = ? WHERE username = ?`, [timeNow, username]); // Update user's last login time in database
			logMessage("Updating last login time...", "info"); // Log to external logging service
		}
	}
}

app.get('/get/quizlet/data', async (req, res) => {
	try {
		let quizlet_id = req.query.quizlet_id;
		const url = req.query.url;
		console.log(quizlet_id);
		if (!quizlet_id && url) {
			const quizlet_id_match = (url as string).match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
			if (quizlet_id_match) {
				quizlet_id = quizlet_id_match[1];
			} else {
				return;
			}
		}

		checkAndCreateDir();

		const terms = await quizlet(Number(quizlet_id));
		console.log("terms: z", terms);

		let term: string[] = [];
		let def: string[] = [];
		for (let {
			cardSides: [{
				media: [{
					plainText: termText
				}]
			}, {
				media: [{
					plainText: defText
				}]
			}]
		} of terms) {
			term.push(termText);
			def.push(defText);
			console.log(termText, defText);
		}

		const {
			quizlet_title,
			termLang,
			defLang
		} = await getQuizletDetails(Number(quizlet_id));

		db.serialize(() => {
			db.run(`CREATE TABLE IF NOT EXISTS quizlet
					(
						id                    INTEGER PRIMARY KEY AUTOINCREMENT,
						quizlet_id            TEXT,
						quizlet_title         TEXT,
						quizlet_def_language  TEXT,
						quizlet_term_language TEXT,
						UNIQUE (quizlet_id)
					)`);
			db.get('SELECT * FROM quizlet WHERE quizlet_id = ?', [quizlet_id], (err: any, row: any) => {
				if (err) {
					console.error(err.message);
					res.status(500).send('Internal server error');
				} else {
					if (!row) {
						db.run('INSERT INTO quizlet (quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language) VALUES (?, ?, ?, ?)', [quizlet_id, quizlet_title, defLang, termLang], (err: any) => {
							if (err) {
								console.error(err.message);
								res.status(500).send('Internal server error');
							} else {
								res.json({
									term,
									def,
									quizlet_title,
									quizlet_id
								});
							}
						});
					} else {
						db.run('UPDATE quizlet SET quizlet_title = ?, quizlet_def_language = ?, quizlet_term_language = ? WHERE quizlet_id = ?', [quizlet_title, defLang, termLang, quizlet_id], (err: any) => {
							if (err) {
								console.error(err.message);
								res.status(500).send('Internal server error');
							} else {
								res.json({
									term,
									def,
									quizlet_title,
									quizlet_id
								});
							}
						});
					}
				}
			});
		});
		logMessage('Getting Quizlet Data...', 'info');
	} catch (error: any) {
		console.error(error);
		let errorInfo: string = error;
		logMessage(errorInfo, 'error');
		return res.status(500).send('Error retrieving Quizlet data');
	}
});

/**
 * Checks if the directory exists, creates it if it doesn't, and logs the action.
 */
function checkAndCreateDir() {
	// Check if directory already exists
	if (fs.existsSync(dataPath)) {
		console.log(`Directory already exists at ${dataPath}`);
	} else {
		// Create directory if it doesn't exist
		fs.mkdirSync(dataPath, {
			recursive: true
		});
		console.log(`Created directory at ${dataPath}`);
	}

	// Log message indicating that data directory is being created
	logMessage('Creating data Directory...', 'info');
}

app.post('/post/typed', (req, res) => {
	const {
		def,
		term,
		randomIndex,
		username,
		quizlet_id
	} = req.body;
	checkAndCreateDir();
	db.serialize(() => {
		db.get('SELECT id FROM users WHERE username = ?', [username], (err: any, row: any) => {
			if (err) {
				console.error(err);
				res.status(500).send('Internal Server Error');
				return;
			}

			if (!row) {
				res.status(400).send('User not found');
				return;
			}

			const {
				id
			} = row;
			db.serialize(() => {
				db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, randomIndex INTEGER, def TEXT, term TEXT, created_at TEXT)');
				const timeNow = getTimestamp();
				console.log(timeNow); // Output: "2023-03-29 08:15:30"
				db.run('INSERT INTO history (user_id, quizlet_id, randomIndex, def, term, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, quizlet_id, randomIndex, def, term, timeNow], (err: any) => {
					if (err) {
						console.error(err);
						res.status(500).send('Internal Server Error');
						return;
					}

					res.status(200).json({
						message: 'Success'
					});
				});
			});
		});
	});
	logMessage('Posting to history...', 'info');
});

app.get('/get/history', async (req, res) => {
	const {
		username,
		quizlet_id
	} = req.query;
	console.log(username, quizlet_id);
	checkAndCreateDir();
	db.serialize(() => {
		db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, def TEXT, term TEXT, created_at TEXT)');
	});
	await db.serialize(() => {
		db.get('SELECT id FROM users WHERE username = ?', [username], (err: any, row: any) => {
			if (err) {
				console.error(err);
				res.status(500).send('Internal Server Error');
				return;
			}

			if (!row) {
				res.status(400).send('User not found');
				return;
			}

			const {
				id
			} = row;
			db.serialize(() => {
				db.all('SELECT * FROM history WHERE user_id = ? AND quizlet_id = ?', [id, quizlet_id], (err: any, rows: any) => {
					if (err) {
						console.error(err);
						res.status(500).send('Internal Server Error');
						return;
					}

					res.status(200).json({
						history: rows
					});
				});
			});
		});
	});
	logMessage('Getting history...', 'info');
});

app.get('/get/furigana', async (req, res) => {
	const {
		word
	} = req.query;
	// Check if the term has kanji
	const result = Kuroshiro.Util.hasKanji(word);
	if (result === true) {
		const furigana = await kuroshiro.convert(word, {
			mode: "furigana",
			to: "hiragana"
		});
		console.log(furigana);
		logMessage('Getting Furigana...', 'info');
		res.json({
			furigana
		});
	} else {
		res.json({
			furigana: word
		});
		logMessage('Sending back word with no furigana...', 'info');
	}
});

app.get('/leaderboard', async (req, res) => {
	const quizlet_id = req.query.quizlet_id;
	console.log(quizlet_id);
	checkAndCreateDir();
	try {
		if (req.query.quizlet_id === undefined) {
			interface PlaytimeRow {
				user_id: number;
				playtime: number;
			}

			const playtimeRows = await queryDb("SELECT * FROM playtime", []) as PlaytimeRow[];
			const userRows = await queryDb("SELECT * FROM users", []) as Array<{ id: number, username: string }>;

			interface UserIdToUsernameMap {
				[key: number]: string;
			}

			const userIdToUsername: UserIdToUsernameMap = {};

			for (const row of userRows) {
				userIdToUsername[row.id] = row.username;
			}

			const leaderboard = [];
			for (const row of playtimeRows) {
				leaderboard.push({
					username: userIdToUsername[row.user_id],
					playtime: row.playtime.toString(), // Change to string type
				});
			}

			leaderboard.sort((a, b) => +b.playtime - +a.playtime);

			for (const entry of leaderboard) {
				entry.playtime = await formatDuration(Number(entry.playtime)); // Convert back to number for calculations
			}

			const templatePath = path.join(__dirname, 'public', 'html', 'leaderboard', 'index.html');
			const templateSource = fs.readFileSync(templatePath, 'utf8');
			const template = handlebars.compile(templateSource);

			const html = template({
				leaderboard,
			});

			console.log("Sending ", html);
			res.header('Content-Type', 'text/html');
			res.send(html);
		} else {

			const [{ quizlet_title }]: any = await queryDb('SELECT quizlet_title FROM quizlet WHERE quizlet_id = ?', [quizlet_id]);

			const rows: any = await queryDb('SELECT u.id AS user_id, u.username, COUNT(h.id) AS word_count FROM users u LEFT JOIN history h ON u.id = h.user_id AND h.quizlet_id = ? GROUP BY u.id HAVING word_count > 0 ORDER BY word_count DESC', [quizlet_id]);
			console.log(rows);

			const rankList = rows.map((row: { username: string, word_count: number }) => ({
				username: row.username,
				word_count: row.word_count,
				profile_url: `/profile?user=${row.username}`
			}));

			const labels = JSON.stringify(rows.map((row: { username: string }) => row.username));
			const data = JSON.stringify(rows.map((row: { word_count: number }) => row.word_count));

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
			await logMessage('Sending Leaderboard...', 'info');
		}
	} catch (err: any) {
		console.error(err.message);
		let html = `<!DOCTYPE html><html><head><title>Leaderboard - ${quizlet_id}</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><link rel="icon" type="image/x-icon" href="/image/favicon/favicon.ico" /><link rel="stylesheet" type="text/css" href="/css/leaderboard/style.css" /></head><body>`;
		html += `<h1>Leaderboard - ${quizlet_id}</h1><p>No one has typed any words yet!</p>`;
		console.log("Sending ", html);
		res.header('Content-Type', 'text/html');
		res.send(`${html}</body></html>`);
	}
});

app.get('/profile', async (req, res) => {
	const username: string = req.query.user !== undefined ? req.query.user as string : '';
	checkAndCreateDir();
	try {
		const result: any = await getDataProfile(username);

		if (result.length !== 0) {
			const count_per_day: any = await getWordCountPerDay(username);
			const labelsLine = JSON.stringify(count_per_day.map((item: any) => item.day));
			console.log(labelsLine);
			const dataLine = count_per_day.map((item: any) => item.count_on_the_day);

			const labels = JSON.stringify(result.labels);
			const data = JSON.stringify(result.data);

			const minValue = Math.min(...result.data);
			const maxValue = Math.max(...result.data);

			const gradient = (value: number) => {
				if (maxValue === minValue) {
					const hue = (200 - 0.5 * 200).toString(10);
					return `hsl(${hue}, 70%, 60%)`;
				} else {
					const position = (value - minValue) / (maxValue - minValue);
					const hue = (200 - position * 200).toString(10);
					return `hsl(${hue}, 70%, 60%)`;
				}
			};

			const colors = JSON.stringify(result.data.map((value: number) => gradient(value)));
			const background = JSON.stringify(result.data.map(() => '#22587d'));

			const playtimeMS = await getPlaytime(username);
			console.log(playtimeMS);

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
		logMessage('Sending Profile Page...', 'info');
	} catch (err: any) {
		console.log(err.message);
		let errorInfo: string = err.toString();
		logMessage(errorInfo, 'error');
		const templatePath = path.join(path.join(__dirname, 'public', 'html', 'profile', 'index.html'))
		const templateSource = fs.readFileSync(templatePath, 'utf8');
		const template = handlebars.compile(templateSource);
		const html = template({
			username
		});
		res.header('Content-Type', 'text/html');
		res.send(html);
	}
});

/**
 * Gets the playtime of a given user from the database.
 * @param {string} username - The username of the user to retrieve the playtime for.
 * @returns {number} The playtime of the user.
 */
async function getPlaytime(username: string): Promise<number> {
	console.log("Username: ", username);
	// Get the user ID from the database.
	const [user] = await queryDb(`SELECT id FROM users WHERE username = ?`, [username]);
	console.log(user);

	// If the user doesn't exist, return 0 playtime.
	if (!user) return 0;

	// Get the playtime row from the database.
	const row = (await queryDb(`SELECT playtime FROM playtime WHERE user_id = ?`, [user.id]));
	console.log(row);

	// If the playtime row doesn't exist, return 0 playtime.
	if (!row || !row[0]) return 0;

	// This is a test of logging a message at the beginning of the function.
	logMessage('Getting Playtime...', 'info');

	// This is a test of throwing an error and logging it.

	// Return the playtime value from the row.
	return row[0].playtime;
}

/**
 * Returns an array of word counts per day for a given username from a SQLite database.
 * @param {string} username - The username to get word counts for.
 * @returns {Promise} - A Promise that resolves with an array of objects representing word counts per day.
 */
async function getWordCountPerDay(username: string): Promise<any> {
	return new Promise((resolve, reject) => {
		db.all(`
			SELECT DATE(history.created_at) AS day, COUNT(*) AS word_count
			FROM history
					 JOIN users ON history.user_id = users.id
			WHERE users.username = ?
			GROUP BY day;
		`, [username], (err: any, rows: any) => {
			if (err) {
				console.error(err.message);
				reject(err);
			} else {
				// Map the rows to an array of objects with day and count_on_the_day properties
				const wordCountPerDay = rows.map((row: any) => ({
					day: row.day,
					count_on_the_day: row.word_count
				}));

				// Log a message indicating that we're getting word counts
				logMessage('Getting Word Counts...', 'info');

				// Resolve the Promise with the array of word counts per day
				resolve(wordCountPerDay);
			}
		});
	});
}

/**
 * Gets profile data for a given username from a database.
 * @param {string} username - The username to get profile data for.
 * @returns {Promise} A promise that resolves to an object containing profile data.
 */
async function getDataProfile(username: string): Promise<any> {
	return new Promise((resolve, reject) => {
		// Gets the number of users with the given username.
		db.get('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username], (err: any, row: any) => {
			if (err) {
				console.error(err.message);
				reject(err);
			} else if (row.count === 0) {
				// If no users were found, reject with an error.
				const err = new Error(`User ${username} does not exist.`);
				console.error(err.message);
				reject(err);
			} else {
				// Otherwise, get quizlet data for the user.
				db.all('SELECT quizlet.quizlet_id, quizlet.quizlet_title, COUNT(*) AS word_count FROM history JOIN quizlet ON history.quizlet_id = quizlet.quizlet_id JOIN users ON history.user_id = users.id WHERE users.username = ? GROUP BY quizlet.quizlet_id, quizlet.quizlet_title', [username], (err: any, rows: any) => {
					if (err) {
						console.error(err.message);
						reject(err);
					} else {
						// Sort the rows in descending order by word count.
						const sortedRows = rows.sort((a: any, b: any) => b.word_count - a.word_count);

						// Get the quizlet titles and IDs as labels.
						interface QuizletRow {
							quizlet_title: string;
							quizlet_id: number;
						}
						const labels = sortedRows.map((row: QuizletRow) => `${row.quizlet_title} - ${row.quizlet_id}`);

						// Get the word counts as data.
						const data = sortedRows.map((row: { word_count: number }) => row.word_count);
						// Return the labels and data as an object.
						const result = {
							labels,
							data
						};
						resolve(result);
					}
				});
			}
		});
		// Log a message to indicate that profile data is being retrieved.
		logMessage('Getting Profile Data...', 'info');
	});
}

app.post('/post/playtime', async (req, res) => {
	const {
		username,
		playtime
	} = req.body;

	console.log(username);
	console.log(playtime);

	try {
		await queryDb(`
			CREATE TABLE IF NOT EXISTS playtime
			(
				id       INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id  INTEGER NOT NULL DEFAULT 0,
				playtime INTEGER NOT NULL DEFAULT 0
			)
		`, []);

		interface UserRow {
			id: number;
		}

		const user = await queryDb(`SELECT id FROM users WHERE username = ?`, [username]) as UserRow[];

		if (!user || user.length === 0) {
			res.status(404).send('User not found');
			return;
		}


		interface PlaytimeRow {
			playtime: number;
		}

		const row = await queryDb(`SELECT playtime FROM playtime WHERE user_id = ?`, [user[0].id]) as PlaytimeRow[];

		if (row && row.length > 0) {
			const existingPlaytime = row[0].playtime;
			const updatedPlaytime = existingPlaytime + playtime;
			await queryDb(`UPDATE playtime
								 SET playtime = ?
								 WHERE user_id = ?`, [updatedPlaytime, user[0].id]);
			res.send(`Playtime updated for ${username}`);
		} else {
			await queryDb(`INSERT INTO playtime (user_id, playtime)
								 VALUES (?, ?)`, [user[0].id, playtime]);
			res.send(`Playtime inserted for ${username}`);
		}
		await logMessage('Posting Playtime...', 'info');
	} catch (err: any) {
		console.error(err.message);
		res.status(500).send('Internal server error');
	}
});

/**
 * Returns a promise that resolves after a given amount of time.
 * @param {number} ms - The amount of time to sleep in milliseconds.
 * @returns {Promise} A promise that resolves after the given amount of time has passed.
 */
function sleep(ms: number): Promise<any> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

type Card = {
	cardSides: {
		media: {
			plainText: string;
		}[];
	}[];
};

/**
 * Fetches Quizlet terms for a given container ID
 * @param {number} id - the container ID to fetch terms for
 * @returns {Array<Object>} - an array of term objects
 */
async function quizlet(id: Number) {
	// Fetch the first page of terms
	let res = await fetch(`https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=${id}&filters%5BstudiableContainerType%5D=1&perPage=5&page=1`).then(res => res.json())

	// Initialize variables for pagination
	let currentLength = 5;
	let token = res.responses[0].paging.token;
	let terms = res.responses[0].models.studiableItem;
	let page = 2;

	// Keep fetching pages until we get less than 5 terms
	while (currentLength >= 5) {
		// Fetch the next page of terms
		let res = await fetch(`https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=${id}&filters%5BstudiableContainerType%5D=1&perPage=5&page=${page++}&pagingToken=${token}`).then(res => res.json());

		// Append the new terms to our array and update the pagination variables
		terms.push(...res.responses[0].models.studiableItem);
		currentLength = res.responses[0].models.studiableItem.length;
		token = res.responses[0].paging.token;
	}

	// Log a message indicating that we're fetching Quizlet data
	await logMessage('Getting Quizlet data...', 'info');

	// Return the array of terms
	return terms;
}

interface QuizletDetails {
	quizlet_title: string;
	termLang: string;
	defLang: string;
}

/**
 * Fetches details of a Quizlet set from its ID.
 * @param {number} id - Quizlet set ID.
 * @returns {Object} - Object containing quizlet_title, termLang, and defLang.
 */
async function getQuizletDetails(id: number): Promise<QuizletDetails> {
	// Make a fetch request to Quizlet API to get set details
	const response = await fetch(`https://quizlet.com/webapi/3.4/sets/${id}`, {
		headers: {
			'Content-Type': 'application/json;charset=utf-8'
		}
	}).then(res => res.json());

	// Extract set details from the API response
	const set = response.responses[0].models.set[0];

	// Log a message indicating that Quizlet data is being fetched
	logMessage('Getting Quizlet data...', 'info');

	// Return an object with the necessary set details
	return {
		quizlet_title: set.title,
		termLang: set.wordLang,
		defLang: set.defLang
	};
}

app.get('/get/quizlet/list', async (req, res) => {
	try {
		logMessage('Getting Quizlet list...', 'info');
		const rows = await queryDb('SELECT id, quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language FROM quizlet', []);
		console.log(rows);
		res.json(rows);
	} catch (error: any) {
		console.error(error);
		let errorInfo: string = error.toString();
		logMessage(errorInfo, 'error');
		res.status(500).send('Internal server error');
	}
});

/**
 * Queries a SQLite database using the provided SQL statement and parameters.
 *
 * @param {string} sql - The SQL statement to execute.
 * @param {Array} params - An array of parameters to substitute into the SQL statement.
 * @returns {Promise<Array>} - A promise that resolves with an array of rows returned by the query, or rejects with an error.
 */
async function queryDb(sql: string, params: any): Promise<Array<any>> {
	// Create a new promise that wraps the database query logic
	return new Promise((resolve, reject) => {
		// Serialize the database to ensure queries execute in order
		db.serialize(() => {
			// Execute the query with the provided SQL and parameters
			db.all(sql, params, (err: any, rows: any) => {
				// If an error occurred, reject the promise with the error
				if (err) {
					reject(err);
				} else {
					// Otherwise, resolve the promise with the returned rows
					resolve(rows);
				}
			});
		});
	});
}

/**
 * Converts a duration in milliseconds into a human-readable string with hours, minutes and seconds.
 *
 * @param {number} durationInMs - The duration in milliseconds.
 *
 * @returns {string} The formatted duration string.
 */
async function formatDuration(durationInMs: number) {
	// Convert to seconds
	const seconds = Math.floor(durationInMs / 1000);

	// Split into hours, minutes and remaining seconds
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	// Build parts array with hours, minutes and seconds
	const parts: string[] = [];
	if (hours > 0) {
		parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
	}
	if (minutes > 0) {
		parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
	}
	if (remainingSeconds > 0 || parts.length === 0) {
		parts.push(`${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`);
	}

	// Join parts array into formatted duration string
	return parts.join(' ');
}

if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir);
}

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp({
			format: () => {
				return moment().tz('Pacific/Auckland').format('YYYY-MM-DD HH:mm:ss');
			}
		}),
		winston.format.json()
	),
	defaultMeta: {
		service: 'user-service'
	},
	transports: [
		new winston.transports.File({
			filename: path.join(currentDateLogsDir, 'error.log'),
			level: 'error'
		}),
		new winston.transports.File({
			filename: path.join(currentDateLogsDir, 'combined.log')
		}),
	],
});

/**
 * Logs a message with the specified log level and adds metadata about the caller's file and line number.
 * @param {string} message - The message to log.
 * @param {string} level - The log level to use (e.g. 'info', 'warn', 'error').
 */
const logMessage = async (message: string, level: string) => {
	// Get the stack trace to find the caller's file and line number.
	const stack = await StackTrace.get();
	// Get the file name and line number of the function that called logMessage.
	const callerFile = stack[1].fileName;
	const callerLine = stack[1].lineNumber;
	// Create metadata object to include in log message.
	const meta = {
		file: callerFile,
		line: callerLine
	};

	currentDateLogsDir = path.join(logsDir, moment().tz('Pacific/Auckland').format('YYYY-MM-DD'));

	console.log(level, message, meta);
	// Call the logger with the specified level, message and metadata.
	logger.log(level, message, meta, currentDateLogsDir);
}

checkAndCreateDir();

app.get('*', function (req, res) {
	res.status(404).sendFile(path.join(__dirname, '/public/html/error/404.html'));
});

app.listen(port, address, () => {
	console.log(`Server listening on http://${address}:${port}`);
});