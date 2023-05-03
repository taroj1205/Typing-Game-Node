"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require('dotenv').config();
var express_1 = require("express");
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
var bcrypt = require('bcrypt');
var handlebars = require('handlebars');
var winston = require('winston');
var moment = require('moment-timezone');
var StackTrace = require('stacktrace-js');
var uuid = require('uuid');
var app = express_1["default"]();
var port = Number(process.env.APP_LISTEN_PORT || 3000);
var address = process.env.APP_LISTEN_IP_ADDRESS || '0.0.0.0';
var Kuroshiro = require('kuroshiro')["default"];
var KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
var kuroshiro = new Kuroshiro();
kuroshiro.init(new KuromojiAnalyzer());
var dataPath = path.join(__dirname, 'data');
var db = new sqlite3.Database(path.join(dataPath, 'database.db'));
var logsDir = path.join(__dirname, 'logs');
var currentDateLogsDir = path.join(logsDir, moment().tz('Pacific/Auckland').format('YYYY-MM-DD'));
app.use(express_1["default"].json());
app.use(express_1["default"].static(path.resolve(__dirname, 'public')));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.get('/', function (req, res) {
    logMessage('Sending index.html...', 'info');
    try {
        res.sendFile(path.join(__dirname, 'public', 'html', 'main', 'index.html'));
    }
    catch (error) {
        logMessage(error.message, 'error');
    }
});
/**
 * Returns a formatted timestamp in the format of 'yyyy-mm-ddThh:mm:ss' for the Pacific/Auckland timezone.
 * @returns {string} The formatted timestamp.
 */
function getTimestamp() {
    // get the current date and time
    var now = new Date();
    // set options for formatting the date and time
    var options = {
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
    var formattedDate = now.toLocaleString('ja-JP', options);
    // replace the forward slashes with dashes to match the desired format
    var timestamp = formattedDate.replace(/\//g, '-');
    // return the formatted timestamp
    return timestamp;
}
/**
 * Generates a unique authentication token for the given user and saves it to the database.
 * @param {string} username - The username of the user.
 * @returns {Promise<AuthToken>} - An object containing the generated authentication token and its expiration date.
 */
function generateAuthToken(username) {
    return __awaiter(this, void 0, Promise, function () {
        var timeNow, timeZone, date, options, uniqueAuthToken, authToken, expirationDate, hashedAuthToken;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logMessage('Generating auth token...', 'info');
                    timeNow = getTimestamp();
                    timeZone = 'Pacific/Auckland';
                    date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    options = {
                        timeZone: timeZone,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    };
                    return [4 /*yield*/, getUniqueAuthToken()];
                case 1:
                    uniqueAuthToken = _a.sent();
                    console.log("Generated unique auth token!");
                    authToken = uniqueAuthToken === null || uniqueAuthToken === void 0 ? void 0 : uniqueAuthToken.authToken;
                    expirationDate = (uniqueAuthToken === null || uniqueAuthToken === void 0 ? void 0 : uniqueAuthToken.expirationDate) ? new Date(uniqueAuthToken.expirationDate) : date;
                    // Check that the authToken exists before hashing it
                    if (!authToken) {
                        throw new Error('Could not generate auth token.');
                    }
                    // Log the current timestamp
                    console.log(timeNow); // Output: "2023-03-29 08:15:30"
                    // Log the generated authentication token
                    console.log(authToken);
                    return [4 /*yield*/, bcrypt.hash(authToken, 10)];
                case 2:
                    hashedAuthToken = _a.sent();
                    // Save the hashed authentication token and expiration date to the database
                    return [4 /*yield*/, queryDb("UPDATE users\n                       SET auth_token            = ?,\n                           auth_token_expiration = ?,\n                           last_login_at         = ?\n                       WHERE username = ?", [hashedAuthToken, expirationDate, timeNow, username])];
                case 3:
                    // Save the hashed authentication token and expiration date to the database
                    _a.sent();
                    // Log a message indicating that the authentication token has been generated
                    console.log("Generated auth token.");
                    logMessage('Generating auth token...', 'info');
                    // Return the authentication token and its expiration date
                    return [2 /*return*/, {
                            authToken: authToken,
                            expirationDate: expirationDate
                        }];
            }
        });
    });
}
function getUniqueAuthToken() {
    return __awaiter(this, void 0, Promise, function () {
        var authToken, existingUser, expirationDate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 2];
                    authToken = uuid.v4();
                    return [4 /*yield*/, queryDb("\n      SELECT auth_token, auth_token_expiration\n      FROM users\n      WHERE auth_token = ?\n    ", [authToken])];
                case 1:
                    existingUser = _a.sent();
                    if (existingUser && existingUser.length === 0) {
                        expirationDate = new Date();
                        console.log(expirationDate);
                        expirationDate.setDate(expirationDate.getDate() + 7);
                        return [2 /*return*/, {
                                authToken: authToken,
                                expirationDate: expirationDate
                            }];
                    }
                    return [3 /*break*/, 0];
                case 2: return [2 /*return*/];
            }
        });
    });
}
/**
 * Authenticates a user with a given token.
 *
 * @param {string} token - The authentication token.
 * @returns {string|null} The authenticated username, or null if authentication failed.
 */
