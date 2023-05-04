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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var _this = this;
var urlInput = document.getElementById("url");
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var submitButton = document.getElementById("submit");
var termText = document.getElementById("term");
var defText = document.getElementById("def");
var loginSection = document.getElementById("login");
var gameSection = document.getElementById("game");
var statsSection = document.getElementById("stats");
var titleHTML = document.querySelector("title");
var typingInput = document.getElementById("typingInput");
var historyDIV = document.getElementById("history");
var menuToggle = document.getElementById("menuToggle");
var menuScene = document.getElementById("menu");
var gameTitle = document.getElementById("title");
var wordCountText = document.getElementById("word_count");
var linkText = document.getElementById("link");
var toggleFurigana = document.getElementById("toggleFurigana");
var quizletLinkSettings = document.getElementById("quizletLinkSettings");
var submitQuizletButton = document.getElementById("submitQuizlet");
var setting_username = document.getElementById("setting_username");
var logoutButton = document.getElementById("logout");
var loadingSection = document.getElementById("loading");
var loadingText = loadingSection.querySelector('p');
var accountLink = document.getElementById('account-link');
var loadingInterval;
var Playtime = /** @class */ (function () {
    function Playtime() {
        this.data = [];
    }
    Playtime.prototype.start = function () {
        var nzTime = Date.now();
        this.data.push({
            startTime: nzTime
        });
    };
    Playtime.prototype.stop = function () {
        var nzTime = Date.now();
        if (this.data.length > 0) {
            this.data[this.data.length - 1].stopTime = nzTime;
        }
    };
    Playtime.prototype.get = function () {
        return __spreadArrays(this.data);
    };
    Playtime.prototype.reset = function () {
        this.data = [];
    };
    return Playtime;
}());
var playtime = new Playtime();
window.onload = function () { return __awaiter(_this, void 0, void 0, function () {
    var furiganaStatus, username;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                loading();
                loginSection.style.display = 'none';
                gameSection.style.display = 'none';
                statsSection.style.display = 'none';
                urlInput.value = localStorage.getItem('quizlet') || '';
                usernameInput.value = localStorage.getItem('username') || '';
                passwordInput.value = localStorage.getItem('password') || '';
                furiganaStatus = localStorage.getItem('furigana');
                console.log(furiganaStatus);
                if (!furiganaStatus) {
                    localStorage.setItem('furigana', 'OFF');
                }
                if (furiganaStatus === "ON") {
                    console.log('Showing furigana.');
                    showFurigana();
                }
                else {
                    console.log("Hiding furigana.");
                    hideFurigana();
                }
                return [4 /*yield*/, getUsername()];
            case 1:
                username = _a.sent();
                console.log(username);
                if (username) {
                    getWords(username);
                }
                else {
                    clearInterval(loadingInterval);
                    loadingSection.style.display = 'none';
                    loginSection.style.display = 'block';
                }
                setTimeout(function () {
                    urlInput.focus();
                }, 500);
                getQuizletList();
                return [2 /*return*/];
        }
    });
}); };
var getQuizletList = function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/get/quizlet/list');
    xhr.onload = function () {
        var _a;
        if (xhr.status === 200) {
            var quizlets_1 = JSON.parse(xhr.responseText);
            // Create dropdown menu container
            var dropdownContainer = document.createElement('div');
            dropdownContainer.classList.add('dropdown-container');
            // Create dropdown menu
            var dropdownMenu_1 = document.createElement('select');
            dropdownMenu_1.id = 'dropdown-menu';
            dropdownMenu_1.style.width = '100%';
            renderDropdownOptions(quizlets_1, dropdownMenu_1);
            dropdownContainer.appendChild(dropdownMenu_1);
            // Add event listener to dropdown menu
            dropdownMenu_1.addEventListener('change', function (event) {
                if (event.target instanceof HTMLSelectElement) {
                    selectQuizlet(event.target);
                }
            });
            // For phones, also listen for click events on the options themselves
            dropdownMenu_1.addEventListener('click', function (event) {
                if (event.target instanceof HTMLSelectElement) {
                    selectQuizlet(event.target);
                }
            });
            // Set the initial value of the dropdown menu
            dropdownMenu_1.value = (_a = localStorage.getItem('quizlet')) !== null && _a !== void 0 ? _a : '';
            // Insert the dropdown menu after the URL input
            var urlInputParent = urlInput.parentElement;
            if (urlInputParent) {
                urlInputParent.insertBefore(dropdownContainer, urlInput.nextSibling);
            }
            dropdownMenu_1.size = dropdownMenu_1.options.length > 4 ? 4 : dropdownMenu_1.options.length;
            urlInput.addEventListener('input', function (event) {
                filterQuizletList(quizlets_1, dropdownMenu_1);
            });
            // Add event listener to the URL input
            urlInput.addEventListener('keydown', onUrlInputKeyDown);
        }
        else {
            console.error(xhr.statusText);
        }
    };
    xhr.onerror = function () {
        console.error(xhr.statusText);
    };
    xhr.send();
};
var selectQuizlet = function (option) {
    var selectedQuizletId = option.value;
    console.log(selectedQuizletId);
    localStorage.setItem('quizlet', selectedQuizletId);
    urlInput.value = "https://quizlet.com/" + selectedQuizletId;
    setTimeout(function () {
        // Don't focus if the user is on a mobile device
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            urlInput.focus();
        }
    }, 500);
};
// Add event listener to the URL input
/**
 * Handles the keydown event for the URL input.
 * @param {KeyboardEvent} event - The keydown event.
 */
