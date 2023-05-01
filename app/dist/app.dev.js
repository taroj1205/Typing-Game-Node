"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('dotenv').config();

var express_1 = __importDefault(require("express"));

var path = require('path');

var sqlite3 = require('sqlite3').verbose();

var fs = require('fs');

var bcrypt = require('bcrypt');

var handlebars = require('handlebars');

var winston = require('winston');

var moment = require('moment-timezone');

var StackTrace = require('stacktrace-js');

var uuid = require('uuid');

var app = (0, express_1["default"])();
var port = Number(process.env.APP_LISTEN_PORT || 3000);
var address = process.env.APP_LISTEN_IP_ADDRESS || '0.0.0.0';

var Kuroshiro = require('kuroshiro')["default"];

var KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

var kuroshiro = new Kuroshiro();
kuroshiro.init(new KuromojiAnalyzer());
var dataPath = path.join(__dirname, 'data');
var db = new sqlite3.Database(path.join(dataPath, 'database.db'));
app.use(express_1["default"].json());
app.use(express_1["default"]["static"](path.resolve(__dirname, 'public')));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.get('/', function (req, res) {
  logMessage('Sending index.html...', 'info');

  try {
    res.sendFile(path.join(__dirname, 'public', 'html', 'main', 'index.html'));
  } catch (error) {
    logMessage(error.message, 'error');
  }
});
/**
 * Returns a formatted timestamp in the format of 'yyyy-mm-ddThh:mm:ss' for the Pacific/Auckland timezone.
 * @returns {string} The formatted timestamp.
 */

function getTimestamp() {
  // get the current date and time
  var now = new Date(); // set options for formatting the date and time

  var options = {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }; // format the date and time using the specified options

  var formattedDate = now.toLocaleString('ja-JP', options); // replace the forward slashes with dashes to match the desired format

  var timestamp = formattedDate.replace(/\//g, '-'); // return the formatted timestamp

  return timestamp;
}
/**
 * Generates a unique authentication token for the given user and saves it to the database.
 * @param {string} username - The username of the user.
 * @returns {Promise<AuthToken>} - An object containing the generated authentication token and its expiration date.
 */


function generateAuthToken(username) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var timeNow, timeZone, date, options, uniqueAuthToken, authToken, expirationDate, hashedAuthToken;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // Get the current timestamp
            timeNow = getTimestamp(); // Set the time zone

            timeZone = 'Pacific/Auckland'; // Set the expiration date to 7 days from now

            date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Set the options for formatting the date string

            options = {
              timeZone: timeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }; // Generate a random authentication token

            _context.next = 6;
            return getUniqueAuthToken();

          case 6:
            uniqueAuthToken = _context.sent;
            authToken = uniqueAuthToken === null || uniqueAuthToken === void 0 ? void 0 : uniqueAuthToken.authToken;
            expirationDate = (uniqueAuthToken === null || uniqueAuthToken === void 0 ? void 0 : uniqueAuthToken.expirationDate) ? new Date(uniqueAuthToken.expirationDate) : date; // Check that the authToken exists before hashing it

            if (authToken) {
              _context.next = 11;
              break;
            }

            throw new Error('Could not generate auth token.');

          case 11:
            // Log the current timestamp
            console.log(timeNow); // Output: "2023-03-29 08:15:30"
            // Log the generated authentication token

            console.log(authToken); // Hash the authentication token

            _context.next = 15;
            return bcrypt.hash(authToken, 10);

          case 15:
            hashedAuthToken = _context.sent;
            _context.next = 18;
            return queryDb("UPDATE users\n                       SET auth_token            = ?,\n                           auth_token_expiration = ?,\n                           last_login_at         = ?\n                       WHERE username = ?", [hashedAuthToken, expirationDate, timeNow, username]);

          case 18:
            // Log a message indicating that the authentication token has been generated
            console.log("Generated auth token.");
            logMessage('Generating auth token...', 'info'); // Return the authentication token and its expiration date

            return _context.abrupt("return", {
              authToken: authToken,
              expirationDate: expirationDate
            });

          case 21:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
}

function getUniqueAuthToken() {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var authToken, existingUser, user, _expirationDate, expirationDate;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // Generate a unique authentication token
            authToken = uuid.v4(); // Check if a user with the same token already exists

            _context2.next = 3;
            return queryDb("\n    SELECT auth_token, auth_token_expiration\n    FROM users\n    WHERE auth_token = ?\n  ", [authToken]);

          case 3:
            existingUser = _context2.sent;

            if (!(existingUser && existingUser.length > 0)) {
              _context2.next = 16;
              break;
            }

            user = existingUser[0];

            if (!user.authToken) {
              _context2.next = 16;
              break;
            }

            if (!user.expirationDate) {
              _context2.next = 13;
              break;
            }

            // Check if the existing token has expired
            _expirationDate = new Date(user.expirationDate);

            if (!(_expirationDate > new Date())) {
              _context2.next = 11;
              break;
            }

            return _context2.abrupt("return", {
              authToken: user.authToken,
              expirationDate: _expirationDate
            });

          case 11:
            _context2.next = 16;
            break;

          case 13:
            _context2.next = 15;
            return queryDb("\n          UPDATE users\n          SET auth_token_expiration = NULL\n          WHERE auth_token = ?\n        ", [user.authToken]);

          case 15:
            return _context2.abrupt("return", {
              authToken: user.authToken
            });

          case 16:
            // Create a new token with an expiration date
            expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7); // Set the expiration date to 7 days from now

            _context2.next = 20;
            return queryDb("\n      INSERT INTO users (auth_token, auth_token_expiration)\n      VALUES (?, ?)\n    ", [authToken, expirationDate]);

          case 20:
            return _context2.abrupt("return", {
              authToken: authToken,
              expirationDate: expirationDate
            });

          case 21:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
}
/**
 * Authenticates a user with a given token.
 *
 * @param {string} token - The authentication token.
 * @returns {string|null} The authenticated username, or null if authentication failed.
 */


