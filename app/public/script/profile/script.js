"use strict";
const searchContainer = document.getElementById('search-container');
const searchButton = document.getElementById('search-button');
function showSearch() {
    if (searchContainer !== null) {
        searchContainer.style.display = 'block';
    }
}
function hideSearch() {
    if (searchContainer) {
        searchContainer.style.display = 'none';
    }
}
function performSearch() {
    var _a;
    const searchTerm = (_a = document.getElementById('search-input')) === null || _a === void 0 ? void 0 : _a.value;
    const searchUrl = `/profile?user=${searchTerm}`;
    globalThis.location.href = searchUrl;
}
searchButton === null || searchButton === void 0 ? void 0 : searchButton.addEventListener('click', () => {
    if (searchContainer && searchContainer.style.display === 'block') {
        hideSearch();
    }
    else {
        showSearch();
    }
});