function authenticateUser(token) {
    return __awaiter(this, void 0, Promise, function () {
        var rows, username, _i, rows_1, row, match, timeNow, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, queryDb("SELECT auth_token, username FROM users", [])];
                case 1:
                    rows = _a.sent();
                    console.log('All users:', rows);
                    username = null;
                    _i = 0, rows_1 = rows;
                    _a.label = 2;
                case 2:
                    if (!(_i < rows_1.length)) return [3 /*break*/, 5];
                    row = rows_1[_i];
                    return [4 /*yield*/, bcrypt.compare(token, row.auth_token)];
                case 3:
                    match = _a.sent();
                    if (match) {
                        username = row.username;
                        return [3 /*break*/, 5];
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    // Throw an error if no user was found.
                    if (!username) {
                        throw new Error('Invalid token');
                    }
                    timeNow = getTimestamp();
                    console.log('Current timestamp:', timeNow);
                    return [4 /*yield*/, queryDb("UPDATE users\n                             SET last_login_at = ?\n                             WHERE username = ?", [timeNow, username])];
                case 6:
                    _a.sent();
                    // Log a success message and return the authenticated username.
                    console.log("User " + username + " authenticated successfully.");
                    return [2 /*return*/, username];
                case 7:
                    err_1 = _a.sent();
                    // Log an error message and return null if authentication failed.
                    console.log('Authentication failed:', err_1.message);
                    return [2 /*return*/, null];
                case 8: return [2 /*return*/];
            }
        });
    });
}
app.post('/auth', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, username;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = req.body.auth_token;
                console.log(token);
                return [4 /*yield*/, authenticateUser(token)];
            case 1:
                username = _a.sent();
                console.log(username);
                if (username) {
                    res.json({
                        success: true,
                        message: 'Authentication successful',
                        username: username
                    });
                }
                else {
                    res.status(401).json({
                        success: false,
                        message: 'Authentication failed'
                    });
                }
                return [2 /*return*/];
        }
    });
}); });
app.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user, _b, authToken, expirationDate, err_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, username = _a.username, password = _a.password;
                username = username.trim();
                console.log("Username: " + username + ", Password: " + password);
                checkAndCreateDir();
                return [4 /*yield*/, db.serialize(function () {
                        db.run("\n\t\t\tCREATE TABLE IF NOT EXISTS users\n\t\t\t(\n\t\t\t\tid                    INTEGER PRIMARY KEY,\n\t\t\t\tusername              TEXT      NOT NULL,\n\t\t\t\tpassword              TEXT      NOT NULL,\n\t\t\t\tcreated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\t\t\t\tauth_token            TEXT               DEFAULT NULL,\n\t\t\t\tauth_token_expiration TEXT               DEFAULT NULL,\n\t\t\t\tlast_login_at         TEXT               DEFAULT NULL\n\t\t\t);\n\t\t");
                        logMessage('Creating users table...', 'info');
                    })];
            case 1:
                _c.sent();
                _c.label = 2;
            case 2:
                _c.trys.push([2, 6, , 7]);
                return [4 /*yield*/, findUser(username)];
            case 3:
                user = _c.sent();
                console.log("User found: " + username);
                return [4 /*yield*/, validateCredentials(user, username, password)];
            case 4:
                _c.sent();
                console.log("Valid Credentials!");
                return [4 /*yield*/, generateAuthToken(username)];
            case 5:
                _b = _c.sent(), authToken = _b.authToken, expirationDate = _b.expirationDate;
                console.log("Generated auth token and expiration date!");
                return [2 /*return*/, res.json({
                        success: true,
                        auth_token: authToken,
                        expires_at: expirationDate
                    })];
            case 6:
                err_2 = _c.sent();
                console.error(err_2);
                return [2 /*return*/, res.json({
                        success: false,
                        error: 'Invalid credentials.'
                    })];
            case 7: return [2 /*return*/];
        }
    });
}); });
/**
 * Finds a user in the database based on their username
 * @param {string} username - The username to search for
 * @returns {Promise<Object>} - A Promise that resolves with the user object if found, or rejects with an error if not found
 */