function authenticateUser(token) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var rows, username, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, row, match, timeNow;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return queryDb("SELECT auth_token, username FROM users", []);

          case 3:
            rows = _context3.sent;
            console.log('All users:', rows); // Find a user with a matching token and extract their username.

            username = null;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context3.prev = 9;
            _iterator = rows[Symbol.iterator]();

          case 11:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context3.next = 22;
              break;
            }

            row = _step.value;
            _context3.next = 15;
            return bcrypt.compare(token, row.auth_token);

          case 15:
            match = _context3.sent;

            if (!match) {
              _context3.next = 19;
              break;
            }

            username = row.username;
            return _context3.abrupt("break", 22);

          case 19:
            _iteratorNormalCompletion = true;
            _context3.next = 11;
            break;

          case 22:
            _context3.next = 28;
            break;

          case 24:
            _context3.prev = 24;
            _context3.t0 = _context3["catch"](9);
            _didIteratorError = true;
            _iteratorError = _context3.t0;

          case 28:
            _context3.prev = 28;
            _context3.prev = 29;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 31:
            _context3.prev = 31;

            if (!_didIteratorError) {
              _context3.next = 34;
              break;
            }

            throw _iteratorError;

          case 34:
            return _context3.finish(31);

          case 35:
            return _context3.finish(28);

          case 36:
            if (username) {
              _context3.next = 38;
              break;
            }

            throw new Error('Invalid token');

          case 38:
            // Update the user's last login time to the current time.
            timeNow = getTimestamp();
            console.log('Current timestamp:', timeNow);
            _context3.next = 42;
            return queryDb("UPDATE users\n                             SET last_login_at = ?\n                             WHERE username = ?", [timeNow, username]);

          case 42:
            // Log a success message and return the authenticated username.
            console.log("User ".concat(username, " authenticated successfully."));
            return _context3.abrupt("return", username);

          case 46:
            _context3.prev = 46;
            _context3.t1 = _context3["catch"](0);
            // Log an error message and return null if authentication failed.
            console.log('Authentication failed:', _context3.t1.message);
            return _context3.abrupt("return", null);

          case 50:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 46], [9, 24, 28, 36], [29,, 31, 35]]);
  }));
}

app.post('/auth', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var token, username;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            token = req.body.auth_token;
            console.log(token);
            _context4.next = 4;
            return authenticateUser(token);

          case 4:
            username = _context4.sent;
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

          case 7:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
});
app.post('/login', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5() {
    var _req$body, username, password, user, _ref, authToken, expirationDate;

    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _req$body = req.body, username = _req$body.username, password = _req$body.password;
            username = username.trim();
            console.log(username, password);
            checkAndCreateDir();
            _context5.next = 6;
            return db.serialize(function () {
              db.run("\n\t\t\tCREATE TABLE IF NOT EXISTS users\n\t\t\t(\n\t\t\t\tid                    INTEGER PRIMARY KEY,\n\t\t\t\tusername              TEXT      NOT NULL,\n\t\t\t\tpassword              TEXT      NOT NULL,\n\t\t\t\tcreated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\t\t\t\tauth_token            TEXT               DEFAULT NULL,\n\t\t\t\tauth_token_expiration TEXT               DEFAULT NULL,\n\t\t\t\tlast_login_at         TEXT               DEFAULT NULL\n\t\t\t);\n\t\t");
              logMessage('Creating users table...', 'info');
            });

          case 6:
            _context5.prev = 6;
            _context5.next = 9;
            return findUser(username);

          case 9:
            user = _context5.sent;
            _context5.next = 12;
            return validateCredentials(user, username, password);

          case 12:
            _context5.next = 14;
            return generateAuthToken(username);

          case 14:
            _ref = _context5.sent;
            authToken = _ref.authToken;
            expirationDate = _ref.expirationDate;
            return _context5.abrupt("return", res.json({
              success: true,
              auth_token: authToken,
              expires_at: expirationDate
            }));

          case 20:
            _context5.prev = 20;
            _context5.t0 = _context5["catch"](6);
            console.error(_context5.t0);
            return _context5.abrupt("return", res.json({
              success: false,
              error: 'Invalid credentials.'
            }));

          case 24:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[6, 20]]);
  }));
});
/**
 * Finds a user in the database based on their username
 * @param {string} username - The username to search for
 * @returns {Promise<Object>} - A Promise that resolves with the user object if found, or rejects with an error if not found
 */

