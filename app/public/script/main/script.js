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
const urlInput = document.getElementById("url");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submit");
const termText = document.getElementById("term");
const defText = document.getElementById("def");
const loginSection = document.getElementById("login");
const gameSection = document.getElementById("game");
const statsSection = document.getElementById("stats");
const titleHTML = document.querySelector("title");
const typingInput = document.getElementById("typingInput");
const historyDIV = document.getElementById("history");
const menuToggle = document.getElementById("menuToggle");
const menuScene = document.getElementById("menu");
const gameTitle = document.getElementById("title");
const wordCountText = document.getElementById("word_count");
const linkText = document.getElementById("link");
const toggleFurigana = document.getElementById("toggleFurigana");
const quizletLinkSettings = document.getElementById("quizletLinkSettings");
const submitQuizletButton = document.getElementById("submitQuizlet");
const setting_username = document.getElementById("setting_username");
const logoutButton = document.getElementById("logout");
const loadingSection = document.getElementById("loading");
const loadingText = loadingSection.querySelector('p');
const accountLink = document.getElementById('account-link');
let loadingInterval;
class Playtime {
    constructor() {
        this.data = [];
    }
    start() {
        const nzTime = Date.now();
        this.data.push({
            startTime: nzTime,
        });
    }
    stop() {
        const nzTime = Date.now();
        if (this.data.length > 0) {
            this.data[this.data.length - 1].stopTime = nzTime;
        }
    }
    get() {
        return [...this.data];
    }
    reset() {
        this.data = [];
    }
}
const playtime = new Playtime();
window.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    loading();
    loginSection.style.display = 'none';
    gameSection.style.display = 'none';
    statsSection.style.display = 'none';
    urlInput.value = localStorage.getItem('quizlet') || '';
    usernameInput.value = localStorage.getItem('username') || '';
    passwordInput.value = localStorage.getItem('password') || '';
    const furiganaStatus = localStorage.getItem('furigana');
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
    const username = yield getUsername();
    console.log(username);
    if (username) {
        getWords(username);
    }
    else {
        clearInterval(loadingInterval);
        loadingSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
    setTimeout(() => {
        urlInput.focus();
    }, 500);
    getQuizletList();
});
const getQuizletList = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/get/quizlet/list');
    xhr.onload = () => {
        var _a;
        if (xhr.status === 200) {
            const quizlets = JSON.parse(xhr.responseText);
            // Create dropdown menu container
            const dropdownContainer = document.createElement('div');
            dropdownContainer.classList.add('dropdown-container');
            // Create dropdown menu
            const dropdownMenu = document.createElement('select');
            dropdownMenu.id = 'dropdown-menu';
            dropdownMenu.style.width = '100%';
            renderDropdownOptions(quizlets, dropdownMenu);
            dropdownContainer.appendChild(dropdownMenu);
            // Add event listener to dropdown menu
            dropdownMenu.addEventListener('change', (event) => {
                if (event.target instanceof HTMLSelectElement) {
                    selectQuizlet(event.target);
                }
            });
            // For phones, also listen for click events on the options themselves
            dropdownMenu.addEventListener('click', (event) => {
                if (event.target instanceof HTMLSelectElement) {
                    selectQuizlet(event.target);
                }
            });
            // Set the initial value of the dropdown menu
            dropdownMenu.value = (_a = localStorage.getItem('quizlet')) !== null && _a !== void 0 ? _a : '';
            // Insert the dropdown menu after the URL input
            const urlInputParent = urlInput.parentElement;
            if (urlInputParent) {
                urlInputParent.insertBefore(dropdownContainer, urlInput.nextSibling);
            }
            dropdownMenu.size = dropdownMenu.options.length > 4 ? 4 : dropdownMenu.options.length;
            urlInput.addEventListener('input', (event) => {
                filterQuizletList(quizlets, dropdownMenu);
            });
            // Add event listener to the URL input
            urlInput.addEventListener('keydown', onUrlInputKeyDown);
        }
        else {
            console.error(xhr.statusText);
        }
    };
    xhr.onerror = () => {
        console.error(xhr.statusText);
    };
    xhr.send();
};
const selectQuizlet = (option) => {
    const selectedQuizletId = option.value;
    console.log(selectedQuizletId);
    localStorage.setItem('quizlet', selectedQuizletId);
    urlInput.value = `https://quizlet.com/${selectedQuizletId}`;
    setTimeout(() => {
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
const onUrlInputKeyDown = (event) => {
    const dropdownMenu = document.querySelector('#dropdown-menu');
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // Up or down arrow key is pressed
        if (dropdownMenu && dropdownMenu.options.length > 0) {
            // Get the current selected index
            let selectedIndex = dropdownMenu.selectedIndex;
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
const updateSelectedOption = (selectedIndex, dropdownMenu) => {
    var _a;
    // Set the new value and background color of the input and options
    const selectedOption = dropdownMenu.options[selectedIndex];
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
const filterQuizletList = (quizlets, dropdownMenu) => {
    const searchTerm = urlInput.value;
    const matchingQuizlets = searchQuizlets(searchTerm, quizlets);
    console.log(matchingQuizlets);
    dropdownMenu.innerHTML = '';
    dropdownMenu.style.display = 'block';
    renderDropdownOptions(matchingQuizlets, dropdownMenu);
    dropdownMenu.options[0].style.backgroundColor = '#cecece';
};
const renderDropdownOptions = (quizlets, dropdownMenu) => {
    console.log(quizlets);
    quizlets.forEach((quizlet) => {
        // Create option element for each quizlet
        const option = document.createElement('option');
        option.textContent = quizlet.quizlet_title + ' - ' + quizlet.quizlet_id;
        option.value = quizlet.quizlet_id.toString();
        option.style.display = 'block';
        dropdownMenu.appendChild(option);
    });
};
const loading = () => {
    loadingText.textContent = 'Loading...';
    loadingSection.style.display = 'block';
    gameSection.style.display = 'none';
    loginSection.style.display = 'none';
    menuToggle.style.display = 'none';
    loadingInterval = setInterval(() => {
        loadingText.textContent += '.';
    }, 1000);
    setTimeout(() => {
        if (loadingSection.style.display === 'block') {
            clearInterval(loadingInterval);
            document.cookie = 'auth_token=;';
            alert('Timeout reached. Reloading...');
            window.location.reload();
        }
    }, 30000);
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'c') {
            if (loadingSection.style.display === 'block') {
                document.cookie = 'auth_token=;';
                window.location.reload();
            }
        }
    });
};
const getUsername = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("Getting username");
    const auth_token = (_a = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))) === null || _a === void 0 ? void 0 : _a.split('=')[1];
    if (auth_token) {
        const response = yield fetch('/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auth_token
            })
        });
        if (response.ok) {
            const { username } = yield response.json();
            return username;
        }
        else {
            console.error('Error sending auth token:', response.statusText);
        }
    }
    else {
        console.log('No auth token found in cookie.');
    }
    return null;
});
const setVisualViewport = () => {
    const root = document.documentElement;
    const windowHeight = window.innerHeight;
    root.style.setProperty('--vvw', `${window.innerWidth}px`);
    root.style.setProperty('--vvh', `${windowHeight}px`);
    const linkHeight = linkText.clientHeight;
    const keyboardHeight = windowHeight - document.documentElement.clientHeight;
    if (keyboardHeight > 0) {
        linkText.style.bottom = `${keyboardHeight + linkHeight}px`;
    }
    else {
        linkText.style.bottom = `1rem`;
    }
};
setVisualViewport();
const observer = new ResizeObserver(setVisualViewport);
observer.observe(document.documentElement);
/**
 * Starts the game after fetching the user's history.
 *
 * @param {string} username - The user's username.
 * @param {any} response - The response object.
 */
