address = 'http://localhost:3000';
urlInput = document.getElementById("url");
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
    const urlValue = urlInput.value;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${address}/start?url=${urlValue}`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            console.log(response);
            start(response);
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

const start = (response) => {
    newWord(response);
}

const newWord = (response) => {
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
    typingInput.addEventListener("input", function(event) {
        if (event.inputType === "insertText" && event.data === def[num])
        {
            console.log(event.data);
            num++;
            const typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
            const notYet = "<span style='color: #1fd755;' id='notYet'>" + def.substring(num) + "</span>";
            document.querySelector("#def").innerHTML = typedOut + notYet;
            if (num >= def.length) {
                newWord(response);
            }
        } else {
                const typedOut = "<span style='color: grey;' id='typedOut'>" + def.substring(0, num) + "</span>";
                const notYet = "<span style='color: #e06c75;' id='notYet'>" + def.substring(num) + "</span>";
                document.querySelector("#def").innerHTML = typedOut + notYet;
        }
    });
}

document.addEventListener("keypress", function(event) {
    typingInput.focus();
    typingInput.value += event.key;
    const inputEvent = new InputEvent('input', {bubbles: true});
    typingInput.dispatchEvent(inputEvent);
});