function findUser(username) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6() {
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            return _context6.abrupt("return", new Promise(function (resolve, reject) {
              // Execute a SQL query to find the user
              db.get("SELECT *\n\t\t\t\tFROM users\n\t\t\t\tWHERE username = ?", [username], function (err, row) {
                if (err) {
                  // If there was an error, reject the Promise with the error object
                  reject(err);
                } else {
                  // If the user was found, resolve the Promise with the user object
                  resolve(row);
                } // This code is unreachable because the Promise is already resolved or rejected.
                // It should be removed.


                logMessage('Finding User...', 'info');
              });
            }));

          case 1:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
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
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee7() {
    var hashedPassword, timeNow, isMatch, _timeNow;

    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            console.log(password); // Log password for debugging purposes

            if (user) {
              _context7.next = 12;
              break;
            }

            _context7.next = 4;
            return bcrypt.hash(password, 10);

          case 4:
            hashedPassword = _context7.sent;
            // Hash password
            timeNow = getTimestamp(); // Get current timestamp

            console.log(timeNow); // Log timestamp for debugging purposes

            db.run("INSERT OR IGNORE INTO users (username, password, created_at)\n             VALUES (?, ?, ?)", [username, hashedPassword, timeNow]); // Insert new user into database

            console.log("Created new account."); // Log success

            logMessage("Creating New Account...", "info"); // Log to external logging service

            _context7.next = 26;
            break;

          case 12:
            _context7.next = 14;
            return bcrypt.compare(password, user.password);

          case 14:
            isMatch = _context7.sent;

            if (isMatch) {
              _context7.next = 21;
              break;
            }

            _context7.next = 18;
            return sleep(5000);

          case 18:
            throw new Error("Incorrect password.");

          case 21:
            // If passwords match, update last login time
            _timeNow = getTimestamp(); // Get current timestamp

            console.log(_timeNow); // Log timestamp for debugging purposes

            db.run("UPDATE users SET last_login_at = ? WHERE username = ?", [_timeNow, username]); // Update user's last login time in database

            console.log("Updated last login time."); // Log success

            logMessage("Updating last login time...", "info"); // Log to external logging service

          case 26:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
}

app.get('/get/quizlet/data', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee8() {
    var quizlet_id, url, quizlet_id_match, terms, term, def, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _step2$value$cardSide, _step2$value$cardSide2, termText, _step2$value$cardSide3, defText, _ref2, quizlet_title, termLang, defLang;

    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            quizlet_id = req.query.quizlet_id;
            url = req.query.url;
            console.log(quizlet_id);

            if (!(!quizlet_id && url)) {
              _context8.next = 11;
              break;
            }

            quizlet_id_match = url.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);

            if (!quizlet_id_match) {
              _context8.next = 10;
              break;
            }

            quizlet_id = quizlet_id_match[1];
            _context8.next = 11;
            break;

          case 10:
            return _context8.abrupt("return");

          case 11:
            checkAndCreateDir();
            _context8.next = 14;
            return quizlet(Number(quizlet_id));

          case 14:
            terms = _context8.sent;
            term = [];
            def = [];
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context8.prev = 20;

            for (_iterator2 = terms[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              _step2$value$cardSide = _slicedToArray(_step2.value.cardSides, 2), _step2$value$cardSide2 = _slicedToArray(_step2$value$cardSide[0].media, 1), termText = _step2$value$cardSide2[0].plainText, _step2$value$cardSide3 = _slicedToArray(_step2$value$cardSide[1].media, 1), defText = _step2$value$cardSide3[0].plainText;
              term.push(termText);
              def.push(defText);
              console.log(termText, defText);
            }

            _context8.next = 28;
            break;

          case 24:
            _context8.prev = 24;
            _context8.t0 = _context8["catch"](20);
            _didIteratorError2 = true;
            _iteratorError2 = _context8.t0;

          case 28:
            _context8.prev = 28;
            _context8.prev = 29;

            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }

          case 31:
            _context8.prev = 31;

            if (!_didIteratorError2) {
              _context8.next = 34;
              break;
            }

            throw _iteratorError2;

          case 34:
            return _context8.finish(31);

          case 35:
            return _context8.finish(28);

          case 36:
            _context8.next = 38;
            return getQuizletDetails(Number(quizlet_id));

          case 38:
            _ref2 = _context8.sent;
            quizlet_title = _ref2.quizlet_title;
            termLang = _ref2.termLang;
            defLang = _ref2.defLang;
            db.serialize(function () {
              db.run("CREATE TABLE IF NOT EXISTS quizlet\n\t\t\t\t\t(\n\t\t\t\t\t\tid                    INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\t\t\t\t\tquizlet_id            TEXT,\n\t\t\t\t\t\tquizlet_title         TEXT,\n\t\t\t\t\t\tquizlet_def_language  TEXT,\n\t\t\t\t\t\tquizlet_term_language TEXT,\n\t\t\t\t\t\tUNIQUE (quizlet_id)\n\t\t\t\t\t)");
              db.get('SELECT * FROM quizlet WHERE quizlet_id = ?', [quizlet_id], function (err, row) {
                if (err) {
                  console.error(err.message);
                  res.status(500).send('Internal server error');
                } else {
                  if (!row) {
                    db.run('INSERT INTO quizlet (quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language) VALUES (?, ?, ?, ?)', [quizlet_id, quizlet_title, defLang, termLang], function (err) {
                      if (err) {
                        console.error(err.message);
                        res.status(500).send('Internal server error');
                      } else {
                        res.json({
                          term: term,
                          def: def,
                          quizlet_title: quizlet_title,
                          quizlet_id: quizlet_id
                        });
                      }
                    });
                  } else {
                    db.run('UPDATE quizlet SET quizlet_title = ?, quizlet_def_language = ?, quizlet_term_language = ? WHERE quizlet_id = ?', [quizlet_title, defLang, termLang, quizlet_id], function (err) {
                      if (err) {
                        console.error(err.message);
                        res.status(500).send('Internal server error');
                      } else {
                        res.json({
                          term: term,
                          def: def,
                          quizlet_title: quizlet_title,
                          quizlet_id: quizlet_id
                        });
                      }
                    });
                  }
                }
              });
            });
            logMessage('Getting Quizlet Data...', 'info');
            _context8.next = 50;
            break;

          case 46:
            _context8.prev = 46;
            _context8.t1 = _context8["catch"](0);
            console.error(_context8.t1);
            return _context8.abrupt("return", res.status(500).send('Error retrieving Quizlet data'));

          case 50:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[0, 46], [20, 24, 28, 36], [29,, 31, 35]]);
  }));
});
/**
 * Checks if the directory exists, creates it if it doesn't, and logs the action.
 */