function findUser(username) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // Execute a SQL query to find the user
                    db.get("SELECT *\n\t\t\t\tFROM users\n\t\t\t\tWHERE username = ?", [username], function (err, row) {
                        if (err) {
                            // If there was an error, reject the Promise with the error object
                            reject(err);
                        }
                        else {
                            // If the user was found, resolve the Promise with the user object
                            resolve(row);
                        }
                        // This code is unreachable because the Promise is already resolved or rejected.
                        // It should be removed.
                        logMessage('Finding User...', 'info');
                    });
                })];
        });
    });
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
function validateCredentials(user, username, password) {
    return __awaiter(this, void 0, Promise, function () {
        var hashedPassword, timeNow, isMatch, timeNow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(password); // Log password for debugging purposes
                    if (!!user) return [3 /*break*/, 2];
                    return [4 /*yield*/, bcrypt.hash(password, 10)];
                case 1:
                    hashedPassword = _a.sent();
                    timeNow = getTimestamp();
                    console.log(timeNow); // Log timestamp for debugging purposes
                    db.run("INSERT OR IGNORE INTO users (username, password, created_at)\n             VALUES (?, ?, ?)", [username, hashedPassword, timeNow]); // Insert new user into database
                    console.log("Created new account."); // Log success
                    logMessage("Creating New Account...", "info"); // Log to external logging service
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, bcrypt.compare(password, user.password)];
                case 3:
                    isMatch = _a.sent();
                    if (!!isMatch) return [3 /*break*/, 5];
                    // If passwords do not match, throw error
                    return [4 /*yield*/, sleep(5000)];
                case 4:
                    // If passwords do not match, throw error
                    _a.sent(); // Delay to prevent brute force attacks
                    throw new Error("Incorrect password.");
                case 5:
                    timeNow = getTimestamp();
                    console.log(timeNow); // Log timestamp for debugging purposes
                    db.run("UPDATE users SET last_login_at = ? WHERE username = ?", [timeNow, username]); // Update user's last login time in database
                    logMessage("Updating last login time...", "info"); // Log to external logging service
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
app.get('/get/quizlet/data', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var quizlet_id_1, url, quizlet_id_match, terms, term_1, def_1, _i, terms_1, _a, termText, defText, _b, quizlet_title_1, termLang_1, defLang_1, error_1, errorInfo;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                quizlet_id_1 = req.query.quizlet_id;
                url = req.query.url;
                console.log(quizlet_id_1);
                if (!quizlet_id_1 && url) {
                    quizlet_id_match = url.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
                    if (quizlet_id_match) {
                        quizlet_id_1 = quizlet_id_match[1];
                    }
                    else {
                        return [2 /*return*/];
                    }
                }
                checkAndCreateDir();
                return [4 /*yield*/, quizlet(Number(quizlet_id_1))];
            case 1:
                terms = _c.sent();
                console.log("terms: z", terms);
                term_1 = [];
                def_1 = [];
                for (_i = 0, terms_1 = terms; _i < terms_1.length; _i++) {
                    _a = terms_1[_i].cardSides, termText = _a[0].media[0].plainText, defText = _a[1].media[0].plainText;
                    term_1.push(termText);
                    def_1.push(defText);
                    console.log(termText, defText);
                }
                return [4 /*yield*/, getQuizletDetails(Number(quizlet_id_1))];
            case 2:
                _b = _c.sent(), quizlet_title_1 = _b.quizlet_title, termLang_1 = _b.termLang, defLang_1 = _b.defLang;
                db.serialize(function () {
                    db.run("CREATE TABLE IF NOT EXISTS quizlet\n\t\t\t\t\t(\n\t\t\t\t\t\tid                    INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\t\t\t\t\tquizlet_id            TEXT,\n\t\t\t\t\t\tquizlet_title         TEXT,\n\t\t\t\t\t\tquizlet_def_language  TEXT,\n\t\t\t\t\t\tquizlet_term_language TEXT,\n\t\t\t\t\t\tUNIQUE (quizlet_id)\n\t\t\t\t\t)");
                    db.get('SELECT * FROM quizlet WHERE quizlet_id = ?', [quizlet_id_1], function (err, row) {
                        if (err) {
                            console.error(err.message);
                            res.status(500).send('Internal server error');
                        }
                        else {
                            if (!row) {
                                db.run('INSERT INTO quizlet (quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language) VALUES (?, ?, ?, ?)', [quizlet_id_1, quizlet_title_1, defLang_1, termLang_1], function (err) {
                                    if (err) {
                                        console.error(err.message);
                                        res.status(500).send('Internal server error');
                                    }
                                    else {
                                        res.json({
                                            term: term_1,
                                            def: def_1,
                                            quizlet_title: quizlet_title_1,
                                            quizlet_id: quizlet_id_1
                                        });
                                    }
                                });
                            }
                            else {
                                db.run('UPDATE quizlet SET quizlet_title = ?, quizlet_def_language = ?, quizlet_term_language = ? WHERE quizlet_id = ?', [quizlet_title_1, defLang_1, termLang_1, quizlet_id_1], function (err) {
                                    if (err) {
                                        console.error(err.message);
                                        res.status(500).send('Internal server error');
                                    }
                                    else {
                                        res.json({
                                            term: term_1,
                                            def: def_1,
                                            quizlet_title: quizlet_title_1,
                                            quizlet_id: quizlet_id_1
                                        });
                                    }
                                });
                            }
                        }
                    });
                });
                logMessage('Getting Quizlet Data...', 'info');
                return [3 /*break*/, 4];
            case 3:
                error_1 = _c.sent();
                console.error(error_1);
                errorInfo = error_1;
                logMessage(errorInfo, 'error');
                return [2 /*return*/, res.status(500).send('Error retrieving Quizlet data')];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Checks if the directory exists, creates it if it doesn't, and logs the action.
 */
function checkAndCreateDir() {
    // Check if directory already exists
    if (fs.existsSync(dataPath)) {
        console.log("Directory already exists at " + dataPath);
    }
    else {
        // Create directory if it doesn't exist
        fs.mkdirSync(dataPath, {
            recursive: true
        });
        console.log("Created directory at " + dataPath);
    }
    // Log message indicating that data directory is being created
    logMessage('Creating data Directory...', 'info');
}
app.post('/post/typed', function (req, res) {
    var _a = req.body, def = _a.def, term = _a.term, randomIndex = _a.randomIndex, username = _a.username, quizlet_id = _a.quizlet_id;
    checkAndCreateDir();
    db.serialize(function () {
        db.get('SELECT id FROM users WHERE username = ?', [username], function (err, row) {
            if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
                return;
            }
            if (!row) {
                res.status(400).send('User not found');
                return;
            }
            var id = row.id;
            db.serialize(function () {
                db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, randomIndex INTEGER, def TEXT, term TEXT, created_at TEXT)');
                var timeNow = getTimestamp();
                console.log(timeNow); // Output: "2023-03-29 08:15:30"
                db.run('INSERT INTO history (user_id, quizlet_id, randomIndex, def, term, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, quizlet_id, randomIndex, def, term, timeNow], function (err) {
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
app.get('/get/history', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, quizlet_id;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, username = _a.username, quizlet_id = _a.quizlet_id;
                console.log(username, quizlet_id);
                checkAndCreateDir();
                db.serialize(function () {
                    db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, def TEXT, term TEXT, created_at TEXT)');
                });
                return [4 /*yield*/, db.serialize(function () {
                        db.get('SELECT id FROM users WHERE username = ?', [username], function (err, row) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Internal Server Error');
                                return;
                            }
                            if (!row) {
                                res.status(400).send('User not found');
                                return;
                            }
                            var id = row.id;
                            db.serialize(function () {
                                db.all('SELECT * FROM history WHERE user_id = ? AND quizlet_id = ?', [id, quizlet_id], function (err, rows) {
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
                    })];
            case 1:
                _b.sent();
                logMessage('Getting history...', 'info');
                return [2 /*return*/];
        }
    });
}); });
app.get('/get/furigana', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var word, result, furigana;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                word = req.query.word;
                result = Kuroshiro.Util.hasKanji(word);
                if (!(result === true)) return [3 /*break*/, 2];
                return [4 /*yield*/, kuroshiro.convert(word, {
                        mode: "furigana",
                        to: "hiragana"
                    })];
            case 1:
                furigana = _a.sent();
                console.log(furigana);
                logMessage('Getting Furigana...', 'info');
                res.json({
                    furigana: furigana
                });
                return [3 /*break*/, 3];
            case 2:
                res.json({
                    furigana: word
                });
                logMessage('Sending back word with no furigana...', 'info');
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
app.get('/leaderboard', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var quizlet_id, playtimeRows, userRows, userIdToUsername, _i, userRows_1, row, leaderboard, _a, playtimeRows_1, row, _b, leaderboard_1, entry, _c, templatePath, templateSource, template, html, quizlet_title, rows, rankList, labels, data, templatePath, templateSource, template, html, err_3, html;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                quizlet_id = req.query.quizlet_id;
                console.log(quizlet_id);
                checkAndCreateDir();
                _d.label = 1;
            case 1:
                _d.trys.push([1, 13, , 14]);
                if (!(req.query.quizlet_id === undefined)) return [3 /*break*/, 8];
                return [4 /*yield*/, queryDb("SELECT * FROM playtime", [])];
            case 2:
                playtimeRows = _d.sent();
                return [4 /*yield*/, queryDb("SELECT * FROM users", [])];
            case 3:
                userRows = _d.sent();
                userIdToUsername = {};
                for (_i = 0, userRows_1 = userRows; _i < userRows_1.length; _i++) {
                    row = userRows_1[_i];
                    userIdToUsername[row.id] = row.username;
                }
                leaderboard = [];
                for (_a = 0, playtimeRows_1 = playtimeRows; _a < playtimeRows_1.length; _a++) {
                    row = playtimeRows_1[_a];
                    leaderboard.push({
                        username: userIdToUsername[row.user_id],
                        playtime: row.playtime.toString()
                    });
                }
                leaderboard.sort(function (a, b) { return +b.playtime - +a.playtime; });
                _b = 0, leaderboard_1 = leaderboard;
                _d.label = 4;
            case 4:
                if (!(_b < leaderboard_1.length)) return [3 /*break*/, 7];
                entry = leaderboard_1[_b];
                _c = entry;
                return [4 /*yield*/, formatDuration(Number(entry.playtime))];
            case 5:
                _c.playtime = _d.sent(); // Convert back to number for calculations
                _d.label = 6;
            case 6:
                _b++;
                return [3 /*break*/, 4];
            case 7:
                templatePath = path.join(__dirname, 'public', 'html', 'leaderboard', 'index.html');
                templateSource = fs.readFileSync(templatePath, 'utf8');
                template = handlebars.compile(templateSource);
                html = template({
                    leaderboard: leaderboard
                });
                console.log("Sending ", html);
                res.header('Content-Type', 'text/html');
                res.send(html);
                return [3 /*break*/, 12];
            case 8: return [4 /*yield*/, queryDb('SELECT quizlet_title FROM quizlet WHERE quizlet_id = ?', [quizlet_id])];
            case 9:
                quizlet_title = (_d.sent())[0].quizlet_title;
                return [4 /*yield*/, queryDb('SELECT u.id AS user_id, u.username, COUNT(h.id) AS word_count FROM users u LEFT JOIN history h ON u.id = h.user_id AND h.quizlet_id = ? GROUP BY u.id HAVING word_count > 0 ORDER BY word_count DESC', [quizlet_id])];
            case 10:
                rows = _d.sent();
                console.log(rows);
                rankList = rows.map(function (row) { return ({
                    username: row.username,
                    word_count: row.word_count,
                    profile_url: "/profile?user=" + row.username
                }); });
                labels = JSON.stringify(rows.map(function (row) { return row.username; }));
                data = JSON.stringify(rows.map(function (row) { return row.word_count; }));
                templatePath = path.join(__dirname, 'public', 'html', 'leaderboard', 'index.html');
                templateSource = fs.readFileSync(templatePath, 'utf8');
                template = handlebars.compile(templateSource);
                html = template({
                    quizlet_title: quizlet_title,
                    quizlet_id: quizlet_id,
                    rankList: rankList,
                    labels: labels,
                    data: data
                });
                console.log(quizlet_title);
                console.log(rankList);
                console.log(labels);
                console.log(data);
                res.header('Content-Type', 'text/html');
                res.send(html);
                return [4 /*yield*/, logMessage('Sending Leaderboard...', 'info')];
            case 11:
                _d.sent();
                _d.label = 12;
            case 12: return [3 /*break*/, 14];
            case 13:
                err_3 = _d.sent();
                console.error(err_3.message);
                html = "<!DOCTYPE html><html><head><title>Leaderboard - " + quizlet_id + "</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0\"><link rel=\"icon\" type=\"image/x-icon\" href=\"/image/favicon/favicon.ico\" /><link rel=\"stylesheet\" type=\"text/css\" href=\"/css/leaderboard/style.css\" /></head><body>";
                html += "<h1>Leaderboard - " + quizlet_id + "</h1><p>No one has typed any words yet!</p>";
                console.log("Sending ", html);
                res.header('Content-Type', 'text/html');
                res.send(html + "</body></html>");
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); });
app.get('/profile', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var username, result, count_per_day, labelsLine, dataLine, labels, data, minValue_1, maxValue_1, gradient_1, colors, background, playtimeMS, playtime_1, templatePath, templateSource, template, html, err_4, errorInfo, templatePath, templateSource, template, html;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                username = req.query.user !== undefined ? req.query.user : '';
                checkAndCreateDir();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                return [4 /*yield*/, getDataProfile(username)];
            case 2:
                result = _a.sent();
                if (!(result.length !== 0)) return [3 /*break*/, 6];
                return [4 /*yield*/, getWordCountPerDay(username)];
            case 3:
                count_per_day = _a.sent();
                labelsLine = JSON.stringify(count_per_day.map(function (item) { return item.day; }));
                console.log(labelsLine);
                dataLine = count_per_day.map(function (item) { return item.count_on_the_day; });
                labels = JSON.stringify(result.labels);
                data = JSON.stringify(result.data);
                minValue_1 = Math.min.apply(Math, result.data);
                maxValue_1 = Math.max.apply(Math, result.data);
                gradient_1 = function (value) {
                    if (maxValue_1 === minValue_1) {
                        var hue = (200 - 0.5 * 200).toString(10);
                        return "hsl(" + hue + ", 70%, 60%)";
                    }
                    else {
                        var position = (value - minValue_1) / (maxValue_1 - minValue_1);
                        var hue = (200 - position * 200).toString(10);
                        return "hsl(" + hue + ", 70%, 60%)";
                    }
                };
                colors = JSON.stringify(result.data.map(function (value) { return gradient_1(value); }));
                background = JSON.stringify(result.data.map(function () { return '#22587d'; }));
                return [4 /*yield*/, getPlaytime(username)];
            case 4:
                playtimeMS = _a.sent();
                console.log(playtimeMS);
                return [4 /*yield*/, formatDuration(playtimeMS)
                        .then(function (formattedTime) {
                        playtime_1 = formattedTime;
                    })["catch"](function (error) {
                        console.error(error);
                    })];
            case 5:
                _a.sent();
                console.log(playtime_1);
                templatePath = path.join(path.join(__dirname, 'public', 'html', 'profile', 'index.html'));
                templateSource = fs.readFileSync(templatePath, 'utf8');
                template = handlebars.compile(templateSource);
                html = template({
                    username: username,
                    labelsLine: labelsLine,
                    dataLine: dataLine,
                    labels: labels,
                    data: data,
                    colors: colors,
                    background: background,
                    playtime: playtime_1
                });
                res.header('Content-Type', 'text/html');
                res.send(html);
                _a.label = 6;
            case 6:
                logMessage('Sending Profile Page...', 'info');
                return [3 /*break*/, 8];
            case 7:
                err_4 = _a.sent();
                console.log(err_4.message);
                errorInfo = err_4.toString();
                logMessage(errorInfo, 'error');
                templatePath = path.join(path.join(__dirname, 'public', 'html', 'profile', 'index.html'));
                templateSource = fs.readFileSync(templatePath, 'utf8');
                template = handlebars.compile(templateSource);
                html = template({
                    username: username
                });
                res.header('Content-Type', 'text/html');
                res.send(html);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
/**
 * Gets the playtime of a given user from the database.
 * @param {string} username - The username of the user to retrieve the playtime for.
 * @returns {number} The playtime of the user.
 */
function getPlaytime(username) {
    return __awaiter(this, void 0, Promise, function () {
        var user, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Username: ", username);
                    return [4 /*yield*/, queryDb("SELECT id FROM users WHERE username = ?", [username])];
                case 1:
                    user = (_a.sent())[0];
                    console.log(user);
                    // If the user doesn't exist, return 0 playtime.
                    if (!user)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, queryDb("SELECT playtime FROM playtime WHERE user_id = ?", [user.id])];
                case 2:
                    row = (_a.sent());
                    console.log(row);
                    // If the playtime row doesn't exist, return 0 playtime.
                    if (!row || !row[0])
                        return [2 /*return*/, 0];
                    // This is a test of logging a message at the beginning of the function.
                    logMessage('Getting Playtime...', 'info');
                    // This is a test of throwing an error and logging it.
                    // Return the playtime value from the row.
                    return [2 /*return*/, row[0].playtime];
            }
        });
    });
}
/**
 * Returns an array of word counts per day for a given username from a SQLite database.
 * @param {string} username - The username to get word counts for.
 * @returns {Promise} - A Promise that resolves with an array of objects representing word counts per day.
 */
function getWordCountPerDay(username) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    db.all("\n\t\t\tSELECT DATE(history.created_at) AS day, COUNT(*) AS word_count\n\t\t\tFROM history\n\t\t\t\t\t JOIN users ON history.user_id = users.id\n\t\t\tWHERE users.username = ?\n\t\t\tGROUP BY day;\n\t\t", [username], function (err, rows) {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        }
                        else {
                            // Map the rows to an array of objects with day and count_on_the_day properties
                            var wordCountPerDay = rows.map(function (row) { return ({
                                day: row.day,
                                count_on_the_day: row.word_count
                            }); });
                            // Log a message indicating that we're getting word counts
                            logMessage('Getting Word Counts...', 'info');
                            // Resolve the Promise with the array of word counts per day
                            resolve(wordCountPerDay);
                        }
                    });
                })];
        });
    });
}
/**
 * Gets profile data for a given username from a database.
 * @param {string} username - The username to get profile data for.
 * @returns {Promise} A promise that resolves to an object containing profile data.
 */
