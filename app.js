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

  const TurndownCtor = window.TurndownService;
  const turndown =
    typeof TurndownCtor === "function"
      ? new TurndownCtor({
          headingStyle: "atx",
          bulletListMarker: "-",
          codeBlockStyle: "fenced",
          emDelimiter: "_",
          strongDelimiter: "**",
          linkStyle: "inlined",
        })
      : null;

  if (turndown && window.turndownPluginGfm) {
    turndown.use(window.turndownPluginGfm.gfm);
  }

  const looksLikeHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(value);

  const stripWordArtifacts = (html) => {
    // Remove Word's conditional comments and <o:p> tags that pollute pasted HTML.
    return html
      .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
      .replace(/<\/?o:p[^>]*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");
  };

  const htmlToMarkdown = (html) => {
    if (!turndown) return null;
    try {
      return turndown.turndown(stripWordArtifacts(html)).trim();
    } catch (_err) {
      return null;
    }
  };

  const insertAtCursor = (textarea, text) => {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    textarea.value = before + text + after;
    const caret = start + text.length;
    textarea.selectionStart = textarea.selectionEnd = caret;
  };

  input.addEventListener("paste", (event) => {
    if (!turndown) return;
    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const html = clipboard.getData("text/html");
    const plain = clipboard.getData("text/plain");

    // If plain text already looks like markdown/plain (no HTML), let the browser handle it.
    if (!html || !looksLikeHtml(html)) return;

    // If the plain-text fallback is already markdown-formatted (e.g. pasted from another md editor),
    // skip conversion to avoid double-processing.
    if (plain && /^[#>\-*`]|\n[#>\-*`]/.test(plain) && !looksLikeHtml(plain)) {
      return;
    }

    const markdown = htmlToMarkdown(html);
    if (markdown === null || markdown === "") return;

    event.preventDefault();
    insertAtCursor(input, markdown);
    renderDebounced();
  });

  render();
})();
