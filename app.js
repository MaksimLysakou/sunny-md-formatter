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
    breaks: true,
  });

  const defaultHeadingOpen =
    md.renderer.rules.heading_open ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  const defaultHeadingClose =
    md.renderer.rules.heading_close ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  const wordTitleInlineStyle = [
    "mso-style-name:Title",
    "font-family:Arial,sans-serif",
    "font-size:26pt",
    "line-height:1.3",
    "color:#000",
    "text-align:center",
  ].join(";");

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const state = env ?? {};

    if (token.tag === "h1" && !state.wordTitleRendered) {
      state.wordTitleRendered = true;
      state.wordTitleOpen = true;
      return `<p class="MsoTitle doc-title" style="${wordTitleInlineStyle}">`;
    }

    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const state = env ?? {};

    if (token.tag === "h1" && state.wordTitleOpen) {
      state.wordTitleOpen = false;
      return "</p>";
    }

    return defaultHeadingClose(tokens, idx, options, env, self);
  };

  const render = () => {
    preview.innerHTML = md.render(input.value, {});
  };

  const renderDebounced = debounce(render, 200);

  input.addEventListener("input", renderDebounced, { passive: true });
  render();
})();