function checkAndCreateDir() {
  // Check if directory already exists
  if (fs.existsSync(dataPath)) {
    console.log("Directory already exists at ".concat(dataPath));
  } else {
    // Create directory if it doesn't exist
    fs.mkdirSync(dataPath, {
      recursive: true
    });
    console.log("Created directory at ".concat(dataPath));
  } // Log message indicating that data directory is being created


  logMessage('Creating data Directory...', 'info');
}

app.post('/post/typed', function (req, res) {
  var _req$body2 = req.body,
      def = _req$body2.def,
      term = _req$body2.term,
      randomIndex = _req$body2.randomIndex,
      username = _req$body2.username,
      quizlet_id = _req$body2.quizlet_id;
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
        db.run('ALTER TABLE history ADD COLUMN word_number INTEGER AFTER quizlet_id');
        var timeNow = getTimestamp();
        console.log(timeNow); // Output: "2023-03-29 08:15:30"

        db.run('INSERT INTO history (user_id, quizlet_id, word_number, def, term, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, quizlet_id, randomIndex, def, term, timeNow], function (err) {
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
app.get('/get/history', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee9() {
    var _req$query, username, quizlet_id;

    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _req$query = req.query, username = _req$query.username, quizlet_id = _req$query.quizlet_id;
            console.log(username, quizlet_id);
            checkAndCreateDir();
            db.serialize(function () {
              db.run('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, quizlet_id INTEGER, def TEXT, term TEXT, created_at TEXT)');
            });
            _context9.next = 6;
            return db.serialize(function () {
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
            });

          case 6:
            logMessage('Getting history...', 'info');

          case 7:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));
});
app.get('/get/furigana', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee10() {
    var word, result, furigana;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            word = req.query.word; // Check if the term has kanji

            result = Kuroshiro.Util.hasKanji(word);

            if (!(result === true)) {
              _context10.next = 11;
              break;
            }

            _context10.next = 5;
            return kuroshiro.convert(word, {
              mode: "furigana",
              to: "hiragana"
            });

          case 5:
            furigana = _context10.sent;
            console.log(furigana);
            logMessage('Getting Furigana...', 'info');
            res.json({
              furigana: furigana
            });
            _context10.next = 13;
            break;

          case 11:
            res.json({
              furigana: word
            });
            logMessage('Sending back word with no furigana...', 'info');

          case 13:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));
});
app.get('/leaderboard', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee11() {
    var quizlet_id, playtimeRows, userRows, userIdToUsername, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, row, leaderboard, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, _row, _i2, _leaderboard, entry, templatePath, templateSource, template, html, _ref3, _ref4, quizlet_title, rows, rankList, labels, data, _templatePath, _templateSource, _template, _html, _html2;

    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            quizlet_id = req.query.quizlet_id;
            console.log(quizlet_id);
            checkAndCreateDir();
            _context11.prev = 3;

            if (!(req.query.quizlet_id === undefined)) {
              _context11.next = 70;
              break;
            }

            _context11.next = 7;
            return queryDb("SELECT * FROM playtime", []);

          case 7:
            playtimeRows = _context11.sent;
            _context11.next = 10;
            return queryDb("SELECT * FROM users", []);

          case 10:
            userRows = _context11.sent;
            userIdToUsername = {};
            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            _context11.prev = 15;

            for (_iterator3 = userRows[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              row = _step3.value;
              userIdToUsername[row.id] = row.username;
            }

            _context11.next = 23;
            break;

          case 19:
            _context11.prev = 19;
            _context11.t0 = _context11["catch"](15);
            _didIteratorError3 = true;
            _iteratorError3 = _context11.t0;

          case 23:
            _context11.prev = 23;
            _context11.prev = 24;

            if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
              _iterator3["return"]();
            }

          case 26:
            _context11.prev = 26;

            if (!_didIteratorError3) {
              _context11.next = 29;
              break;
            }

            throw _iteratorError3;

          case 29:
            return _context11.finish(26);

          case 30:
            return _context11.finish(23);

          case 31:
            leaderboard = [];
            _iteratorNormalCompletion4 = true;
            _didIteratorError4 = false;
            _iteratorError4 = undefined;
            _context11.prev = 35;

            for (_iterator4 = playtimeRows[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              _row = _step4.value;
              leaderboard.push({
                username: userIdToUsername[_row.user_id],
                playtime: _row.playtime.toString() // Change to string type

              });
            }

            _context11.next = 43;
            break;

          case 39:
            _context11.prev = 39;
            _context11.t1 = _context11["catch"](35);
            _didIteratorError4 = true;
            _iteratorError4 = _context11.t1;

          case 43:
            _context11.prev = 43;
            _context11.prev = 44;

            if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
              _iterator4["return"]();
            }

          case 46:
            _context11.prev = 46;

            if (!_didIteratorError4) {
              _context11.next = 49;
              break;
            }

            throw _iteratorError4;

          case 49:
            return _context11.finish(46);

          case 50:
            return _context11.finish(43);

          case 51:
            leaderboard.sort(function (a, b) {
              return +b.playtime - +a.playtime;
            });
            _i2 = 0, _leaderboard = leaderboard;

          case 53:
            if (!(_i2 < _leaderboard.length)) {
              _context11.next = 61;
              break;
            }

            entry = _leaderboard[_i2];
            _context11.next = 57;
            return formatDuration(Number(entry.playtime));

          case 57:
            entry.playtime = _context11.sent;

          case 58:
            _i2++;
            _context11.next = 53;
            break;

          case 61:
            templatePath = path.join(__dirname, 'public', 'html', 'leaderboard', 'index.html');
            templateSource = fs.readFileSync(templatePath, 'utf8');
            template = handlebars.compile(templateSource);
            html = template({
              leaderboard: leaderboard
            });
            console.log("Sending ", html);
            res.header('Content-Type', 'text/html');
            res.send(html);
            _context11.next = 94;
            break;

          case 70:
            _context11.next = 72;
            return queryDb('SELECT quizlet_title FROM quizlet WHERE quizlet_id = ?', [quizlet_id]);

          case 72:
            _ref3 = _context11.sent;
            _ref4 = _slicedToArray(_ref3, 1);
            quizlet_title = _ref4[0].quizlet_title;
            _context11.next = 77;
            return queryDb('SELECT u.id AS user_id, u.username, COUNT(h.id) AS word_count FROM users u LEFT JOIN history h ON u.id = h.user_id AND h.quizlet_id = ? GROUP BY u.id HAVING word_count > 0 ORDER BY word_count DESC', [quizlet_id]);

          case 77:
            rows = _context11.sent;
            console.log(rows);
            rankList = rows.map(function (row) {
              return {
                username: row.username,
                word_count: row.word_count,
                profile_url: "/profile?user=".concat(row.username)
              };
            });
            labels = JSON.stringify(rows.map(function (row) {
              return row.username;
            }));
            data = JSON.stringify(rows.map(function (row) {
              return row.word_count;
            }));
            _templatePath = path.join(__dirname, 'public', 'html', 'leaderboard', 'index.html');
            _templateSource = fs.readFileSync(_templatePath, 'utf8');
            _template = handlebars.compile(_templateSource);
            _html = _template({
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
            res.send(_html);
            _context11.next = 94;
            return logMessage('Sending Leaderboard...', 'info');

          case 94:
            _context11.next = 104;
            break;

          case 96:
            _context11.prev = 96;
            _context11.t2 = _context11["catch"](3);
            console.error(_context11.t2.message);
            _html2 = "<!DOCTYPE html><html><head><title>Leaderboard - ".concat(quizlet_id, "</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0\"><link rel=\"icon\" type=\"image/x-icon\" href=\"/image/favicon/favicon.ico\" /><link rel=\"stylesheet\" type=\"text/css\" href=\"/css/leaderboard/style.css\" /></head><body>");
            _html2 += "<h1>Leaderboard - ".concat(quizlet_id, "</h1><p>No one has typed any words yet!</p>");
            console.log("Sending ", _html2);
            res.header('Content-Type', 'text/html');
            res.send("".concat(_html2, "</body></html>"));

          case 104:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, null, [[3, 96], [15, 19, 23, 31], [24,, 26, 30], [35, 39, 43, 51], [44,, 46, 50]]);
  }));
});
app.get('/profile', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee12() {
    var username, result, count_per_day, labelsLine, dataLine, labels, data, minValue, maxValue, gradient, colors, background, playtimeMS, playtime, templatePath, templateSource, template, html, _html3;

    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            username = req.query.user !== undefined ? req.query.user : '';
            checkAndCreateDir();
            _context12.prev = 2;
            _context12.next = 5;
            return getDataProfile(username);

          case 5:
            result = _context12.sent;

            if (!(result.length !== 0)) {
              _context12.next = 32;
              break;
            }

            _context12.next = 9;
            return getWordCountPerDay(username);

          case 9:
            count_per_day = _context12.sent;
            labelsLine = JSON.stringify(count_per_day.map(function (item) {
              return item.day;
            }));
            console.log(labelsLine);
            dataLine = count_per_day.map(function (item) {
              return item.count_on_the_day;
            });
            labels = JSON.stringify(result.labels);
            data = JSON.stringify(result.data);
            minValue = Math.min.apply(Math, _toConsumableArray(result.data));
            maxValue = Math.max.apply(Math, _toConsumableArray(result.data));

            gradient = function gradient(value) {
              if (maxValue === minValue) {
                var hue = (200 - 0.5 * 200).toString(10);
                return "hsl(".concat(hue, ", 70%, 60%)");
              } else {
                var position = (value - minValue) / (maxValue - minValue);

                var _hue = (200 - position * 200).toString(10);

                return "hsl(".concat(_hue, ", 70%, 60%)");
              }
            };

            colors = JSON.stringify(result.data.map(function (value) {
              return gradient(value);
            }));
            background = JSON.stringify(result.data.map(function () {
              return '#22587d';
            }));
            _context12.next = 22;
            return getPlaytime(username);

          case 22:
            playtimeMS = _context12.sent;
            _context12.next = 25;
            return formatDuration(playtimeMS).then(function (formattedTime) {
              playtime = formattedTime;
            })["catch"](function (error) {
              console.error(error);
            });

          case 25:
            console.log(playtime);
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
              playtime: playtime
            });
            res.header('Content-Type', 'text/html');
            res.send(html);

          case 32:
            _context12.next = 34;
            return logMessage('Sending Profile Page...', 'info');

          case 34:
            _context12.next = 43;
            break;

          case 36:
            _context12.prev = 36;
            _context12.t0 = _context12["catch"](2);
            console.log(_context12.t0.message);
            _html3 = "<!DOCTYPE html><html><head><title>Profile - ".concat(username, "</title><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0\"><link rel=\"icon\" type=\"image/x-icon\" href=\"/image/facicon/favicon.ico\" /><link rel=\"stylesheet\" type=\"text/css\" href=\"/css/profile/style.css\" /></head><body>");
            _html3 += "<h1>".concat(username, "'s profile</h1>");
            _html3 += "<p>".concat(username, " has not typed any words yet.</p>");
            res.send(_html3);

          case 43:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, null, [[2, 36]]);
  }));
});
/**
 * Gets the playtime of a given user from the database.
 * @param {string} username - The username of the user to retrieve the playtime for.
 * @returns {number} The playtime of the user.
 */

