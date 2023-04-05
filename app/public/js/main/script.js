urlInput = document.getElementById("url");
usernameInput = document.getElementById("username");
passwordInput = document.getElementById("password");
submitButton = document.getElementById("submit");
termText = document.getElementById("term");
defText = document.getElementById("def");
loginSection = document.getElementById("login");
gameSection = document.getElementById("game");
statsSection = document.getElementById("stats");
titleHTML = document.querySelector("title")
typingInput = document.getElementById("typingInput");
historyDIV = document.getElementById("history");
menuToggle = document.getElementById("menuToggle");
menuScene = document.getElementById("menu");
gameTitle = document.getElementById("title");
wordCountText = document.getElementById("word_count");
linkText = document.getElementById("link");
toggleFurigana = document.getElementById("toggleFurigana");
furiganaSettingStatus = toggleFurigana.textContent;
quizletLinkSettings = document.getElementById("quizletLinkSettings");
submitQuizletButton = document.getElementById("submitQuizlet");
setting_username = document.getElementById("setting_username");
logoutButton = document.getElementById("logout");
loadingSection = document.getElementById("loading");
loadingText = loadingSection.querySelector('p');
pingText = document.getElementById("ping");

const address = '';

let loadingInterval;

class Playtime {
    constructor() {
        this.data = [];
    }

