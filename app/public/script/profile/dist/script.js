var searchButton = document.createElement('button');
searchButton.id = 'search-button';
searchButton.textContent = 'Search';
var searchContainer = document.createElement('div');
searchContainer.id = 'search-container';
var searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.id = 'search-input';
searchInput.addEventListener('keydown', function (event) {
    if (event.key === "Enter") {
        performSearch();
    }
});
var goButton = document.createElement('button');
goButton.textContent = 'Go';
goButton.addEventListener('click', performSearch);
var closeButton = document.createElement('button');
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
    var searchTerm = searchInput.value;
    var searchUrl = "/profile?user=" + searchTerm;
    globalThis.location.href = searchUrl;
}
searchButton.addEventListener('click', function () {
    if (searchContainer.style.display === 'block') {
        hideSearch();
    }
    else {
        showSearch();
    }
});
document.body.appendChild(searchButton);
document.body.appendChild(searchContainer);