var onUrlInputKeyDown = function (event) {
    var dropdownMenu = document.querySelector('#dropdown-menu');
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // Up or down arrow key is pressed
        if (dropdownMenu && dropdownMenu.options.length > 0) {
            // Get the current selected index
            var selectedIndex = dropdownMenu.selectedIndex;
            if (selectedIndex === -1) {
                // No option is selected, default to the first one
                selectedIndex = 0;
            }
            // Set the new selected index based on the arrow key pressed
            if (event.key === 'ArrowUp' && selectedIndex > 0) {
                selectedIndex--;
            }
            else if (event.key === 'ArrowDown' && selectedIndex < dropdownMenu.options.length - 1) {
                selectedIndex++;
            }
            updateSelectedOption(selectedIndex, dropdownMenu);
        }
    }
};
/**
 * Updates the selected option in the dropdown menu and the background colors of the input and options.
 * @param {number} selectedIndex - The index of the new selected option.
 * @param {HTMLSelectElement} dropdownMenu - The dropdown menu element.
 */
var updateSelectedOption = function (selectedIndex, dropdownMenu) {
    var _a;
    // Set the new value and background color of the input and options
    var selectedOption = dropdownMenu.options[selectedIndex];
    urlInput.value = (_a = selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.textContent) !== null && _a !== void 0 ? _a : '';
    selectedOption.style.backgroundColor = '#cecece';
    if (selectedIndex > 0) {
        dropdownMenu.options[selectedIndex - 1].style.backgroundColor = 'white';
    }
    if (selectedIndex < dropdownMenu.options.length - 1) {
        dropdownMenu.options[selectedIndex + 1].style.backgroundColor = 'white';
    }
    // Update the selected index in the dropdown menu
    dropdownMenu.selectedIndex = selectedIndex;
};
var filterQuizletList = function (quizlets, dropdownMenu) {
    var searchTerm = urlInput.value;
    var matchingQuizlets = searchQuizlets(searchTerm, quizlets);
    console.log(matchingQuizlets);
    dropdownMenu.innerHTML = '';
    dropdownMenu.style.display = 'block';
    renderDropdownOptions(matchingQuizlets, dropdownMenu);
    dropdownMenu.options[0].style.backgroundColor = '#cecece';
};
var renderDropdownOptions = function (quizlets, dropdownMenu) {
    console.log(quizlets);
    quizlets.forEach(function (quizlet) {
        // Create option element for each quizlet
        var option = document.createElement('option');
        option.textContent = quizlet.quizlet_title + ' - ' + quizlet.quizlet_id;
        option.value = quizlet.quizlet_id.toString();
        option.style.display = 'block';
        dropdownMenu.appendChild(option);
    });
};
var loading = function () {
    loadingText.textContent = 'Loading...';
    loadingSection.style.display = 'block';
    gameSection.style.display = 'none';
    loginSection.style.display = 'none';
    menuToggle.style.display = 'none';
    loadingInterval = setInterval(function () {
        loadingText.textContent += '.';
    }, 1000);
    setTimeout(function () {
        if (loadingSection.style.display === 'block') {
            clearInterval(loadingInterval);
            document.cookie = 'auth_token=;';
            alert('Timeout reached. Reloading...');
            window.location.reload();
        }
    }, 30000);
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'c') {
            if (loadingSection.style.display === 'block') {
                document.cookie = 'auth_token=;';
                window.location.reload();
            }
        }
    });
};
var getUsername = function () { return __awaiter(_this, void 0, void 0, function () {
    var auth_token, response, username;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("Getting username");
                auth_token = (_a = document.cookie
                    .split('; ')
                    .find(function (row) { return row.startsWith('auth_token='); })) === null || _a === void 0 ? void 0 : _a.split('=')[1];
                if (!auth_token) return [3 /*break*/, 5];
                return [4 /*yield*/, fetch('/auth', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            auth_token: auth_token
                        })
                    })];
            case 1:
                response = _b.sent();
                if (!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                username = (_b.sent()).username;
                return [2 /*return*/, username];
            case 3:
                console.error('Error sending auth token:', response.statusText);
                _b.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                console.log('No auth token found in cookie.');
                _b.label = 6;
            case 6: return [2 /*return*/, null];
        }
    });
}); };
var setVisualViewport = function () {
    var root = document.documentElement;
    var windowHeight = window.innerHeight;
    root.style.setProperty('--vvw', window.innerWidth + "px");
    root.style.setProperty('--vvh', windowHeight + "px");
    var linkHeight = linkText.clientHeight;
    var keyboardHeight = windowHeight - document.documentElement.clientHeight;
    if (keyboardHeight > 0) {
        linkText.style.bottom = keyboardHeight + linkHeight + "px";
    }
    else {
        linkText.style.bottom = "1rem";
    }
};
setVisualViewport();
var observer = new ResizeObserver(setVisualViewport);
observer.observe(document.documentElement);
/**
 * Starts the game after fetching the user's history.
 *
 * @param {string} username - The user's username.
 * @param {any} response - The response object.
 */