    start() {
        const nzTime = Date.now();
        this.data.push({startTime: nzTime});
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

window.onload = async () => {
    loadingSection.style.display = 'block';
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
    } else {
        console.log("Hiding furigana.");
        hideFurigana();
    }
    await getUsername();
}

const loading = () => {
    loadingSection.style.display = 'block';
    gameSection.style.display = 'none';
    loginSection.style.display = 'none';
    menuToggle.style.display = 'none';
    const quizlet = localStorage.getItem("quizlet");
    let quizlet_id_match;
    let quizlet_id = '';
    if (quizlet) {
        quizlet_id_match = localStorage.getItem("quizlet").match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
        quizlet_id = quizlet_id_match[1];
    }
    loadingInterval = setInterval(() => {
        loadingText.textContent += '.';
        const startTime = performance.now();
        const pingUrl = `https://quizlet.com/${quizlet_id}/`;
        fetch(pingUrl, { method: 'HEAD', mode: 'no-cors' }).then(() => {
            const endTime = performance.now();
            const pingTime = Math.round(endTime - startTime);
            pingText.textContent = `Ping to Quizlet: ${pingTime} ms`;
        }).catch((error) => {
            console.log(error);
        });
    }, 1000);
    setTimeout(() => {
        if (loadingSection.style.display === 'block') {
            clearInterval(loadingInterval);
            document.cookie = 'auth_token=;';
            alert('Timeout reached. Reloading...');
            window.location.reload();
        }
    }, 15000);
}
const getUsername = async () => {
    loading();
    const auth_token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
    if (auth_token) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/auth');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('Auth token matched successfully.');
                const response = JSON.parse(xhr.responseText);
                const username = response.username;
                getWords(username);
            } else {
                console.log('Error sending auth token:', xhr.statusText);
            }
        };
        xhr.onerror = function() {
            console.error('Error sending auth token:', xhr.statusText);
            loadingSection.style.display = 'none';
            submitButton.disabled = false;
        };
        xhr.send(JSON.stringify({ auth_token }));
    } else {
        loadingSection.style.display = 'none';
        loginSection.style.display = 'block';
        submitButton.disabled = false;
        console.log('No auth token found in cookie.');
    }
}
const setVisualViewport = () => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    root.style.setProperty('--vvw', `${vv.width}px`);
    root.style.setProperty('--vvh', `${vv.height}px`);
    const linkHeight = linkText.clientHeight;
    const windowHeight = vv.height;
    const keyboardHeight = windowHeight - vv.innerHeight;
    if (keyboardHeight > 0) {
        linkText.style.bottom = `${keyboardHeight + linkHeight}px`;
    } else {
        linkText.style.bottom = `1rem`;
    }
}
setVisualViewport();
window.visualViewport.addEventListener('resize', setVisualViewport)
const startGame = async (username, response) => {
    console.log(username);
    console.log(response);
    await getHistory(username, response);
    setTimeout(() => {
        clearInterval(loadingInterval);
        loadingSection.style.display = 'none';
        menuToggle.style.display = 'block';
        loginSection.style.display = 'none';
        gameSection.style.display = 'block';
        statsSection.style.display = 'block';
        typingInput.style.display = 'block';
        gameTitle.textContent = response.quizlet_title;
        quizlet_id = response.quizlet_id;
        submitButton.disabled = false;
        addLinks(username, quizlet_id);
        newWord(username, response);
    }, 1500);
}
const login = () => {
    submitButton.disabled = true;
    const username = usernameInput.value;
    const password = passwordInput.value;
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${address}/login`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            if (response.success) {
                const expirationDate = new Date(response.expires_at);
                document.cookie = `auth_token=${response.auth_token}; expires=${expirationDate.toUTCString()}; path=/;`;
                const urlValue = urlInput.value;
                localStorage.setItem('quizlet', urlValue);
                getWords(username);
            } else {
                console.error('Login failed.');
                alert('Wrong username or password.');
                submitButton.disabled = false;
            }
        } else {
            console.error(xhr.statusText);
            console.error('Request failed.');
            submitButton.disabled = false;
        }
    };
    xhr.onerror = function() {
        console.error(xhr.statusText);
        console.error('Request failed.');
        submitButton.disabled = false;
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    const data = { username, password };
    xhr.send(JSON.stringify(data));
}

const getWords = (username) => {
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    const urlValue = localStorage.getItem("quizlet");
    setting_username.textContent = username;

    const cachedData = localStorage.getItem(urlValue);
    if (cachedData) {
        const cachedResponse = JSON.parse(cachedData);
        const cacheAge = Date.now() - cachedResponse.timestamp;
        if (cacheAge < CACHE_DURATION) {
            console.log(cachedResponse.data.quizlet_title);
            startGame(username, cachedResponse.data);
            return;
        }
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/get/quizlet?url=${urlValue}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            const cachedResponse = { data: response, timestamp: Date.now() };
            localStorage.setItem(urlValue, JSON.stringify(cachedResponse));
            startGame(username, response);
        } else if (xhr.status === 400) {
            console.error(xhr.statusText);
            submitButton.disabled = false;
            urlInput.style.borderColor = 'red';
            urlInput.value = '';
            urlInput.placeholder = 'Please use quizlet.com';
        } else {
            console.error(xhr.statusText);
            submitButton.disabled = false;
        }
    };
    xhr.onerror = function() {
        console.error(xhr.statusText);
        console.error('Request failed.');
        submitButton.disabled = false;
    };
    xhr.send();
}

let randomIndex = 0;
let lastIndex = 0;

const newWord = (username, response) => {
    let num = 0;
    typingInput.value = '';
    const termLength = response.term.length;
    const defLength = response.def.length;
    const maxIndex = Math.max(termLength, defLength) - 1;

    if (maxIndex < 10 || termLength === 1) {
        randomIndex++;
        if (randomIndex > maxIndex) {
            randomIndex = 0;
        }
    } else {
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

    termText.textContent = term;
    defText.textContent = def;
    titleHTML.textContent += ' - ' + response.quizlet_title;
    typingInput.focus();
    const termPromise = new Promise((resolve, reject) => {
        furigana(term, (term) => {
            resolve(term);
        });
    });

    const defPromise = new Promise((resolve, reject) => {
        furigana(def, (def) => {
            resolve(def);
        });
    });

    Promise.all([termPromise, defPromise]).then(([termFurigana, defFurigana]) => {
        termText.innerHTML = termFurigana;
        defText.innerHTML = defFurigana;

        updateFurigana();
        let termFontSize = 70;
        let defFontSize = 120;

        while ((defText.scrollWidth > defText.offsetWidth || defText.scrollHeight > defText.offsetHeight)) {
            defFontSize--;
            defText.style.fontSize = `${defFontSize}px`;
            defFontSize = 120;
        }

        while ((termText.scrollWidth > termText.offsetWidth || termText.scrollHeight > termText.offsetHeight)) {
            termFontSize--;
            termText.style.fontSize = `${termFontSize}px`;
            termFontSize = 70;
        }

        typing(num, defFurigana, termFurigana, username, response);
    });
}

const typing = (num, def, term, username, response) => {
    typingInput.addEventListener("input", function(event) {
        if (event.inputType === "insertText" && event.data === def[num])
        {
            console.log(event.data);
            num++;
            const typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            const notYet = "<span style='color: #1fd755;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
            if (num >= def.length) {
                const wordCount = parseInt(wordCountText.textContent.split(': ')[1]);
                wordCountText.innerHTML = `Words: ${wordCount+1}`;
                submitTyped(def, term, username, response);
                newWord(username, response);
            }
        } else {
            const typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            const notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
        }
    });
}

const submitTyped = (def, term, username, response) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${address}/post/typed`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            addHistoryDisplay(term, def);
            console.log(response);
        } else {
            console.error(xhr.statusText);
            console.error('Request failed.');
            return;
        }
    };
    xhr.onerror = function() {
        console.error(xhr.statusText);
        console.error('Request failed.');
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    let quizlet_id = response.quizlet_id;
    const data = { term, def, username, quizlet_id };
    xhr.send(JSON.stringify(data));
}

