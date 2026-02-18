(() => {
  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");

  if (!input || !preview) {
    return;
  }

  const debounce = (fn, delay = 200) => {
    let timerId;
    return (...args) => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => fn(...args), delay);
    };
  };

  const mdFactory = window.markdownit;

  if (typeof mdFactory !== "function") {
    preview.textContent =
      "Unable to load markdown-it from CDN. Check your internet connection and reload.";
    return;
  }

  const md = mdFactory({
    html: true,
    linkify: true,
    typographer: true,
  });

  const render = () => {
    preview.innerHTML = md.render(input.value);
  };

  const renderDebounced = debounce(render, 200);

  input.addEventListener("input", renderDebounced, { passive: true });
  render();
})();