const startGame = (username, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(username);
    console.log(response);
    yield getHistory(username, response);
    clearInterval(loadingInterval);
    loadingSection.style.display = 'none';
    loadingText.textContent = 'Loading...';
    menuToggle.style.display = 'block';
    loginSection.style.display = 'none';
    gameSection.style.display = 'block';
    statsSection.style.display = 'block';
    typingInput.style.display = 'block';
    gameTitle.textContent = response.quizlet_title;
    let quizlet_id = response.quizlet_id;
    submitButton.disabled = false;
    addLinks(username, quizlet_id);
    playtime.start();
    newWord(username, response);
});
const login = () => {
    submitButton.disabled = true;
    const username = usernameInput.value;
    const password = passwordInput.value;
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/login`);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            if (response.success) {
                const expirationDate = new Date(response.expires_at);
                document.cookie = `auth_token=${response.auth_token}; expires=${expirationDate.toUTCString()}; path=/;`;
                let urlValue = urlInput.value;
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
    const data = {
        username,
        password
    };
    xhr.send(JSON.stringify(data));
};
const getWords = (username) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    loading();
    console.log('Getting words...');
    let params;
    let urlValue;
    let quizlet_id;
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown) {
        const selectedOption = dropdown.querySelector('option[style*="background-color: rgb(206, 206, 206);"]');
        if (selectedOption) {
            urlValue = ((_b = selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.getAttribute('value')) === null || _b === void 0 ? void 0 : _b.trim()) || '';
            console.log('Selected option: ', urlValue);
        }
        else {
            urlValue = urlInput.value.trim();
        }
    }
    else {
        urlValue = urlInput.value.trim();
    }
    const quizletMath = urlValue.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (quizletMath) {
        quizlet_id = quizletMath[1];
    }
    else {
        quizlet_id = urlValue;
    }
    console.log('Found quizlet id!: ', quizlet_id);
    params = `quizlet_id=${quizlet_id}`;
    localStorage.setItem('quizlet', quizlet_id);
    console.log(params);
    setting_username.textContent = username;
    accountLink.href = `/account?user=${username}`;
    accountLink.target = '_blank';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    const cachedDataString = localStorage.getItem("quizletData");
    const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null;
    if (cachedData) {
        const cacheAge = Date.now() - cachedData.timestamp;
        if (cacheAge < CACHE_DURATION && quizlet_id === cachedData.data.quizlet_id) {
            console.log(cachedData.data.quizlet_title);
            console.log("Found cached data!");
            startGame(username, cachedData.data);
            return;
        }
    }
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/get/quizlet/data?${params}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            const cachedResponse = {
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
});
let randomIndex = 0;
let lastIndex = 0;
const newWord = (username, response) => __awaiter(void 0, void 0, void 0, function* () {
    typingInput.value = '';
    typingInput.style.display = 'block';
    let num = 0;
    const termLength = response.term.length;
    const defLength = response.def.length;
    const maxIndex = Math.max(termLength, defLength) - 1;
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
    const term = response.term[randomIndex];
    const def = response.def[randomIndex];
    if (randomIndex === 0) {
        randomIndex++;
    }
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    let termFontSize, defFontSize, wordCountBottom;
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
    const MIN_FONT_SIZE = 0.5;
    const isTextFits = (text, fontSize) => {
        const textWidth = getTextWidth(text, fontSize);
        const pageWidth = window.innerWidth;
        return textWidth <= pageWidth;
    };
    const getTextWidth = (text, fontSize) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            return 0;
        }
        ;
        context.font = `${fontSize}vw sans-serif`;
        return context.measureText(text).width;
    };
    const fitText = (text, textElement, fontSize) => {
        while (!isTextFits(text, fontSize) && fontSize > MIN_FONT_SIZE) {
            fontSize -= 0.5;
            textElement.style.fontSize = `${fontSize}vw`;
        }
        textElement.style.fontSize = `${fontSize}vw`;
        textElement.textContent = text;
        furigana(text, (furigana) => {
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
});
const fixTextPosition = () => {
    let termFontSize = 70;
    let defFontSize = 120;
    while ((defText.scrollWidth > defText.offsetWidth || defText.scrollHeight > defText.offsetHeight)) {
        defFontSize--;
        defText.style.fontSize = `${defFontSize}px`;
    }
    while ((termText.scrollWidth > termText.offsetWidth || termText.scrollHeight > termText.offsetHeight)) {
        termFontSize--;
        termText.style.fontSize = `${termFontSize}px`;
    }
    const defRect = defText.getBoundingClientRect();
    const termRect = termText.getBoundingClientRect();
    const distance = defRect.top - termRect.bottom;
    if (distance < 30 && toggleFurigana.textContent === 'ON' && defText.innerHTML.includes("<ruby>")) {
        termText.style.bottom = `${80 - distance}px`;
        console.log('Adjusting position!');
    }
    // const defStyles = window.getComputedStyle(defText);
    // wordCountText.style.bottom = `calc(${window.getComputedStyle(defText).getPropertyValue("bottom") } - 30)px`;
};
const checkAndSetStyle = (element, fontSize, bottom) => {
    const containerHeight = element.parentNode.clientHeight;
    const contentHeight = element.scrollHeight;
    const newFontSize = (containerHeight / contentHeight) * fontSize;
    if (newFontSize <= fontSize) {
        element.style.fontSize = `${newFontSize}vw`;
        element.style.bottom = bottom;
    }
};
let composing = false;
const typing = (num, def, term, username, response) => {
    console.log('def: ' + def);
    composing = false;
    const onInput = (event) => {
        var _a, _b;
        if (composing)
            return; // return early if composing
        const inputText = event.data;
        const inputLength = inputText ? inputText.length : 0;
        if (event.inputType === 'deleteContentBackward' && num > 0) {
            num -= 1;
            let typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            let notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
            console.log("deleted!");
        }
        else if (event.inputType !== 'deleteContentBackward') {
            let correct = true;
            for (let i = 0; i < inputLength; i++) {
                if (def[num + i] !== (inputText === null || inputText === void 0 ? void 0 : inputText[i])) {
                    correct = false;
                    break;
                }
            }
            if (correct) {
                let typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num + inputLength) + "</span>";
                let notYet = "<span style='color: #1fd755;' id='notYet'>" + def.substring(num + inputLength) + "</span>";
                num += inputLength;
                if (num >= def.length) {
                    // Remove input and compositionend event listeners
                    typingInput.removeEventListener('input', onInput);
                    typingInput.removeEventListener('compositionend', () => { });
                    const wordCount = parseInt((_b = (_a = wordCountText === null || wordCountText === void 0 ? void 0 : wordCountText.textContent) === null || _a === void 0 ? void 0 : _a.split(': ')[1]) !== null && _b !== void 0 ? _b : '0');
                    wordCountText.innerHTML = `Words: ${wordCount + 1}`;
                    let randomIndex = termText.getAttribute('data-random-index');
                    submitTyped(def, term, randomIndex, username, response);
                    sendPlaytime(username);
                    newWord(username, response);
                }
                else {
                    document.querySelector("#def").innerHTML = typedOut + notYet;
                }
            }
            else {
                let typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
                let notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
                document.querySelector("#def").innerHTML = typedOut + notYet;
            }
        }
    };
    typingInput.addEventListener('input', onInput);
    typingInput.addEventListener('compositionstart', () => {
        composing = true;
    });
    typingInput.addEventListener('compositionend', (event) => {
        composing = false;
        console.log('Composed: ' + event.data);
        onInput(event);
    });
};
const submitTyped = (def, term, randomIndex, username, response) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/post/typed`);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            addHistoryDisplay(term, def);
            console.log(response);
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
    let quizlet_id = response.quizlet_id;
    const data = {
        term,
        def,
        randomIndex,
        username,
        quizlet_id
    };
    xhr.send(JSON.stringify(data));
};
const getHistory = (username, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(username);
    username = username.trim();
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/get/history?username=${username}&quizlet_id=${response.quizlet_id}`);
        xhr.onload = function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    console.log(response);
                    yield displayHistory(response);
                    resolve(response);
                }
                else {
                    console.error(xhr.statusText);
                    console.error('Request failed.');
                    reject(xhr.statusText);
                }
            });
        };
        xhr.onerror = function () {
            console.error(xhr.statusText);
            console.error('Request failed.');
            reject(xhr.statusText);
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
    });
});
const displayHistory = (response) => {
    const history = response.history;
    let promises = [];
    let historyHTML = '<table><tbody>';
    if (wordCountText) {
        wordCountText.innerHTML = `Words: ${history.length}`;
    }
    for (let i = 0; i < history.length; i++) {
        const term = history[i].term;
        const def = history[i].def;
        const termPromise = new Promise((resolve, reject) => {
            furigana(term, (termWithFurigana) => {
                resolve(termWithFurigana || '');
            });
        });
        const defPromise = new Promise((resolve, reject) => {
            furigana(def, (defWithFurigana) => {
                resolve(defWithFurigana || '');
            });
        });
        promises.push(Promise.all([termPromise, defPromise]));
    }
    return Promise.all(promises).then((results) => {
        for (let i = 0; i < results.length; i++) {
            const termWithFurigana = results[i][0];
            const defWithFurigana = results[i][1];
            historyHTML += `<tr><td>${defWithFurigana}:</td><td>${termWithFurigana}</td></tr>`;
        }
        historyHTML += '</tbody></table>';
        if (historyDIV) {
            historyDIV.innerHTML = historyHTML;
            updateFurigana();
        }
    }).catch((error) => {
        console.error(error);
        historyHTML += '</tbody></table>';
        if (historyDIV) {
            historyDIV.innerHTML = historyHTML;
            updateFurigana();
        }
    });
};
const addLinks = (username, quizlet_id) => {
    linkText.innerHTML = '';
    const leaderboardLink = document.createElement('a');
    leaderboardLink.href = `/leaderboard?quizlet_id=${quizlet_id}`;
    leaderboardLink.textContent = 'Leaderboard';
    leaderboardLink.onclick = function (event) {
        event.preventDefault(); // Prevent the link from opening in a new tab
        openOverlay(`/leaderboard?quizlet_id=${quizlet_id}`, username);
    };
    linkText.appendChild(leaderboardLink);
    const profileLink = document.createElement('a');
    profileLink.href = `/profile?user=${username}`;
    profileLink.textContent = 'Profile';
    profileLink.onclick = function (event) {
        event.preventDefault(); // Prevent the link from opening in a new tab
        openOverlay(`/profile?user=${username}`, username);
    };
    linkText.appendChild(profileLink);
};
let currentOverlay = null;
const openOverlay = (url, username) => {
    sendPlaytime(username);
    // Remove the previous overlay
    if (currentOverlay !== null) {
        currentOverlay.remove();
    }
    // Create a modal overlay
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    // Create a close button
    const closeButton = document.createElement('button');
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
    const iframe = document.createElement('iframe');
    iframe.src = url;
    overlay.appendChild(iframe);
    // Add the overlay to the page
    document.body.appendChild(overlay);
    currentOverlay = overlay;
    document.addEventListener('click', (event) => {
        const isAnchor = Array.from(linkText.querySelectorAll('a')).some((a) => a.contains(event.target));
        if (!isAnchor) {
            overlay.remove();
            currentOverlay = null;
            document.removeEventListener('click', () => { });
            typingInput.focus();
        }
    });
};
const addHistoryDisplay = (term, def) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const newRow = document.createElement('tr');
    let defTd = def;
    let termTd = term;
    termTd = (_c = yield furigana(term, (term) => {
        if (term) {
            termTd = term;
        }
    })) !== null && _c !== void 0 ? _c : term;
    defTd = (_d = yield furigana(def, (def) => {
        if (def) {
            defTd = def;
        }
    })) !== null && _d !== void 0 ? _d : def;
    newRow.innerHTML = `<td>${defTd}:</td><td>${termTd}</td>`;
    historyDIV.querySelector('tbody').insertAdjacentElement('afterbegin', newRow);
    updateFurigana();
    addWordCountDisplay();
});
const addWordCountDisplay = () => {
    const tbody = historyDIV.querySelector('table tbody');
    if (tbody instanceof HTMLTableElement) {
        const wordCount = tbody.rows.length;
        wordCountText.innerHTML = `Words: ${wordCount}`;
        updateFurigana();
    }
};
const furigana = (word, callback) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/get/furigana?word=${word}`);
        xhr.onload = function () {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                const furigana = response.furigana;
                if (furigana !== undefined) {
                    console.log(furigana);
                    callback(furigana);
                    resolve(furigana);
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
        const inputEvent = new InputEvent('input', {
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
const showFurigana = () => {
    const rtElements = document.querySelectorAll('rt');
    for (let i = 0; i < rtElements.length; i++) {
        const rtElement = rtElements[i];
        rtElement.style.display = 'block';
    }
    toggleFurigana.textContent = 'ON';
    localStorage.setItem('furigana', 'ON');
};
// Function to hide all furigana elements
const hideFurigana = () => {
    const rtElements = document.querySelectorAll('rt');
    for (let i = 0; i < rtElements.length; i++) {
        const rtElement = rtElements[i];
        rtElement.style.display = 'none';
    }
    toggleFurigana.textContent = 'OFF';
    localStorage.setItem('furigana', 'OFF');
};
const furiganaSetting = (status) => {
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
const updateFurigana = () => {
    if (toggleFurigana.textContent === "ON") {
        showFurigana();
    }
    else {
        hideFurigana();
    }
    fixTextPosition();
};
const getNewQuizletData = () => {
    const urlValue = quizletLinkSettings.value;
    const username = usernameInput.value;
    submitQuizletButton.disabled = true;
    const currentQuizlet = localStorage.getItem('quizlet');
    let params;
    let new_quizlet_id, current_quizlet_id;
    const quizlet_id_match = urlValue.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (quizlet_id_match) {
        new_quizlet_id = quizlet_id_match[1];
    }
    const currentQuizletMatch = currentQuizlet === null || currentQuizlet === void 0 ? void 0 : currentQuizlet.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (currentQuizletMatch) {
        current_quizlet_id = currentQuizletMatch[1];
    }
    params = `quizlet_id=${new_quizlet_id}`;
    if (new_quizlet_id && new_quizlet_id !== current_quizlet_id) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/get/quizlet/data?${params}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                console.log(new_quizlet_id);
                console.log(response);
                const cachedResponse = {
                    data: response,
                    timestamp: Date.now()
                };
                localStorage.setItem("quizletData", JSON.stringify(cachedResponse));
                gameTitle.textContent = response.quizlet_title;
                let quizlet_id = response.quizlet_id;
                localStorage.setItem("quizlet", quizlet_id);
                addLinks(username, quizlet_id);
                getHistory(username, response);
                newWord(username, response);
                submitQuizletButton.disabled = false;
                menuToggle.click();
            }
            else if (xhr.status === 400) {
                console.error(xhr.statusText);
                submitQuizletButton.disabled = false;
                quizletLinkSettings.style.borderColor = 'red';
                quizletLinkSettings.value = '';
                quizletLinkSettings.placeholder = 'Please use quizlet.com';
            }
            else {
                console.error(xhr.statusText);
                submitQuizletButton.disabled = false;
            }
        };
        xhr.onerror = function () {
            console.error(xhr.statusText);
            console.error('Request failed.');
            submitQuizletButton.disabled = false;
        };
        xhr.send();
    }
    else {
        submitQuizletButton.disabled = false;
        quizletLinkSettings.style.borderColor = 'red';
    }
};
const sendPlaytime = (username) => {
    playtime.stop();
    const playtimeInMilliseconds = calculatePlaytimeInMilliseconds();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/post/playtime`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = xhr.responseText;
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
        playtime: playtimeInMilliseconds,
    }));
};
const calculatePlaytimeInMilliseconds = () => {
    let totalTime = 0;
    const items = playtime.get();
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const startTime = item.startTime ? new Date(item.startTime) : undefined;
        const stopTime = item.stopTime ? new Date(item.stopTime) : undefined;
        if (startTime && stopTime) {
            const playtimeInMilliseconds = stopTime.getTime() - startTime.getTime();
            totalTime += playtimeInMilliseconds;
        }
    }
    console.log(totalTime);
    return totalTime;
};
window.addEventListener('blur', () => {
    playtime.stop();
});
window.addEventListener('focus', () => {
    if (loadingSection.style.display === "none") {
        const authToken = getAuthToken(); // replace this with your function to get the auth token from the cookie
        if (authToken) {
            playtime.start();
        }
    }
});
function getAuthToken() {
    const cookie = document.cookie;
    if (cookie) {
        const cookieParts = cookie.split('; ');
        for (const part of cookieParts) {
            if (part.startsWith('auth_token=')) {
                return part.substring('auth_token='.length);
            }
        }
    }
    return null;
}
toggleFurigana.addEventListener("click", () => {
    if (toggleFurigana.textContent === "ON") {
        hideFurigana();
    }
    else {
        showFurigana();
    }
});
window.addEventListener('beforeunload', function (event) {
    return __awaiter(this, void 0, void 0, function* () {
        const username = yield getUsername();
        console.log(username);
        if (username) {
            yield sendPlaytime(username);
        }
    });
});
window.onbeforeunload = function (e) {
    return __awaiter(this, void 0, void 0, function* () {
        e = e || window.event;
        // For IE and Firefox prior to version 4
        if (e) {
            e.returnValue = 'Sure?';
        }
        // For Safari
        return 'Sure?';
    });
};
logoutButton.addEventListener("click", () => {
    document.cookie = 'auth_token=;';
    window.location.reload();
});
const searchQuizlets = (searchTerm, quizlets) => {
    return quizlets.filter((quizlet) => {
        const searchStr = `${quizlet.quizlet_title} - ${quizlet.quizlet_id}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });
};
defText.addEventListener("click", () => {
    setTimeout(() => {
        typingInput.focus();
        console.log("focus!");
    }, 500);
});