const getHistory = async (username, response) => {
    username = username.trim();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/get/history?username=${username}&quizlet_id=${response.quizlet_id}`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            displayHistory(response);
        } else {
            console.error(xhr.statusText);
            console.error('Request failed.');
            return;
        }
    };
    xhr.onerror = function() {
        console.error(xhr.statusText);
        console.error('Request failed.');
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
}

const displayHistory = (response) => {
    const history = response.history;
    let promises = [];
    let historyHTML = '<table><tbody>';

    wordCountText.innerHTML = `Words: ${history.length}`;

    for (let i = 0; i < history.length; i++) {
        const term = history[i].term;
        const def = history[i].def;
        const termPromise = new Promise((resolve, reject) => {
            furigana(term, (termWithFurigana) => {
                resolve(termWithFurigana);
            });
        });
        const defPromise = new Promise((resolve, reject) => {
            furigana(def, (defWithFurigana) => {
                resolve(defWithFurigana);
            });
        });
        promises.push(Promise.all([termPromise, defPromise]));
    }

    Promise.all(promises).then((results) => {
        for (let i = 0; i < results.length; i++) {
            const termWithFurigana = results[i][0];
            const defWithFurigana = results[i][1];
            historyHTML += `<tr><td>${defWithFurigana}:</td><td>${termWithFurigana}</td></tr>`;
        }
        historyHTML += '</tbody></table>';
        historyDIV.innerHTML = historyHTML;
        updateFurigana();
    }).catch((error) => {
        console.error(error);
        historyHTML += '</tbody></table>';
        historyDIV.innerHTML = historyHTML;
        updateFurigana();
    });
}

const addLinks = (username, quizlet_id) => {
    linkText.innerHTML = '';
    const leaderboardLink = document.createElement('a');
    leaderboardLink.href = `${address}/leaderboard?quizlet_id=${quizlet_id}`;
    leaderboardLink.textContent = 'Leaderboard';
    leaderboardLink.target = '_blank'; // Open link in a new tab
    linkText.appendChild(leaderboardLink);

    const profileLink = document.createElement('a');
    profileLink.href = `${address}/profile/?user=${username}`;
    profileLink.textContent = 'Profile';
    profileLink.target = '_blank'; // Open link in a new tab
    linkText.appendChild(profileLink);
};

const addHistoryDisplay = (term, def) => {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `<td>${def}:</td><td>${term}</td>`;
    historyDIV.querySelector('tbody').insertAdjacentElement('afterbegin', newRow);
    addWordCountDisplay();
}

const addWordCountDisplay = () => {
    const wordCount = historyDIV.querySelector('table tbody').rows.length;
    wordCountText.innerHTML = `Words: ${wordCount}`;
    updateFurigana();
}

const furigana = (word, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/get/furigana?word=${word}`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response.furigana);
            callback(response.furigana);
        } else {
            console.error(xhr.statusText);
            console.error('Request failed.');
            callback(response.furigana);
        }
    };
    xhr.onerror = function() {
        console.error(xhr.statusText);
        console.error('Request failed.');
        termText.textContent = term;
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
}

