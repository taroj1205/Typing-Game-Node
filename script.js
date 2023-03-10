address = 'http://localhost:3000';
urlInput = document.getElementById("url");
usernameInput = document.getElementById("username");
passwordInput = document.getElementById("password");
submitButton = document.getElementById("submit");
termText = document.getElementById("term");
defText = document.getElementById("def");
loginSection = document.getElementById("login");
gameSection = document.getElementById("game");
titleHTML = document.querySelector("title")
typingInput = document.getElementById("typingInput");

window.onload = () => {
    loginSection.style.display = 'block';
    gameSection.style.display = 'none';
}

const setVisualViewport = () => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    root.style.setProperty('--vvw', `${vv.width}px`);
    root.style.setProperty('--vvh', `${vv.height}px`);
}
setVisualViewport()
window.visualViewport.addEventListener('resize', setVisualViewport)

const login = () => {
    submitButton.disabled = true;
    const username = usernameInput.value;
    const password = passwordInput.value;
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
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/start?url=${urlValue}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            newWord(username, response);
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
    loginSection.style.display = 'none';
    gameSection.style.display = 'block';
    titleHTML.textContent += ` - ${term}: ${def}`;
    typingInput.style.display = 'block';
    typingInput.focus();
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
                submitTyped(def, term, username);
                newWord(username, response);
            }
        } else {
            const typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            const notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
        }
    });
}

const submitTyped = (def, term, username) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${address}/submitTyped`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
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
    const data = { term, def, username };
    xhr.send(JSON.stringify(data));
}

document.addEventListener("keypress", function(event) {
    typingInput.focus();
    typingInput.value += event.key;
    const inputEvent = new InputEvent('input', {bubbles: true});
    typingInput.dispatchEvent(inputEvent);
});