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
leaderboardText = document.getElementById("leaderboard");

const hostname = window.location.hostname; // Get the hostname of the current page
const port = 8000; // Set the port number for your server
const protocol = window.location.protocol; // Get the protocol (http or https) of the current page

const address = `${protocol}//${hostname}:${port}`; // Build the URL for your server

window.onload = () => {
    loginSection.style.display = 'block';
    gameSection.style.display = 'none';
    statsSection.style.display = 'none';
    urlInput.value = localStorage.getItem('quizlet') || '';
    usernameInput.value = localStorage.getItem('username') || '';
    passwordInput.value = localStorage.getItem('password') || '';
}

const setVisualViewport = () => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    root.style.setProperty('--vvw', `${vv.width}px`);
    root.style.setProperty('--vvh', `${vv.height}px`);
}
setVisualViewport()
window.visualViewport.addEventListener('resize', setVisualViewport)

const start = (username, response) => {
    loginSection.style.display = 'none';
    gameSection.style.display = 'block';
    statsSection.style.display = 'block';
    typingInput.style.display = 'block';
    gameTitle.textContent = response.title;
    quizlet_id = response.quizlet_id;
    addLeaderboardLink(quizlet_id);
    getHistory(username, response);
    newWord(username, response);
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
            return;
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
    const urlValue = urlInput.value;
    localStorage.setItem('quizlet', urlValue);
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/get/quizlet?url=${urlValue}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            start(username, response);
            submitButton.disabled = false;
        } else if (xhr.status === 400) {
            console.error(xhr.statusText);
            submitButton.disabled = false;
            urlInput.style.borderColor = 'red';
            urlInput.value = '';
            urlInput.placeholder = 'Please use quizlet.com';
        } else {
            console.error(xhr.statusText);
            submitButton.disabled = false;
            return;
        }
    };
    xhr.onerror = function() {
        console.error(xhr.statusText);
        console.error('Request failed.');
        submitButton.disabled = false;
    };
    xhr.send();
}

const newWord = (username, response) => {
    let num = 0;
    const termLength = response.term.length;
    const defLength = response.def.length;
    const maxIndex = Math.max(termLength, defLength) - 1;
    const randomIndex = Math.floor(Math.random() * (maxIndex + 1));
    const term = response.term[randomIndex];
    const def = response.def[randomIndex];
    termText.textContent = term;
    defText.textContent = def;
    titleHTML.textContent += ' - ' + response.title;
    typingInput.focus();
    furigana(term, (term) => {
        termText.innerHTML = term;
    });
    typing(num, def, term, username, response);
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

const getHistory = (username, response) => {
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

    for (let i = 0; i < history.length; i++) {
        const term = history[i].term;
        const def = history[i].def;
        const promise = new Promise((resolve, reject) => {
            furigana(term, (term) => {
                resolve(`<tr><td>${def}:</td><td>${term}</td></tr>`);
            });
        });
        promises.push(promise);
    }

    Promise.all(promises).then((results) => {
        historyHTML += results.join('');
        historyHTML += '</tbody></table>';
        historyDIV.innerHTML = historyHTML;
        addWordCountDisplay();
    }).catch((error) => {
        console.error(error);
        historyHTML += '</tbody></table>';
        historyDIV.innerHTML = historyHTML;
        addWordCountDisplay();
    });
}

const addLeaderboardLink = (quizlet_id) => {
    const link = document.createElement('a');
    link.href = `${address}/rank/words?quizlet_id=${quizlet_id}`;
    link.textContent = 'Go to leaderboard';
    link.target = '_blank'; // Open link in a new tab
    leaderboardText.appendChild(link);
};

const addHistoryDisplay = (term, def) => {
    const newRow = document.createElement('tr');
    furigana(term, (term) => {
        newRow.innerHTML = `<td>${def}:</td><td>${term}</td>`;
        historyDIV.querySelector('tbody').insertAdjacentElement('afterbegin', newRow);
        addWordCountDisplay();
    });
}

const addWordCountDisplay = () => {
    const wordCount = historyDIV.querySelector('table tbody').rows.length;
    wordCountText.innerHTML = `Words: ${wordCount}`;
}

const furigana = (term, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/get/furigana?term=${term}`);
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
    typingInput.focus();
    typingInput.value += event.key;
    const inputEvent = new InputEvent('input', {bubbles: true});
    typingInput.dispatchEvent(inputEvent);
})

menuToggle.addEventListener("click", function() {
    menuScene.style.display = (menuScene.style.display === "inline-block") ? "none" : "inline-block";
    typingInput.style.display = (typingInput.style.display === "block") ? "none" : "block";
    gameSection.style.display = (gameSection.style.display === "block") ? "none" : "block";
    if (typingInput.style.display === "block")
    {
        typingInput.focus();
        console.log("Focus changed!");
    }
    if (menuToggle.textContent === "\u2630") {
        menuToggle.textContent = "\u2716";
    } else {
        menuToggle.textContent = "\u2630";
    }
});

const furiganaSetting = () => {
    const rtElements = document.querySelectorAll('rt'); // Get all rt elements
    for (let i = 0; i < rtElements.length; i++) {
        const rtElement = rtElements[i];
        if (rtElement.style.display === 'none') {
            rtElement.style.display = 'block'; // Show hidden rt element
            localStorage.setItem('furigana', 'true');
        } else {
            rtElement.style.display = 'none'; // Hide visible rt element
            localStorage.setItem('furigana', 'false');
        }
    }
}