function getDataProfile(username) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // Gets the number of users with the given username.
                    db.get('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username], function (err, row) {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        }
                        else if (row.count === 0) {
                            // If no users were found, reject with an error.
                            var err_5 = new Error("User " + username + " does not exist.");
                            console.error(err_5.message);
                            reject(err_5);
                        }
                        else {
                            // Otherwise, get quizlet data for the user.
                            db.all('SELECT quizlet.quizlet_id, quizlet.quizlet_title, COUNT(*) AS word_count FROM history JOIN quizlet ON history.quizlet_id = quizlet.quizlet_id JOIN users ON history.user_id = users.id WHERE users.username = ? GROUP BY quizlet.quizlet_id, quizlet.quizlet_title', [username], function (err, rows) {
                                if (err) {
                                    console.error(err.message);
                                    reject(err);
                                }
                                else {
                                    // Sort the rows in descending order by word count.
                                    var sortedRows = rows.sort(function (a, b) { return b.word_count - a.word_count; });
                                    var labels = sortedRows.map(function (row) { return row.quizlet_title + " - " + row.quizlet_id; });
                                    // Get the word counts as data.
                                    var data = sortedRows.map(function (row) { return row.word_count; });
                                    // Return the labels and data as an object.
                                    var result = {
                                        labels: labels,
                                        data: data
                                    };
                                    resolve(result);
                                }
                            });
                        }
                    });
                    // Log a message to indicate that profile data is being retrieved.
                    logMessage('Getting Profile Data...', 'info');
                })];
        });
    });
}
app.post('/post/playtime', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, playtime, user, row, existingPlaytime, updatedPlaytime, err_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, playtime = _a.playtime;
                console.log(username);
                console.log(playtime);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 10, , 11]);
                return [4 /*yield*/, queryDb("\n\t\t\tCREATE TABLE IF NOT EXISTS playtime\n\t\t\t(\n\t\t\t\tid       INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\t\t\tuser_id  INTEGER NOT NULL DEFAULT 0,\n\t\t\t\tplaytime INTEGER NOT NULL DEFAULT 0\n\t\t\t)\n\t\t", [])];
            case 2:
                _b.sent();
                return [4 /*yield*/, queryDb("SELECT id FROM users WHERE username = ?", [username])];
            case 3:
                user = _b.sent();
                if (!user || user.length === 0) {
                    res.status(404).send('User not found');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, queryDb("SELECT playtime FROM playtime WHERE user_id = ?", [user[0].id])];
            case 4:
                row = _b.sent();
                if (!(row && row.length > 0)) return [3 /*break*/, 6];
                existingPlaytime = row[0].playtime;
                updatedPlaytime = existingPlaytime + playtime;
                return [4 /*yield*/, queryDb("UPDATE playtime\n\t\t\t\t\t\t\t\t SET playtime = ?\n\t\t\t\t\t\t\t\t WHERE user_id = ?", [updatedPlaytime, user[0].id])];
            case 5:
                _b.sent();
                res.send("Playtime updated for " + username);
                return [3 /*break*/, 8];
            case 6: return [4 /*yield*/, queryDb("INSERT INTO playtime (user_id, playtime)\n\t\t\t\t\t\t\t\t VALUES (?, ?)", [user[0].id, playtime])];
            case 7:
                _b.sent();
                res.send("Playtime inserted for " + username);
                _b.label = 8;
            case 8: return [4 /*yield*/, logMessage('Posting Playtime...', 'info')];
            case 9:
                _b.sent();
                return [3 /*break*/, 11];
            case 10:
                err_6 = _b.sent();
                console.error(err_6.message);
                res.status(500).send('Internal server error');
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
/**
 * Returns a promise that resolves after a given amount of time.
 * @param {number} ms - The amount of time to sleep in milliseconds.
 * @returns {Promise} A promise that resolves after the given amount of time has passed.
 */
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
/**
 * Fetches Quizlet terms for a given container ID
 * @param {number} id - the container ID to fetch terms for
 * @returns {Array<Object>} - an array of term objects
 */
