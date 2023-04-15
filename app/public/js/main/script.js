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
    } else {
        console.log("Hiding furigana.");
        hideFurigana();
    }

    const username = await getUsername();
    console.log(username);
    if (username) {
        getWords(username);
    } else {
        loadingSection.style.display = 'none';
        loginSection.style.display = 'block';
    }

    setTimeout(() => {
        urlInput.focus();
    }, 500);

    fetch('/get/quizlet/list')
        .then((response) => response.json())
        .then((quizlets) => {
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
                const selectedQuizletId = event.target.value;
                console.log(selectedQuizletId);
                localStorage.setItem('quizlet', selectedQuizletId);
                urlInput.value = `https://quizlet.com/${selectedQuizletId}`;
            });

            // Set the initial value of the dropdown menu
            dropdownMenu.value = localStorage.getItem('quizlet');

            // Insert the dropdown menu after the URL input
            const urlInputParent = urlInput.parentElement;
            urlInputParent.insertBefore(dropdownContainer, urlInput.nextSibling);
            dropdownMenu.size = dropdownMenu.options.length;

            urlInput.addEventListener('input', (event) => {
                const searchTerm = urlInput.value;
                const matchingQuizlets = searchQuizlets(searchTerm, quizlets);
                dropdownMenu.options[0].style.backgroundColor = '#cecece';
                dropdownMenu.innerHTML = '';
                renderDropdownOptions(matchingQuizlets, dropdownMenu);
            });

            urlInput.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    // Up or down arrow key is pressed
                    const dropdownMenu = document.querySelector('#dropdown-menu');
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
                        } else if (event.key === 'ArrowDown' && selectedIndex < dropdownMenu.options.length - 1) {
                            selectedIndex++;
                        }
                        // Set the new value and background color of the input and options
                        const selectedOption = dropdownMenu.options[selectedIndex];
                        urlInput.value = selectedOption.textContent;
                        selectedOption.style.backgroundColor = '#cecece';
                        if (selectedIndex > 0) {
                            dropdownMenu.options[selectedIndex - 1].style.backgroundColor = 'white';
                        }
                        if (selectedIndex < dropdownMenu.options.length - 1) {
                            dropdownMenu.options[selectedIndex + 1].style.backgroundColor = 'white';
                        }
                        // Update the selected index in the dropdown menu
                        dropdownMenu.selectedIndex = selectedIndex;
                    }
                }
                if ((event.key === 'Tab' || event.key === 'Enter') && dropdownMenu.options.length > 0) {
                    urlInput.value = dropdownMenu.options[0].textContent;
                }
            });
        })
        .catch((error) => console.error(error));

    const renderDropdownOptions = (quizlets, dropdownMenu) => {
        quizlets.forEach((quizlet) => {
            // Create option element for each quizlet
            const option = document.createElement('option');
            option.textContent = quizlet.quizlet_title + ' - ' + quizlet.quizlet_id;
            option.value = quizlet.quizlet_id;
            option.style.display = 'block';
            dropdownMenu.appendChild(option);
        });
    };

}

const loading = () => {
    loadingText.textContent = 'Loading...';
    loadingSection.style.display = 'block';
    gameSection.style.display = 'none';
    loginSection.style.display = 'none';
    menuToggle.style.display = 'none';
    /*
    const quizlet = localStorage.getItem("quizlet");
    let quizlet_id_match;
    let quizlet_id = '';
    if (quizlet) {
        quizlet_id_match = localStorage.getItem("quizlet").match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
        quizlet_id = quizlet_id_match[1];
    }*/
    loadingInterval = setInterval(() => {
        loadingText.textContent += '.';
        /*
        const startTime = performance.now();
        const pingUrl = `https://quizlet.com/${quizlet_id}/`;
        fetch(pingUrl, { method: 'HEAD', mode: 'no-cors' }).then(() => {
            const endTime = performance.now();
            const pingTime = Math.round(endTime - startTime);
            pingText.textContent = `Ping to Quizlet: ${pingTime} ms`;
        }).catch((error) => {
            console.log(error);
        });
        */
    }, 1000);
    setTimeout(() => {
        if (loadingSection.style.display === 'block') {
            clearInterval(loadingInterval);
            document.cookie = 'auth_token=;';
            alert('Timeout reached. Reloading...');
            window.location.reload();
        }
    }, 15000);

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'c') {
            if (loadingSection.style.display === 'block') {
                document.cookie = 'auth_token=;';
                window.location.reload();
            }
        }
    });
}