function getPlaytime(username) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee13() {
    var user, row;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.next = 2;
            return queryDb("SELECT id FROM users WHERE username = ?", [username]);

          case 2:
            user = _context13.sent;

            if (user) {
              _context13.next = 5;
              break;
            }

            return _context13.abrupt("return", 0);

          case 5:
            _context13.next = 7;
            return queryDb("SELECT playtime FROM playtime WHERE user_id = ? LIMIT 1", [user]);

          case 7:
            row = _context13.sent;

            if (!(!row || !row[0])) {
              _context13.next = 10;
              break;
            }

            return _context13.abrupt("return", 0);

          case 10:
            _context13.next = 12;
            return logMessage('Getting Playtime...', 'info');

          case 12:
            return _context13.abrupt("return", row[0].playtime);

          case 13:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13);
  }));
}
/**
 * Returns an array of word counts per day for a given username from a SQLite database.
 * @param {string} username - The username to get word counts for.
 * @returns {Promise} - A Promise that resolves with an array of objects representing word counts per day.
 */


function getWordCountPerDay(username) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee14() {
    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            return _context14.abrupt("return", new Promise(function (resolve, reject) {
              db.all("\n\t\t\tSELECT DATE(history.created_at) AS day, COUNT(*) AS word_count\n\t\t\tFROM history\n\t\t\t\t\t JOIN users ON history.user_id = users.id\n\t\t\tWHERE users.username = ?\n\t\t\tGROUP BY day;\n\t\t", [username], function (err, rows) {
                if (err) {
                  console.error(err.message);
                  reject(err);
                } else {
                  // Map the rows to an array of objects with day and count_on_the_day properties
                  var wordCountPerDay = rows.map(function (row) {
                    return {
                      day: row.day,
                      count_on_the_day: row.word_count
                    };
                  }); // Log a message indicating that we're getting word counts

                  logMessage('Getting Word Counts...', 'info'); // Resolve the Promise with the array of word counts per day

                  resolve(wordCountPerDay);
                }
              });
            }));

          case 1:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));
}
/**
 * Gets profile data for a given username from a database.
 * @param {string} username - The username to get profile data for.
 * @returns {Promise} A promise that resolves to an object containing profile data.
 */