function quizlet(id) {
    return __awaiter(this, void 0, void 0, function () {
        var res, currentLength, token, terms, page, res_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=" + id + "&filters%5BstudiableContainerType%5D=1&perPage=5&page=1").then(function (res) { return res.json(); })
                    // Initialize variables for pagination
                ];
                case 1:
                    res = _a.sent();
                    currentLength = 5;
                    token = res.responses[0].paging.token;
                    terms = res.responses[0].models.studiableItem;
                    page = 2;
                    _a.label = 2;
                case 2:
                    if (!(currentLength >= 5)) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetch("https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=" + id + "&filters%5BstudiableContainerType%5D=1&perPage=5&page=" + page++ + "&pagingToken=" + token).then(function (res) { return res.json(); })];
                case 3:
                    res_1 = _a.sent();
                    // Append the new terms to our array and update the pagination variables
                    terms.push.apply(terms, res_1.responses[0].models.studiableItem);
                    currentLength = res_1.responses[0].models.studiableItem.length;
                    token = res_1.responses[0].paging.token;
                    return [3 /*break*/, 2];
                case 4: 
                // Log a message indicating that we're fetching Quizlet data
                return [4 /*yield*/, logMessage('Getting Quizlet data...', 'info')];
                case 5:
                    // Log a message indicating that we're fetching Quizlet data
                    _a.sent();
                    // Return the array of terms
                    return [2 /*return*/, terms];
            }
        });
    });
}
/**
 * Fetches details of a Quizlet set from its ID.
 * @param {number} id - Quizlet set ID.
 * @returns {Object} - Object containing quizlet_title, termLang, and defLang.
 */
