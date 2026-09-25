(function () {
  var STORAGE_KEY = "devops-sre-course-progress";
  var SKIP = {
    "/": true,
    "": true,
    "/progress": true,
    "/progress/": true,
  };

  function normalize(pathname) {
    if (!pathname) return "/";
    var p = pathname.replace(/index\.html$/, "").replace(/\/+$/, "");
    return p || "/";
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function pageId() {
    return normalize(window.location.pathname);
  }

  function shouldTrack() {
    var id = pageId();
    if (SKIP[id]) return false;
    return Boolean(document.querySelector("article.md-content__inner"));
  }

  function markNav() {
    var data = loadProgress();
    document.querySelectorAll(".md-nav__link[href]").forEach(function (link) {
      try {
        var href = normalize(new URL(link.href, window.location.origin).pathname);
        if (data[href]) {
          link.classList.add("lesson-done");
        } else {
          link.classList.remove("lesson-done");
        }
      } catch (e) {
        /* внешние ссылки пропускаем */
      }
    });
  }

  function renderBar() {
    var article = document.querySelector("article.md-content__inner");
    if (!article || !shouldTrack()) return;
    var old = article.querySelector(".lesson-progress");
    if (old) old.remove();

    var id = pageId();
    var data = loadProgress();
    var done = Boolean(data[id]);

    var wrap = document.createElement("div");
    wrap.className = "lesson-progress";
    wrap.innerHTML =
      '<button type="button" class="lesson-progress__btn"></button>' +
      '<button type="button" class="lesson-progress__reset">Сбросить весь прогресс</button>' +
      '<p class="lesson-progress__status"></p>';

    var btn = wrap.querySelector(".lesson-progress__btn");
    var status = wrap.querySelector(".lesson-progress__status");
    var reset = wrap.querySelector(".lesson-progress__reset");

    function paint() {
      var now = Boolean(loadProgress()[id]);
      btn.textContent = now ? "Урок отмечен. Снять отметку" : "Отметить урок пройденным";
      btn.classList.toggle("is-done", now);
      status.textContent = now
        ? "Отметка хранится только в этом браузере."
        : "Галочка никуда не отправляется — только ваш браузер.";
    }

    btn.addEventListener("click", function () {
      var current = loadProgress();
      if (current[id]) {
        delete current[id];
      } else {
        current[id] = true;
      }
      saveProgress(current);
      paint();
      markNav();
      renderProgressPage();
    });

    reset.addEventListener("click", function () {
      if (!window.confirm("Снять все галочки уроков в этом браузере?")) return;
      localStorage.removeItem(STORAGE_KEY);
      paint();
      markNav();
      renderProgressPage();
    });

    article.appendChild(wrap);
    paint();
  }

  function renderProgressPage() {
    var box = document.getElementById("course-progress-app");
    if (!box) return;
    var data = loadProgress();
    var links = [];
    document.querySelectorAll(".md-nav--primary .md-nav__link[href]").forEach(function (link) {
      var url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      var href = normalize(url.pathname);
      if (SKIP[href]) return;
      var title = (link.textContent || "").trim();
      if (!title) return;
      if (links.some(function (item) { return item.href === href; })) return;
      links.push({ href: href, title: title });
    });

    var doneCount = links.filter(function (item) { return data[item.href]; }).length;
    var total = links.length || 1;
    var pct = Math.round((doneCount / total) * 100);

    box.innerHTML =
      "<p>Пройдено <strong>" +
      doneCount +
      "</strong> из <strong>" +
      total +
      "</strong> страниц в меню этого браузера (" +
      pct +
      "%).</p>" +
      '<div class="progress-page__bar"><div class="progress-page__fill" style="width:' +
      pct +
      '%"></div></div>' +
      '<p><button type="button" class="lesson-progress__reset" id="progress-reset">Сбросить весь прогресс</button></p>' +
      '<ul class="progress-page__list"></ul>';

    var ul = box.querySelector("ul");
    links.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = (data[item.href] ? "✓ " : "○ ") + item.title;
      ul.appendChild(li);
    });

    var reset = box.querySelector("#progress-reset");
    reset.addEventListener("click", function () {
      if (!window.confirm("Снять все галочки уроков в этом браузере?")) return;
      localStorage.removeItem(STORAGE_KEY);
      markNav();
      renderProgressPage();
    });
  }

  function init() {
    renderBar();
    markNav();
    renderProgressPage();
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