function getDataProfile(username) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee15() {
    return regeneratorRuntime.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            return _context15.abrupt("return", new Promise(function (resolve, reject) {
              // Gets the number of users with the given username.
              db.get('SELECT COUNT(*) AS count FROM users WHERE username = ?', [username], function (err, row) {
                if (err) {
                  console.error(err.message);
                  reject(err);
                } else if (row.count === 0) {
                  // If no users were found, reject with an error.
                  var _err = new Error("User ".concat(username, " does not exist."));

                  console.error(_err.message);
                  reject(_err);
                } else {
                  // Otherwise, get quizlet data for the user.
                  db.all('SELECT quizlet.quizlet_id, quizlet.quizlet_title, COUNT(*) AS word_count FROM history JOIN quizlet ON history.quizlet_id = quizlet.quizlet_id JOIN users ON history.user_id = users.id WHERE users.username = ? GROUP BY quizlet.quizlet_id, quizlet.quizlet_title', [username], function (err, rows) {
                    if (err) {
                      console.error(err.message);
                      reject(err);
                    } else {
                      // Sort the rows in descending order by word count.
                      var sortedRows = rows.sort(function (a, b) {
                        return b.word_count - a.word_count;
                      });
                      var labels = sortedRows.map(function (row) {
                        return "".concat(row.quizlet_title, " - ").concat(row.quizlet_id);
                      }); // Get the word counts as data.

                      var data = sortedRows.map(function (row) {
                        return row.word_count;
                      }); // Return the labels and data as an object.

                      var result = {
                        labels: labels,
                        data: data
                      };
                      resolve(result);
                    }
                  });
                }
              }); // Log a message to indicate that profile data is being retrieved.

              logMessage('Getting Profile Data...', 'info');
            }));

          case 1:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15);
  }));
}