function getQuizletDetails(id) {
    return __awaiter(this, void 0, Promise, function () {
        var response, set;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("https://quizlet.com/webapi/3.4/sets/" + id, {
                        headers: {
                            'Content-Type': 'application/json;charset=utf-8'
                        }
                    }).then(function (res) { return res.json(); })];
                case 1:
                    response = _a.sent();
                    set = response.responses[0].models.set[0];
                    // Log a message indicating that Quizlet data is being fetched
                    logMessage('Getting Quizlet data...', 'info');
                    // Return an object with the necessary set details
                    return [2 /*return*/, {
                            quizlet_title: set.title,
                            termLang: set.wordLang,
                            defLang: set.defLang
                        }];
            }
        });
    });
}
app.get('/get/quizlet/list', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var rows, error_2, errorInfo;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                logMessage('Getting Quizlet list...', 'info');
                return [4 /*yield*/, queryDb('SELECT id, quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language FROM quizlet', [])];
            case 1:
                rows = _a.sent();
                console.log(rows);
                res.json(rows);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error(error_2);
                errorInfo = error_2.toString();
                logMessage(errorInfo, 'error');
                res.status(500).send('Internal server error');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * Queries a SQLite database using the provided SQL statement and parameters.
 *
 * @param {string} sql - The SQL statement to execute.
 * @param {Array} params - An array of parameters to substitute into the SQL statement.
 * @returns {Promise<Array>} - A promise that resolves with an array of rows returned by the query, or rejects with an error.
 */
function queryDb(sql, params) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            // Create a new promise that wraps the database query logic
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    // Serialize the database to ensure queries execute in order
                    db.serialize(function () {
                        // Execute the query with the provided SQL and parameters
                        db.all(sql, params, function (err, rows) {
                            // If an error occurred, reject the promise with the error
                            if (err) {
                                reject(err);
                            }
                            else {
                                // Otherwise, resolve the promise with the returned rows
                                resolve(rows);
                            }
                        });
                    });
                })];
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
function formatDuration(durationInMs) {
    return __awaiter(this, void 0, void 0, function () {
        var seconds, hours, minutes, remainingSeconds, parts;
        return __generator(this, function (_a) {
            seconds = Math.floor(durationInMs / 1000);
            hours = Math.floor(seconds / 3600);
            minutes = Math.floor((seconds % 3600) / 60);
            remainingSeconds = seconds % 60;
            parts = [];
            if (hours > 0) {
                parts.push(hours + " hour" + (hours === 1 ? '' : 's'));
            }
            if (minutes > 0) {
                parts.push(minutes + " minute" + (minutes === 1 ? '' : 's'));
            }
            if (remainingSeconds > 0 || parts.length === 0) {
                parts.push(remainingSeconds + " second" + (remainingSeconds === 1 ? '' : 's'));
            }
            // Join parts array into formatted duration string
            return [2 /*return*/, parts.join(' ')];
        });
    });
}
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp({
        format: function () {
            return moment().tz('Pacific/Auckland').format('YYYY-MM-DD HH:mm:ss');
        }
    }), winston.format.json()),
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
    ]
});
/**
 * Logs a message with the specified log level and adds metadata about the caller's file and line number.
 * @param {string} message - The message to log.
 * @param {string} level - The log level to use (e.g. 'info', 'warn', 'error').
 */
var logMessage = function (message, level) { return __awaiter(void 0, void 0, void 0, function () {
    var stack, callerFile, callerLine, meta;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, StackTrace.get()];
            case 1:
                stack = _a.sent();
                callerFile = stack[1].fileName;
                callerLine = stack[1].lineNumber;
                meta = {
                    file: callerFile,
                    line: callerLine
                };
                currentDateLogsDir = path.join(logsDir, moment().tz('Pacific/Auckland').format('YYYY-MM-DD'));
                console.log(level, message, meta);
                // Call the logger with the specified level, message and metadata.
                logger.log(level, message, meta, currentDateLogsDir);
                return [2 /*return*/];
        }
    });
}); };
checkAndCreateDir();
app.listen(port, address, function () {
    console.log("Server listening on http://" + address + ":" + port);
});