const getUsername = async () => {
    const auth_token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

    if (auth_token) {
        const response = await fetch('/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({auth_token})
        });
        if (response.ok) {
            const {username} = await response.json();
            return username;
        } else {
            console.error('Error sending auth token:', response.statusText);
        }
    } else {
        console.log('No auth token found in cookie.');
    }
    return null;
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
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            if (response.success) {
                const expirationDate = new Date(response.expires_at);
                document.cookie = `auth_token=${response.auth_token}; expires=${expirationDate.toUTCString()}; path=/;`;
                let urlValue = urlInput.value;
                if (!urlValue) {
                    urlValue = document.getElementById('dropdown-menu').value;
                }
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
    xhr.onerror = function () {
        console.error(xhr.statusText);
        console.error('Request failed.');
        submitButton.disabled = false;
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    const data = {username, password};
    xhr.send(JSON.stringify(data));
}

const getWords = (username) => {
    let params;
    let urlValue;
    const dropdown = document.getElementById('dropdown-menu');

    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    if (dropdown && dropdown.options.length > 0) {
        urlValue = dropdown.options[0].value.trim();
    }
    else if (!urlValue) {
        urlValue = urlInput.value.trim();
    } else {
        loadingSection.style.display = 'none';
        loginSection.style.display = 'block';
    }

    const quizletMath = urlValue.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (quizletMath) {
        quizlet_id = quizletMath[1];
    } else {
        quizlet_id = urlValue;
    }
    params = `quizlet_id=${quizlet_id}`;
    localStorage.setItem('quizlet', quizlet_id);
    console.log(params);
    setting_username.textContent = username;

    const cachedData = localStorage.getItem("urlValue");
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
    xhr.open('GET', `${address}/get/quizlet/data?${params}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            const cachedResponse = {data: response, timestamp: Date.now()};
            localStorage.setItem("urlValue", JSON.stringify(cachedResponse));
            startGame(username, response);
        } else if (xhr.status === 400) {
            console.error(xhr.statusText);
            submitButton.disabled = false;
            urlInput.style.borderColor = 'red';
            urlInput.value = '';
            urlInput.placeholder = 'Please use quizlet.com';
            loadingSection.style.display = 'none';
            loginSection.style.display = 'block';
        } else {
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
}

let randomIndex = 0;
let lastIndex = 0;

const newWord = async (username, response) => {
    let num = 0;
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
    titleHTML.textContent = 'タイピングゲーム風単語学習 - ' + response.quizlet_title;
    typingInput.focus();

    await furigana(term, (term) => {
        termText.innerHTML = term;
        updateFurigana();
    });

    await furigana(def, (def) => {
        defText.innerHTML = def;
        updateFurigana();
    });

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

    typing(num, def, term, username, response);
}

const typing = (num, def, term, username, response) => {
    console.log('def: ' + def);
    typingInput.addEventListener("input", function (event) {
        if (event.inputType === "insertText" && event.data === def[num]) {
            console.log(event.data);
            num++;
            const typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            const notYet = "<span style='color: #1fd755;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
            if (num >= def.length) {
                const wordCount = parseInt(wordCountText.textContent.split(': ')[1]);
                wordCountText.innerHTML = `Words: ${wordCount + 1}`;
                submitTyped(def, term, username, response);
                sendPlaytime(username);
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
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            addHistoryDisplay(term, def);
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
    xhr.setRequestHeader('Content-Type', 'application/json');
    let quizlet_id = response.quizlet_id;
    const data = {term, def, username, quizlet_id};
    xhr.send(JSON.stringify(data));
}

const getHistory = async (username, response) => {
    console.log(username);
    username = username.trim();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/get/history?username=${username}&quizlet_id=${response.quizlet_id}`);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            displayHistory(response);
        } else {
            console.error(xhr.statusText);
            console.error('Request failed.');

        }
    };
    xhr.onerror = function () {
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

let currentOverlay = null;

const addLinks = (username, quizlet_id) => {
    linkText.innerHTML = '';

    const leaderboardLink = document.createElement('a');
    leaderboardLink.href = `${address}/leaderboard?quizlet_id=${quizlet_id}`;
    leaderboardLink.textContent = 'Leaderboard';
    leaderboardLink.onclick = function (event) {
        event.preventDefault(); // Prevent the link from opening in a new tab
        openOverlay(`${address}/leaderboard?quizlet_id=${quizlet_id}`);
    };
    linkText.appendChild(leaderboardLink);

    const profileLink = document.createElement('a');
    profileLink.href = `${address}/profile?user=${username}`;
    profileLink.textContent = 'Profile';
    profileLink.onclick = function (event) {
        event.preventDefault(); // Prevent the link from opening in a new tab
        openOverlay(`${address}/profile?user=${username}`);
    };
    linkText.appendChild(profileLink);
};

const openOverlay = (url) => {
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
    };
    overlay.appendChild(closeButton);

    // Create an iframe to load the page
    const iframe = document.createElement('iframe');
    iframe.src = url;
    overlay.appendChild(iframe);

    // Add the overlay to the page
    document.body.appendChild(overlay);
    currentOverlay = overlay;

    document.addEventListener('click', function (event) {
        const isAnchor = Array.from(linkText.querySelectorAll('a')).some((a) => a.contains(event.target));
        if (!isAnchor) {
            overlay.remove();
            currentOverlay = null;
            document.removeEventListener('click', this);
            typingInput.focus();
        }
    });
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
    xhr.onload = function () {
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
    xhr.onerror = function () {
        console.error(xhr.statusText);
        console.error('Request failed.');
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
}

document.addEventListener("keypress", function (event) {
    if (document.activeElement !== typingInput && typingInput.style.display === "block" && !composing) {
        typingInput.focus();
        typingInput.value += event.key;
        const inputEvent = new InputEvent('input', {bubbles: true});
        typingInput.dispatchEvent(inputEvent);
    }
});

menuToggle.addEventListener("click", function () {
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

    const currentQuizletMatch = currentQuizlet.match(/quizlet\.com\/(?:[a-z]{2}\/)?(\d+)/);
    if (currentQuizletMatch) {
        current_quizlet_id = currentQuizletMatch[1];
    }

    if (new_quizlet_id != current_quizlet_id) {
        localStorage.setItem('quizlet', new_quizlet_id);
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${address}/get/quizlet?${params}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                console.log(response);
                gameTitle.textContent = response.quizlet_title;
                quizlet_id = response.quizlet_id;
                addLinks(username, quizlet_id);
                getHistory(username, response);
                newWord(username, response);
                submitQuizletButton.disabled = false;
                menuToggle.click();
            } else if (xhr.status === 400) {
                console.error(xhr.statusText);
                submitQuizletButton.disabled = false;
                quizletLinkSettings.style.borderColor = 'red';
                quizletLinkSettings.value = '';
                quizletLinkSettings.placeholder = 'Please use quizlet.com';
            } else {
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
    } else {
        submitQuizletButton.disabled = false;
        quizletLinkSettings.style.borderColor = 'red';
    }
}

const sendPlaytime = (username) => {
    playtime.stop();
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
            playtime.start();
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

window.addEventListener('beforeunload', async function (event) {
    const username = await getUsername();
    console.log(username);
    if (username) {
        await sendPlaytime(username);
    }
});

window.onbeforeunload = async function (e) {
    e = e || window.event;

    // For IE and Firefox prior to version 4
    if (e) {
        e.returnValue = 'Sure?';
    }

    // For Safari
    return 'Sure?';
};

logoutButton.addEventListener("click", () => {
    document.cookie = 'auth_token=;';
    window.location.reload();
});

const searchQuizlets = (searchTerm, quizlets) => {
    return quizlets.filter((quizlet) => {
        return quizlet.quizlet_title.toLowerCase().includes(searchTerm.toLowerCase());
    });
};
