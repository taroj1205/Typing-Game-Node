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