var startGame = function (username, response) { return __awaiter(_this, void 0, void 0, function () {
    var quizlet_id;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(username);
                console.log(response);
                return [4 /*yield*/, getHistory(username, response)];
            case 1:
                _a.sent();
                clearInterval(loadingInterval);
                loadingSection.style.display = 'none';
                loadingText.textContent = 'Loading...';
                menuToggle.style.display = 'block';
                loginSection.style.display = 'none';
                gameSection.style.display = 'block';
                statsSection.style.display = 'block';
                typingInput.style.display = 'block';
                gameTitle.textContent = response.quizlet_title;
                quizlet_id = response.quizlet_id;
                submitButton.disabled = false;
                addLinks(username, quizlet_id);
                playtime.start();
                newWord(username, response);
                return [2 /*return*/];
        }
    });
}); };
var login = function () {
    submitButton.disabled = true;
    var username = usernameInput.value;
    var password = passwordInput.value;
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', "/login");
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            console.log(response);
            if (response.success) {
                var expirationDate = new Date(response.expires_at);
                document.cookie = "auth_token=" + response.auth_token + "; expires=" + expirationDate.toUTCString() + "; path=/;";
                var urlValue = urlInput.value;
                localStorage.setItem('quizlet', urlValue);
                getWords(username);
            }
            else {
                console.error('Login failed.');
                alert('Wrong username or password.');
                submitButton.disabled = false;
            }
        }
        else {
            console.error(xhr.statusText);
            console.error('Request failed.');
            submitButton.disabled = false;
        }
    };
    xhr.onerror = function () {
        console.error(xhr.statusText);
        console.error('Request failed.');
        submitButton.disabled = false;
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    var data = {
        username: username,
        password: password
    };
    xhr.send(JSON.stringify(data));
};
var getWords = function (username) { return __awaiter(_this, void 0, void 0, function () {
    var params, urlValue, quizlet_id, dropdown, selectedOption, quizletMath, CACHE_DURATION, cachedDataString, cachedData, cacheAge, xhr;
    var _a;
    return __generator(this, function (_b) {
        loading();
        console.log('Getting words...');
        dropdown = document.getElementById('dropdown-menu');
        if (dropdown) {
            selectedOption = dropdown.querySelector('option[style*="background-color: rgb(206, 206, 206);"]');
            if (selectedOption) {
                urlValue = ((_a = selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.getAttribute('value')) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                console.log('Selected option: ', urlValue);
            }
            else {
                urlValue = urlInput.value.trim();
            }
        }
        else {
            urlValue = urlInput.value.trim();
        }
        quizletMath = urlValue.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
        if (quizletMath) {
            quizlet_id = quizletMath[1];
        }
        else {
            quizlet_id = urlValue;
        }
        console.log('Found quizlet id!: ', quizlet_id);
        params = "quizlet_id=" + quizlet_id;
        localStorage.setItem('quizlet', quizlet_id);
        console.log(params);
        setting_username.textContent = username;
        accountLink.href = "/account?user=" + username;
        accountLink.target = '_blank';
        CACHE_DURATION = 30 * 60 * 1000;
        cachedDataString = localStorage.getItem("quizletData");
        cachedData = cachedDataString ? JSON.parse(cachedDataString) : null;
        if (cachedData) {
            cacheAge = Date.now() - cachedData.timestamp;
            if (cacheAge < CACHE_DURATION && quizlet_id === cachedData.data.quizlet_id) {
                console.log(cachedData.data.quizlet_title);
                console.log("Found cached data!");
                startGame(username, cachedData.data);
                return [2 /*return*/];
            }
        }
        xhr = new XMLHttpRequest();
        xhr.open('GET', "/get/quizlet/data?" + params);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                console.log(response);
                var cachedResponse = {
                    data: response,
                    timestamp: Date.now()
                };
                localStorage.setItem("quizletData", JSON.stringify(cachedResponse));
                startGame(username, response);
            }
            else if (xhr.status === 400) {
                console.error(xhr.statusText);
                submitButton.disabled = false;
                urlInput.style.borderColor = 'red';
                urlInput.value = '';
                urlInput.placeholder = 'Please use quizlet.com';
                loadingSection.style.display = 'none';
                loginSection.style.display = 'block';
            }
            else {
                console.error(xhr.statusText);
                submitButton.disabled = false;
            }
        };
        xhr.onerror = function () {
            console.error(xhr.statusText);
            console.error('Request failed.');
            submitButton.disabled = false;
        };
        xhr.send();
        return [2 /*return*/];
    });
}); };
var randomIndex = 0;
var lastIndex = 0;
var newWord = function (username, response) { return __awaiter(_this, void 0, void 0, function () {
    var num, termLength, defLength, maxIndex, term, def, mediaQuery, termFontSize, defFontSize, wordCountBottom, MIN_FONT_SIZE, isTextFits, getTextWidth, fitText;
    return __generator(this, function (_a) {
        typingInput.value = '';
        typingInput.style.display = 'block';
        num = 0;
        termLength = response.term.length;
        defLength = response.def.length;
        maxIndex = Math.max(termLength, defLength) - 1;
        if (maxIndex < 10 || termLength === 1) {
            randomIndex++;
            if (randomIndex > maxIndex) {
                randomIndex = 0;
            }
        }
        else {
            while (randomIndex === lastIndex) {
                randomIndex = Math.floor(Math.random() * (maxIndex + 1));
            }
            lastIndex = randomIndex;
        }
        console.log('randomIndex: ' + randomIndex);
        term = response.term[randomIndex];
        def = response.def[randomIndex];
        if (randomIndex === 0) {
            randomIndex++;
        }
        mediaQuery = window.matchMedia("(max-width: 768px)");
        if (mediaQuery.matches) {
            termFontSize = 10;
            defFontSize = 20;
            wordCountBottom = "2.25vw";
        }
        else {
            termFontSize = 5;
            defFontSize = 10;
            wordCountBottom = "-6.75vw";
        }
        MIN_FONT_SIZE = 0.5;
        isTextFits = function (text, fontSize) {
            var textWidth = getTextWidth(text, fontSize);
            var pageWidth = window.innerWidth;
            return textWidth <= pageWidth;
        };
        getTextWidth = function (text, fontSize) {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            if (!context) {
                return 0;
            }
            ;
            context.font = fontSize + "vw sans-serif";
            return context.measureText(text).width;
        };
        fitText = function (text, textElement, fontSize) {
            while (!isTextFits(text, fontSize) && fontSize > MIN_FONT_SIZE) {
                fontSize -= 0.5;
                textElement.style.fontSize = fontSize + "vw";
            }
            textElement.style.fontSize = fontSize + "vw";
            textElement.textContent = text;
            furigana(text, function (furigana) {
                textElement.innerHTML = furigana || textElement.innerHTML;
                updateFurigana();
                fixTextPosition();
            });
        };
        fitText(term, termText, termFontSize);
        fitText(def, defText, defFontSize);
        // Add the hidden notes to termText and defText
        termText.setAttribute('data-random-index', String(randomIndex));
        defText.setAttribute('data-random-index', String(randomIndex));
        titleHTML.textContent = 'タイピングゲーム風単語学習 - ' + response.quizlet_title;
        typingInput.focus();
        typing(num, def, term, username, response);
        return [2 /*return*/];
    });
}); };
var fixTextPosition = function () {
    var termFontSize = 70;
    var defFontSize = 120;
    while ((defText.scrollWidth > defText.offsetWidth || defText.scrollHeight > defText.offsetHeight)) {
        defFontSize--;
        defText.style.fontSize = defFontSize + "px";
    }
    while ((termText.scrollWidth > termText.offsetWidth || termText.scrollHeight > termText.offsetHeight)) {
        termFontSize--;
        termText.style.fontSize = termFontSize + "px";
    }
    var defRect = defText.getBoundingClientRect();
    var termRect = termText.getBoundingClientRect();
    var distance = defRect.top - termRect.bottom;
    if (distance < 30 && toggleFurigana.textContent === 'ON' && defText.innerHTML.includes("<ruby>")) {
        termText.style.bottom = 80 - distance + "px";
        console.log('Adjusting position!');
    }
    // const defStyles = window.getComputedStyle(defText);
    // wordCountText.style.bottom = `calc(${window.getComputedStyle(defText).getPropertyValue("bottom") } - 30)px`;
};
var checkAndSetStyle = function (element, fontSize, bottom) {
    var containerHeight = element.parentNode.clientHeight;
    var contentHeight = element.scrollHeight;
    var newFontSize = (containerHeight / contentHeight) * fontSize;
    if (newFontSize <= fontSize) {
        element.style.fontSize = newFontSize + "vw";
        element.style.bottom = bottom;
    }
};
var composing = false;
var typing = function (num, def, term, username, response) {
    console.log('def: ' + def);
    composing = false;
    var onInput = function (event) {
        var _a, _b;
        if (composing)
            return; // return early if composing
        var inputText = event.data;
        var inputLength = inputText ? inputText.length : 0;
        if (event.inputType === 'deleteContentBackward' && num > 0) {
            num -= 1;
            var typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            var notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
            console.log("deleted!");
        }
        else if (event.inputType !== 'deleteContentBackward') {
            var correct = true;
            for (var i = 0; i < inputLength; i++) {
                if (def[num + i] !== (inputText === null || inputText === void 0 ? void 0 : inputText[i])) {
                    correct = false;
                    break;
                }
            }
            if (correct) {
                var typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num + inputLength) + "</span>";
                var notYet = "<span style='color: #1fd755;' id='notYet'>" + def.substring(num + inputLength) + "</span>";
                num += inputLength;
                if (num >= def.length) {
                    // Remove input and compositionend event listeners
                    typingInput.removeEventListener('input', onInput);
                    typingInput.removeEventListener('compositionend', function () { });
                    var wordCount = parseInt((_b = (_a = wordCountText === null || wordCountText === void 0 ? void 0 : wordCountText.textContent) === null || _a === void 0 ? void 0 : _a.split(': ')[1]) !== null && _b !== void 0 ? _b : '0');
                    wordCountText.innerHTML = "Words: " + (wordCount + 1);
                    var randomIndex_1 = termText.getAttribute('data-random-index');
                    submitTyped(def, term, randomIndex_1, username, response);
                    sendPlaytime(username);
                    newWord(username, response);
                }
                else {
                    document.querySelector("#def").innerHTML = typedOut + notYet;
                }
            }
            else {
                var typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
                var notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
                document.querySelector("#def").innerHTML = typedOut + notYet;
            }
        }
    };
    typingInput.addEventListener('input', onInput);
    typingInput.addEventListener('compositionstart', function () {
        composing = true;
    });
    typingInput.addEventListener('compositionend', function (event) {
        composing = false;
        console.log('Composed: ' + event.data);
        onInput(event);
    });
};
var submitTyped = function (def, term, randomIndex, username, response) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', "/post/typed");
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response_1 = JSON.parse(xhr.responseText);
            addHistoryDisplay(term, def);
            console.log(response_1);
        }
        else {
            console.error(xhr.statusText);
            console.error('Request failed.');
        }
    };
    xhr.onerror = function () {
        console.error(xhr.statusText);
        console.error('Request failed.');
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    var quizlet_id = response.quizlet_id;
    var data = {
        term: term,
        def: def,
        randomIndex: randomIndex,
        username: username,
        quizlet_id: quizlet_id
    };
    xhr.send(JSON.stringify(data));
};
var getHistory = function (username, response) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log(username);
        username = username.trim();
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', "/get/history?username=" + username + "&quizlet_id=" + response.quizlet_id);
                xhr.onload = function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var response_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(xhr.status === 200)) return [3 /*break*/, 2];
                                    response_2 = JSON.parse(xhr.responseText);
                                    console.log(response_2);
                                    return [4 /*yield*/, displayHistory(response_2)];
                                case 1:
                                    _a.sent();
                                    resolve(response_2);
                                    return [3 /*break*/, 3];
                                case 2:
                                    console.error(xhr.statusText);
                                    console.error('Request failed.');
                                    reject(xhr.statusText);
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    });
                };
                xhr.onerror = function () {
                    console.error(xhr.statusText);
                    console.error('Request failed.');
                    reject(xhr.statusText);
                };
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send();
            })];
    });
}); };
var displayHistory = function (response) {
    var history = response.history;
    var promises = [];
    var historyHTML = '<table><tbody>';
    if (wordCountText) {
        wordCountText.innerHTML = "Words: " + history.length;
    }
    var _loop_1 = function (i) {
        var term = history[i].term;
        var def = history[i].def;
        var termPromise = new Promise(function (resolve, reject) {
            furigana(term, function (termWithFurigana) {
                resolve(termWithFurigana || '');
            });
        });
        var defPromise = new Promise(function (resolve, reject) {
            furigana(def, function (defWithFurigana) {
                resolve(defWithFurigana || '');
            });
        });
        promises.push(Promise.all([termPromise, defPromise]));
    };
    for (var i = 0; i < history.length; i++) {
        _loop_1(i);
    }
    return Promise.all(promises).then(function (results) {
        for (var i = 0; i < results.length; i++) {
            var termWithFurigana = results[i][0];
            var defWithFurigana = results[i][1];
            historyHTML += "<tr><td>" + defWithFurigana + ":</td><td>" + termWithFurigana + "</td></tr>";
        }
        historyHTML += '</tbody></table>';
        if (historyDIV) {
            historyDIV.innerHTML = historyHTML;
            updateFurigana();
        }
    })["catch"](function (error) {
        console.error(error);
        historyHTML += '</tbody></table>';
        if (historyDIV) {
            historyDIV.innerHTML = historyHTML;
            updateFurigana();
        }
    });
};
var addLinks = function (username, quizlet_id) {
    linkText.innerHTML = '';
    var leaderboardLink = document.createElement('a');
    leaderboardLink.href = "/leaderboard?quizlet_id=" + quizlet_id;
    leaderboardLink.textContent = 'Leaderboard';
    leaderboardLink.onclick = function (event) {
        event.preventDefault(); // Prevent the link from opening in a new tab
        openOverlay("/leaderboard?quizlet_id=" + quizlet_id, username);
    };
    linkText.appendChild(leaderboardLink);
    var profileLink = document.createElement('a');
    profileLink.href = "/profile?user=" + username;
    profileLink.textContent = 'Profile';
    profileLink.onclick = function (event) {
        event.preventDefault(); // Prevent the link from opening in a new tab
        openOverlay("/profile?user=" + username, username);
    };
    linkText.appendChild(profileLink);
};
var currentOverlay = null;
var openOverlay = function (url, username) {
    sendPlaytime(username);
    // Remove the previous overlay
    if (currentOverlay !== null) {
        currentOverlay.remove();
    }
    // Create a modal overlay
    var overlay = document.createElement('div');
    overlay.classList.add('overlay');
    // Create a close button
    var closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = function () {
        // Remove the overlay when the close button is clicked
        overlay.remove();
        currentOverlay = null;
        typingInput.focus();
    };
    overlay.appendChild(closeButton);
    // Create an iframe to load the page
    var iframe = document.createElement('iframe');
    iframe.src = url;
    overlay.appendChild(iframe);
    // Add the overlay to the page
    document.body.appendChild(overlay);
    currentOverlay = overlay;
    document.addEventListener('click', function (event) {
        var isAnchor = Array.from(linkText.querySelectorAll('a')).some(function (a) { return a.contains(event.target); });
        if (!isAnchor) {
            overlay.remove();
            currentOverlay = null;
            document.removeEventListener('click', function () { });
            typingInput.focus();
        }
    });
};
var addHistoryDisplay = function (term, def) { return __awaiter(_this, void 0, void 0, function () {
    var newRow, defTd, termTd;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                newRow = document.createElement('tr');
                defTd = def;
                termTd = term;
                return [4 /*yield*/, furigana(term, function (term) {
                        if (term) {
                            termTd = term;
                        }
                    })];
            case 1:
                termTd = (_a = _c.sent()) !== null && _a !== void 0 ? _a : term;
                return [4 /*yield*/, furigana(def, function (def) {
                        if (def) {
                            defTd = def;
                        }
                    })];
            case 2:
                defTd = (_b = _c.sent()) !== null && _b !== void 0 ? _b : def;
                newRow.innerHTML = "<td>" + defTd + ":</td><td>" + termTd + "</td>";
                historyDIV.querySelector('tbody').insertAdjacentElement('afterbegin', newRow);
                updateFurigana();
                addWordCountDisplay();
                return [2 /*return*/];
        }
    });
}); };
var addWordCountDisplay = function () {
    var tbody = historyDIV.querySelector('table tbody');
    if (tbody instanceof HTMLTableElement) {
        var wordCount = tbody.rows.length;
        wordCountText.innerHTML = "Words: " + wordCount;
        updateFurigana();
    }
};
var furigana = function (word, callback) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "/get/furigana?word=" + word);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                var furigana_1 = response.furigana;
                if (furigana_1 !== undefined) {
                    console.log(furigana_1);
                    callback(furigana_1);
                    resolve(furigana_1);
                }
                else {
                    console.error('Furigana not found in response.');
                    callback(undefined);
                    resolve(undefined);
                }
            }
            else {
                console.error(xhr.statusText);
                console.error('Request failed.');
                callback(undefined);
                resolve(undefined);
            }
        };
        xhr.onerror = function () {
            console.error(xhr.statusText);
            console.error('Request failed.');
            callback(undefined);
            reject();
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
    });
};
document.addEventListener("keypress", function (event) {
    if (document.activeElement !== typingInput && typingInput.style.display === "block" && !composing) {
        typingInput.focus();
        typingInput.value += event.key;
        var inputEvent = new InputEvent('input', {
            bubbles: true
        });
        typingInput.dispatchEvent(inputEvent);
    }
});
menuToggle.addEventListener("click", function () {
    var _a;
    menuScene.style.display = (menuScene.style.display === "inline-block") ? "none" : "inline-block";
    gameSection.style.display = (gameSection.style.display === "block") ? "none" : "block";
    linkText.style.display = (linkText.style.display === "block") ? "none" : "block";
    if (menuToggle.textContent === "\u2630") {
        typingInput.style.display = "none";
        menuToggle.textContent = "\u2716";
        playtime.stop();
    }
    else {
        document.body.appendChild(typingInput);
        typingInput.style.display = "block";
        menuToggle.textContent = "\u2630";
        playtime.start();
    }
    quizletLinkSettings.value = (_a = localStorage.getItem('quizlet')) !== null && _a !== void 0 ? _a : '';
    if (typingInput.style.display === "block") {
        typingInput.focus();
        console.log("Focus changed!");
    }
});
// Function to show all furigana elements
var showFurigana = function () {
    var rtElements = document.querySelectorAll('rt');
    for (var i = 0; i < rtElements.length; i++) {
        var rtElement = rtElements[i];
        rtElement.style.display = 'block';
    }
    toggleFurigana.textContent = 'ON';
    localStorage.setItem('furigana', 'ON');
};
// Function to hide all furigana elements
var hideFurigana = function () {
    var rtElements = document.querySelectorAll('rt');
    for (var i = 0; i < rtElements.length; i++) {
        var rtElement = rtElements[i];
        rtElement.style.display = 'none';
    }
    toggleFurigana.textContent = 'OFF';
    localStorage.setItem('furigana', 'OFF');
};
var furiganaSetting = function (status) {
    if (status === "ON") {
        showFurigana();
    }
    else if (status === "OFF") {
        hideFurigana();
    }
    else {
        if (toggleFurigana.textContent === "OFF") {
            showFurigana();
        }
        else {
            hideFurigana();
        }
    }
};
var updateFurigana = function () {
    if (toggleFurigana.textContent === "ON") {
        showFurigana();
    }
    else {
        hideFurigana();
    }
    fixTextPosition();
};
var getNewQuizletData = function () {
    var urlValue = quizletLinkSettings.value;
    var username = usernameInput.value;
    submitQuizletButton.disabled = true;
    var currentQuizlet = localStorage.getItem('quizlet');
    var params;
    var new_quizlet_id, current_quizlet_id;
    var quizlet_id_match = urlValue.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (quizlet_id_match) {
        new_quizlet_id = quizlet_id_match[1];
    }
    var currentQuizletMatch = currentQuizlet === null || currentQuizlet === void 0 ? void 0 : currentQuizlet.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (currentQuizletMatch) {
        current_quizlet_id = currentQuizletMatch[1];
    }
    params = "quizlet_id=" + new_quizlet_id;
    if (new_quizlet_id && new_quizlet_id !== current_quizlet_id) {
        var xhr_1 = new XMLHttpRequest();
        xhr_1.open('GET', "/get/quizlet/data?" + params);
        xhr_1.setRequestHeader('Content-Type', 'application/json');
        xhr_1.onload = function () {
            if (xhr_1.status === 200) {
                var response = JSON.parse(xhr_1.responseText);
                console.log(new_quizlet_id);
                console.log(response);
                var cachedResponse = {
                    data: response,
                    timestamp: Date.now()
                };
                localStorage.setItem("quizletData", JSON.stringify(cachedResponse));
                gameTitle.textContent = response.quizlet_title;
                var quizlet_id = response.quizlet_id;
                localStorage.setItem("quizlet", quizlet_id);
                addLinks(username, quizlet_id);
                getHistory(username, response);
                newWord(username, response);
                submitQuizletButton.disabled = false;
                menuToggle.click();
            }
            else if (xhr_1.status === 400) {
                console.error(xhr_1.statusText);
                submitQuizletButton.disabled = false;
                quizletLinkSettings.style.borderColor = 'red';
                quizletLinkSettings.value = '';
                quizletLinkSettings.placeholder = 'Please use quizlet.com';
            }
            else {
                console.error(xhr_1.statusText);
                submitQuizletButton.disabled = false;
            }
        };
        xhr_1.onerror = function () {
            console.error(xhr_1.statusText);
            console.error('Request failed.');
            submitQuizletButton.disabled = false;
        };
        xhr_1.send();
    }
    else {
        submitQuizletButton.disabled = false;
        quizletLinkSettings.style.borderColor = 'red';
    }
};
var sendPlaytime = function (username) {
    playtime.stop();
    var playtimeInMilliseconds = calculatePlaytimeInMilliseconds();
    var xhr = new XMLHttpRequest();
    xhr.open('POST', "/post/playtime");
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            var response = xhr.responseText;
            playtime.reset();
            playtime.start();
            console.log(response);
            return;
        }
        else {
            console.error(xhr.statusText);
            console.error('Request failed.');
            playtime.start();
            return;
        }
    };
    xhr.onerror = function () {
        console.error(xhr.statusText);
        console.error('Request failed.');
        playtime.start();
    };
    xhr.send(JSON.stringify({
        username: username,
        playtime: playtimeInMilliseconds
    }));
};
var calculatePlaytimeInMilliseconds = function () {
    var totalTime = 0;
    var items = playtime.get();
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var startTime = item.startTime ? new Date(item.startTime) : undefined;
        var stopTime = item.stopTime ? new Date(item.stopTime) : undefined;
        if (startTime && stopTime) {
            var playtimeInMilliseconds = stopTime.getTime() - startTime.getTime();
            totalTime += playtimeInMilliseconds;
        }
    }
    console.log(totalTime);
    return totalTime;
};
window.addEventListener('blur', function () {
    playtime.stop();
});
window.addEventListener('focus', function () {
    if (loadingSection.style.display === "none") {
        var authToken = getAuthToken(); // replace this with your function to get the auth token from the cookie
        if (authToken) {
            playtime.start();
        }
    }
});
function getAuthToken() {
    var cookie = document.cookie;
    if (cookie) {
        var cookieParts = cookie.split('; ');
        for (var _i = 0, cookieParts_1 = cookieParts; _i < cookieParts_1.length; _i++) {
            var part = cookieParts_1[_i];
            if (part.startsWith('auth_token=')) {
                return part.substring('auth_token='.length);
            }
        }
    }
    return null;
}
toggleFurigana.addEventListener("click", function () {
    if (toggleFurigana.textContent === "ON") {
        hideFurigana();
    }
    else {
        showFurigana();
    }
});
window.addEventListener('beforeunload', function (event) {
    return __awaiter(this, void 0, void 0, function () {
        var username;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getUsername()];
                case 1:
                    username = _a.sent();
                    console.log(username);
                    if (!username) return [3 /*break*/, 3];
                    return [4 /*yield*/, sendPlaytime(username)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
});
window.onbeforeunload = function (e) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            e = e || window.event;
            // For IE and Firefox prior to version 4
            if (e) {
                e.returnValue = 'Sure?';
            }
            // For Safari
            return [2 /*return*/, 'Sure?'];
        });
    });
};
logoutButton.addEventListener("click", function () {
    document.cookie = 'auth_token=;';
    window.location.reload();
});
var searchQuizlets = function (searchTerm, quizlets) {
    return quizlets.filter(function (quizlet) {
        var searchStr = (quizlet.quizlet_title + " - " + quizlet.quizlet_id).toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });
};
defText.addEventListener("click", function () {
    setTimeout(function () {
        typingInput.focus();
        console.log("focus!");
    }, 500);
});
