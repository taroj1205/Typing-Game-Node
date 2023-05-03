"use strict";
const searchButton = document.createElement('button');
searchButton.id = 'search-button';
searchButton.textContent = 'Search';
const searchContainer = document.createElement('div');
searchContainer.id = 'search-container';
const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.id = 'search-input';
searchInput.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});
const goButton = document.createElement('button');
goButton.textContent = 'Go';
goButton.addEventListener('click', performSearch);
const closeButton = document.createElement('button');
closeButton.textContent = 'Close';
closeButton.addEventListener('click', hideSearch);
searchContainer.appendChild(searchInput);
searchContainer.appendChild(goButton);
searchContainer.appendChild(closeButton);
function showSearch() {
    searchContainer.style.display = 'block';
    searchInput.focus(); // Set focus to input element when search container is shown
}
function hideSearch() {
    searchContainer.style.display = 'none';
}
function performSearch() {
    const searchTerm = searchInput.value;
    const searchUrl = `/profile?user=${searchTerm}`;
    globalThis.location.href = searchUrl;
}
searchButton.addEventListener('click', () => {
    if (searchContainer.style.display === 'block') {
        hideSearch();
    }
    else {
        showSearch();
    }
});
document.body.appendChild(searchButton);
document.body.appendChild(searchContainer);