document.addEventListener("keypress", function(event) {
    if (document.activeElement !== typingInput && typingInput.style.display === "block" && !composing) {
        typingInput.focus();
        typingInput.value += event.key;
        const inputEvent = new InputEvent('input', {bubbles: true});
        typingInput.dispatchEvent(inputEvent);
    }
});

menuToggle.addEventListener("click", function() {
    menuScene.style.display = (menuScene.style.display === "inline-block") ? "none" : "inline-block";
    gameSection.style.display = (gameSection.style.display === "block") ? "none" : "block";
    linkText.style.display = (linkText.style.display === "block") ? "none" : "block";

    if (menuToggle.textContent === "\u2630") {
        typingInput.style.display = "none";
        menuToggle.textContent = "\u2716";
        playtime.stop();
    } else {
        document.body.appendChild(typingInput);
        typingInput.style.display = "block";
        menuToggle.textContent = "\u2630";
        playtime.start();
    }

    quizletLinkSettings.value = localStorage.getItem('quizlet');

    if (typingInput.style.display === "block")
    {
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

// Main function for toggling furigana display
const furiganaSetting = (status) => {
    if (status === "ON") {
        showFurigana();
    } else if (status === "OFF") {
        hideFurigana();
    } else {
        if (toggleFurigana.textContent === "OFF") {
            showFurigana();
        } else {
            hideFurigana();
        }
    }
    toggleFurigana.innerHTML = localStorage.getItem('furigana');
};

const updateFurigana = () => {
    if (toggleFurigana.textContent === "ON") {
        showFurigana();
    } else {
        hideFurigana();
    }
};

const getNewQuizletData = () => {
    submitButton.disabled = true;
    const url = quizletLinkSettings.value.trim();
    const oldURL = localStorage.getItem('quizlet');
    if (oldURL !== url) {
        localStorage.setItem('quizlet', url);
        submitButton.disabled = false;
        quizletLinkSettings.style.borderColor = '';
        menuToggle.click();
        getUsername();
    } else {
        submitQuizletButton.disabled = false;
        quizletLinkSettings.style.borderColor = 'red';
        quizletLinkSettings.value = '';
        quizletLinkSettings.placeholder = 'Please enter new Quizlet link';
    }
}

const sendPlaytime = () => {
    playtime.stop();
    const username = usernameInput.value;
    const playtimeInMilliseconds = calculatePlaytimeInMilliseconds();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${address}/post/playtime`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = xhr.responseText;
            playtime.reset();
            playtime.start();
            console.log(response);
        } else {
            console.error(xhr.statusText);
            console.error('Request failed.');
        }
    };
    xhr.onerror = function () {
        console.error(xhr.statusText);
        console.error('Request failed.');
    };
    xhr.send(JSON.stringify({
        username: username,
        playtime: playtimeInMilliseconds,
    }));
}

const calculatePlaytimeInMilliseconds = () => {
    let totalTime = 0;
    const items = playtime.get();
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const startTime = new Date(item.startTime);
        const stopTime = new Date(item.stopTime);
        const playtimeInMilliseconds = stopTime - startTime;
        totalTime += playtimeInMilliseconds;
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

toggleFurigana.addEventListener("click", furiganaSetting);

window.onbeforeunload = function () {
    sendPlaytime();
}

logoutButton.addEventListener("click", () => {
    document.cookie = 'auth_token=;';
    window.location.reload();
});