app.post('/post/playtime', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee16() {
    var _req$body3, username, playtime, user, row, existingPlaytime, updatedPlaytime;

    return regeneratorRuntime.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _req$body3 = req.body, username = _req$body3.username, playtime = _req$body3.playtime;
            console.log(username);
            console.log(playtime);
            _context16.prev = 3;
            _context16.next = 6;
            return queryDb("\n\t\t\tCREATE TABLE IF NOT EXISTS playtime\n\t\t\t(\n\t\t\t\tid       INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\t\t\tuser_id  INTEGER NOT NULL DEFAULT 0,\n\t\t\t\tplaytime INTEGER NOT NULL DEFAULT 0\n\t\t\t)\n\t\t", []);

          case 6:
            _context16.next = 8;
            return queryDb("SELECT id FROM users WHERE username = ?", [username]);

          case 8:
            user = _context16.sent;

            if (!(!user || user.length === 0)) {
              _context16.next = 12;
              break;
            }

            res.status(404).send('User not found');
            return _context16.abrupt("return");

          case 12:
            _context16.next = 14;
            return queryDb("SELECT playtime FROM playtime WHERE user_id = ?", [user[0].id]);

          case 14:
            row = _context16.sent;

            if (!(row && row.length > 0)) {
              _context16.next = 23;
              break;
            }

            existingPlaytime = row[0].playtime;
            updatedPlaytime = existingPlaytime + playtime;
            _context16.next = 20;
            return queryDb("UPDATE playtime\n\t\t\t\t\t\t\t\t SET playtime = ?\n\t\t\t\t\t\t\t\t WHERE user_id = ?", [updatedPlaytime, user[0].id]);

          case 20:
            res.send("Playtime updated for ".concat(username));
            _context16.next = 26;
            break;

          case 23:
            _context16.next = 25;
            return queryDb("INSERT INTO playtime (user_id, playtime)\n\t\t\t\t\t\t\t\t VALUES (?, ?)", [user[0].id, playtime]);

          case 25:
            res.send("Playtime inserted for ".concat(username));

          case 26:
            _context16.next = 28;
            return logMessage('Posting Playtime...', 'info');

          case 28:
            _context16.next = 34;
            break;

          case 30:
            _context16.prev = 30;
            _context16.t0 = _context16["catch"](3);
            console.error(_context16.t0.message);
            res.status(500).send('Internal server error');

          case 34:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16, null, [[3, 30]]);
  }));
});
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
 * @returns {Array<Card>} - an array of card objects
 */


function quizlet(id) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee17() {
    var res, currentLength, token, cards, page, _res;

    return regeneratorRuntime.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.next = 2;
            return fetch("https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=".concat(id, "&filters%5BstudiableContainerType%5D=1&perPage=5&page=1")).then(function (res) {
              return res.json();
            });

          case 2:
            res = _context17.sent;
            // Initialize variables for pagination
            currentLength = 5;
            token = res.responses[0].paging.token;
            cards = res.responses[0].models.studiableItem.map(function (item) {
              return {
                cardSides: item.sides.map(function (side) {
                  return {
                    media: [{
                      plainText: side.text
                    }]
                  };
                })
              };
            });
            page = 2; // Keep fetching pages until we get less than 5 terms

          case 7:
            if (!(currentLength >= 5)) {
              _context17.next = 16;
              break;
            }

            _context17.next = 10;
            return fetch("https://quizlet.com/webapi/3.4/studiable-item-documents?filters%5BstudiableContainerId%5D=".concat(id, "&filters%5BstudiableContainerType%5D=1&perPage=5&page=").concat(page++, "&pagingToken=").concat(token)).then(function (res) {
              return res.json();
            });

          case 10:
            _res = _context17.sent;
            // Append the new terms to our array and update the pagination variables
            cards.push.apply(cards, _toConsumableArray(_res.responses[0].models.studiableItem.map(function (item) {
              return {
                cardSides: item.sides.map(function (side) {
                  return {
                    media: [{
                      plainText: side.text
                    }]
                  };
                })
              };
            })));
            currentLength = _res.responses[0].models.studiableItem.length;
            token = _res.responses[0].paging.token;
            _context17.next = 7;
            break;

          case 16:
            _context17.next = 18;
            return logMessage('Getting Quizlet data...', 'info');

          case 18:
            return _context17.abrupt("return", cards);

          case 19:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17);
  }));
}
/**
 * Fetches details of a Quizlet set from its ID.
 * @param {number} id - Quizlet set ID.
 * @returns {Object} - Object containing quizlet_title, termLang, and defLang.
 */


function getQuizletDetails(id) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee18() {
    var response, set;
    return regeneratorRuntime.wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            _context18.next = 2;
            return fetch("https://quizlet.com/webapi/3.4/sets/".concat(id), {
              headers: {
                'Content-Type': 'application/json;charset=utf-8'
              }
            }).then(function (res) {
              return res.json();
            });

          case 2:
            response = _context18.sent;
            // Extract set details from the API response
            set = response.responses[0].models.set[0]; // Log a message indicating that Quizlet data is being fetched

            _context18.next = 6;
            return logMessage('Getting Quizlet data...', 'info');

          case 6:
            return _context18.abrupt("return", {
              quizlet_title: set.title,
              termLang: set.wordLang,
              defLang: set.defLang
            });

          case 7:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18);
  }));
}

app.get('/get/quizlet/list', function (req, res) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee19() {
    var rows;
    return regeneratorRuntime.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _context19.prev = 0;
            _context19.next = 3;
            return queryDb(db, 'SELECT id, quizlet_id, quizlet_title, quizlet_def_language, quizlet_term_language FROM quizlet');

          case 3:
            rows = _context19.sent;
            console.log(rows);
            res.json(rows);
            _context19.next = 12;
            break;

          case 8:
            _context19.prev = 8;
            _context19.t0 = _context19["catch"](0);
            console.error(_context19.t0);
            res.status(500).send('Internal server error');

          case 12:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19, null, [[0, 8]]);
  }));
});
/**
 * Queries a SQLite database using the provided SQL statement and parameters.
 *
 * @param {string} sql - The SQL statement to execute.
 * @param {Array} params - An array of parameters to substitute into the SQL statement.
 * @returns {Promise<Array>} - A promise that resolves with an array of rows returned by the query, or rejects with an error.
 */

function queryDb(sql, params) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee20() {
    return regeneratorRuntime.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            return _context20.abrupt("return", new Promise(function (resolve, reject) {
              // Serialize the database to ensure queries execute in order
              db.serialize(function () {
                // Execute the query with the provided SQL and parameters
                db.all(sql, params, function (err, rows) {
                  // If an error occurred, reject the promise with the error
                  if (err) {
                    reject(err);
                  } else {
                    // Otherwise, resolve the promise with the returned rows
                    resolve(rows);
                  }
                });
              });
            }));

          case 1:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20);
  }));
}
/**
 * Converts a duration in milliseconds into a human-readable string with hours, minutes and seconds.
 *
 * @param {number} durationInMs - The duration in milliseconds.
 *
 * @returns {string} The formatted duration string.
 */


function formatDuration(durationInMs) {
  return __awaiter(this, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee21() {
    var seconds, hours, minutes, remainingSeconds, parts;
    return regeneratorRuntime.wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            // Convert to seconds
            seconds = Math.floor(durationInMs / 1000); // Split into hours, minutes and remaining seconds

            hours = Math.floor(seconds / 3600);
            minutes = Math.floor(seconds % 3600 / 60);
            remainingSeconds = seconds % 60; // Build parts array with hours, minutes and seconds

            parts = [];

            if (hours > 0) {
              parts.push("".concat(hours, " hour").concat(hours === 1 ? '' : 's'));
            }

            if (minutes > 0) {
              parts.push("".concat(minutes, " minute").concat(minutes === 1 ? '' : 's'));
            }

            if (remainingSeconds > 0 || parts.length === 0) {
              parts.push("".concat(remainingSeconds, " second").concat(remainingSeconds === 1 ? '' : 's'));
            } // Join parts array into formatted duration string


            return _context21.abrupt("return", parts.join(' '));

          case 9:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21);
  }));
}

var logsDir = path.join(__dirname, 'log');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

var logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp({
    format: function format() {
      return moment().tz('Pacific/Auckland').format('YYYY-MM-DD HH:mm:ss');
    }
  }), winston.format.json()),
  defaultMeta: {
    service: 'user-service'
  },
  transports: [new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error'
  }), new winston.transports.File({
    filename: path.join(logsDir, 'combined.log')
  })]
});
/**
 * Logs a message with the specified log level and adds metadata about the caller's file and line number.
 * @param {string} message - The message to log.
 * @param {string} level - The log level to use (e.g. 'info', 'warn', 'error').
 */

var logMessage = function logMessage(message, level) {
  return __awaiter(void 0, void 0, void 0,
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee22() {
    var stack, callerFile, callerLine, meta;
    return regeneratorRuntime.wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.next = 2;
            return StackTrace.get();

          case 2:
            stack = _context22.sent;
            // Get the file name and line number of the function that called logMessage.
            callerFile = stack[1].fileName;
            callerLine = stack[1].lineNumber; // Create metadata object to include in log message.

            meta = {
              file: callerFile,
              line: callerLine
            }; // Call the logger with the specified level, message and metadata.

            logger.log(level, message, meta);

          case 7:
          case "end":
            return _context22.stop();
        }
      }
    }, _callee22);
  }));
};

checkAndCreateDir();
app.listen(port, address, function () {
  console.log("Server listening on http://".concat(address, ":").concat(port));
});