(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var TONES = { arrive: 1, option: 1, quiet: 1, depart: 1 };
  var KINDS = { option: 1, suggestion: 1, baby: 1, visiting: 1 };
  var root = document.getElementById("app");

  function pageBase() {
    var url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    var path = url.pathname;
    if (path.endsWith("/")) return url;
    var last = path.slice(path.lastIndexOf("/") + 1);
    url.pathname = last.indexOf(".") !== -1
      ? path.slice(0, path.lastIndexOf("/") + 1)
      : path + "/";
    return url;
  }

  function appendKids(node, kids) {
    kids.forEach(function (kid) {
      if (Array.isArray(kid)) appendKids(node, kid);
      else if (kid == null || kid === false) return;
      else if (typeof kid === "string" || typeof kid === "number") node.append(String(kid));
      else node.append(kid);
    });
  }

  function h(tag, props) {
    var node = document.createElement(tag);
    var opts = props || {};
    if (opts.className) node.className = opts.className;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (key) {
        var value = opts.attrs[key];
        if (value != null && value !== false) node.setAttribute(key, String(value));
      });
    }
    if (opts.text != null) node.append(document.createTextNode(String(opts.text)));
    appendKids(node, Array.prototype.slice.call(arguments, 2));
    return node;
  }

  function safeUrl(value) {
    if (typeof value !== "string") return null;
    try {
      var url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "tel:") return url.href;
    } catch (error) {
      return null;
    }
    return null;
  }

  function makeLink(href, label, className) {
    var safe = safeUrl(href);
    if (!safe) return h("span", { className: className, text: label });
    var external = safe.indexOf("https:") === 0;
    var attrs = { href: safe };
    if (external) {
      attrs.target = "_blank";
      attrs.rel = "noopener noreferrer";
    }
    var link = h("a", { className: className, attrs: attrs }, label);
    if (external) link.append(h("span", { className: "vh", text: " (opens in a new tab)" }));
    return link;
  }

  function badge(text, kind) {
    var safeKind = KINDS[kind] ? kind : "option";
    return h("span", { className: "badge kind-" + safeKind, text: text });
  }

  function sectionHead(block) {
    var nodes = [];
    if (block.eyebrow) nodes.push(h("p", { className: "eyebrow", text: block.eyebrow }));
    if (block.title) nodes.push(h("h2", { text: block.title }));
    if (block.intro) nodes.push(h("p", { className: "intro", text: block.intro }));
    return nodes;
  }

  function madridISODate(date) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    var get = function (type) {
      var match = parts.find(function (part) { return part.type === type; });
      return match ? match.value : "";
    };
    return get("year") + "-" + get("month") + "-" + get("day");
  }

  function dateParts(iso) {
    var date = new Date(iso + "T12:00:00+01:00");
    if (Number.isNaN(date.getTime())) return null;
    var full = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      weekday: "long",
      month: "long",
      day: "numeric"
    }).formatToParts(date);
    var short = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      weekday: "short",
      month: "short"
    }).formatToParts(date);
    var grab = function (list, type) {
      var match = list.find(function (part) { return part.type === type; });
      return match ? match.value.replace(".", "") : "";
    };
    var weekday = grab(full, "weekday");
    var month = grab(full, "month");
    var day = grab(full, "day");
    return {
      weekday: weekday,
      weekdayShort: grab(short, "weekday"),
      monthShort: grab(short, "month"),
      day: day,
      label: weekday + ", " + month + " " + day
    };
  }

  function renderHero(hero) {
    return h("header", { className: "hero", attrs: { id: "top" } },
      h("div", { className: "wrap hero-copy" },
        h("div", { className: "mast" },
          h("p", { text: hero.kicker || "" }),
          h("p", { text: hero.year || "" })
        ),
        h("h1", { className: "hero-place", text: hero.place || "Madrid" }),
        h("p", { className: "hero-dates", text: hero.dates || "" }),
        h("p", { className: "hero-lede", text: hero.lede || "" }),
        h("div", { className: "countdown" })
      ),
      h("div", { className: "frieze", attrs: { "aria-hidden": "true" } })
    );
  }

  function renderNav(items) {
    var scroll = h("div", { className: "nav-scroll" });
    items.forEach(function (item) {
      scroll.append(h("a", { attrs: { href: "#" + item.id }, text: item.label }));
    });
    return h("nav", { className: "nav-bar", attrs: { "aria-label": "On this page" } },
      h("div", { className: "wrap" }, scroll)
    );
  }

  function renderTravelers(block) {
    var groups = (block.groups || []).slice();
    var known = {};
    groups.forEach(function (group) { known[group.id] = true; });
    (block.people || []).forEach(function (person) {
      if (person.group && !known[person.group]) {
        groups.push({ id: person.group, label: person.group });
        known[person.group] = true;
      }
    });

    var section = h("section", { className: "section", attrs: { id: block.id } }, sectionHead(block));
    groups.forEach(function (group) {
      var members = (block.people || []).filter(function (person) {
        return person.group === group.id;
      });
      if (!members.length) return;
      var list = h("div", { className: members.length === 1 ? "people single" : "people" });
      members.forEach(function (person) {
        var card = h("article", { className: person.detail || person.link ? "person wide" : "person" });
        if (person.badge) card.append(badge(person.badge, person.kind));
        card.append(h("p", { className: "person-name", text: person.name }));
        if (person.detail) card.append(h("p", { className: "person-detail", text: person.detail }));
        if (person.link) card.append(makeLink(person.link.href, person.link.label, "inline"));
        list.append(card);
      });
      section.append(h("div", { className: "origin" },
        h("p", { className: "origin-label", text: group.label }),
        list
      ));
    });
    return section;
  }

  function clock(point) {
    return [point.time, point.zone].filter(Boolean).join(" ");
  }

  function arrow() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 48 16");
    svg.setAttribute("class", "arrow");
    svg.setAttribute("aria-hidden", "true");
    ["M2 8 H38", "M32 2.5 L43 8 L32 13.5"].forEach(function (d) {
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.6");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.append(path);
    });
    return svg;
  }

  function endpoint(point, align) {
    var node = h("div", { className: align === "end" ? "endpoint end" : "endpoint", attrs: { "aria-hidden": "true" } },
      h("p", { className: "code", text: point.code || "" }),
      h("p", { className: "city", text: point.city || "" }),
      h("p", { className: "time", text: clock(point) }),
      h("p", { className: "fdate", text: point.date || "" })
    );
    if (align === "end") node.querySelector(".fdate").classList.add("maybe-next");
    return node;
  }

  function renderSegment(segment) {
    var from = segment.from || {};
    var to = segment.to || {};
    var spoken = [
      segment.flight,
      segment.operatedBy,
      from.code, from.city, clock(from), from.date,
      "to",
      to.code, to.city, clock(to), to.date
    ].filter(Boolean).join(" ");
    var route = h("div", { className: "route", attrs: { role: "group", "aria-label": spoken } },
      endpoint(from, "start"),
      arrow(),
      endpoint(to, "end")
    );
    if (from.date && to.date && from.date !== to.date) {
      var arrival = route.querySelector(".endpoint.end .fdate");
      if (arrival) arrival.classList.add("next-day");
    }
    var node = h("div", { className: "segment" },
      h("p", { className: "flight-no", text: segment.flight || "" })
    );
    if (segment.operatedBy) node.append(h("p", { className: "operated", text: segment.operatedBy }));
    node.append(route);
    return node;
  }

  function renderFlights(block) {
    var section = h("section", { className: "section", attrs: { id: block.id } }, sectionHead(block));
    var list = h("div", { className: "flights" });
    (block.groups || []).forEach(function (group) {
      var card = h("article", { className: "flight-card" },
        h("header", { className: "group-head" },
          h("p", { className: "group-kicker", text: group.label || "" }),
          h("p", { className: "group-who", text: group.who || "" })
        )
      );
      (group.legs || []).forEach(function (leg) {
        var legNode = h("div", { className: "leg" },
          h("p", { className: "leg-label", text: leg.label || "" })
        );
        (leg.segments || []).forEach(function (segment, index) {
          if (index > 0) legNode.append(h("p", { className: "then", text: "Then" }));
          legNode.append(renderSegment(segment));
        });
        card.append(legNode);
      });
      list.append(card);
    });
    section.append(list);
    return section;
  }

  function renderStay(block) {
    var card = h("article", { className: block.placeholder ? "stay is-placeholder" : "stay" });
    if (block.status) card.append(h("p", { className: "stay-status", text: block.status }));
    if (block.area) card.append(h("p", { className: "stay-area", text: block.area }));
    if (block.neighborhoods && block.neighborhoods.length) {
      card.append(h("ul", { className: "pills" }, block.neighborhoods.map(function (name) {
        return h("li", { text: name });
      })));
    }
    if (block.body) card.append(h("p", { className: "stay-body", text: block.body }));
    return h("section", { className: "section", attrs: { id: block.id } }, sectionHead(block), card);
  }

  function renderDayItem(item) {
    var li = h("li");
    if (item.badge) li.append(badge(item.badge, item.kind));
    if (item.time) li.append(h("p", { className: "item-time", text: item.time }));
    if (item.text) li.append(h("p", { className: "item-text", text: item.text }));
    return li;
  }

  function renderDays(block) {
    var today = madridISODate(new Date());
    var items = (block.items || []).slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    });
    var list = h("div", { className: "days" });
    items.forEach(function (day) {
      var parts = dateParts(day.date);
      var tone = TONES[day.tone] ? day.tone : "quiet";
      var classes = "day " + tone + (day.date === today ? " is-today" : "");
      var title = h("h3");
      if (parts) title.append(h("span", { className: "vh", text: parts.label + ". " }));
      title.append(document.createTextNode(day.title || "Plans coming soon"));
      var heading = h("div", { className: "day-heading" },
        day.date === today ? badge("Today", "option") : null,
        title
      );
      var body = h("div", null, heading);
      if (day.items && day.items.length) {
        body.append(h("ul", { className: "day-items" }, day.items.map(renderDayItem)));
      }
      var rail = h("div", { className: "day-rail", attrs: { "aria-hidden": "true" } },
        h("span", { className: "day-dow", text: parts ? parts.weekdayShort : "" }),
        h("span", { className: "day-num", text: parts ? parts.day : "" }),
        h("span", { className: "day-mon", text: parts ? parts.monthShort : "" })
      );
      list.append(h("article", { className: classes }, rail, body));
    });
    return h("section", { className: "section", attrs: { id: block.id } }, sectionHead(block), list);
  }

  function renderGuide(guide) {
    var section = h("section", { className: "section guide", attrs: { id: guide.id } }, sectionHead({
      eyebrow: guide.eyebrow,
      title: guide.title,
      intro: guide.placeholder ? "" : guide.body
    }));
    if (guide.placeholder && guide.body) {
      section.append(h("p", { className: "placeholder", text: guide.body }));
    }
    if (guide.items && guide.items.length) {
      section.append(h("ul", { className: "guide-items" }, guide.items.map(function (item) {
        return h("li", null,
          item.title ? h("p", { className: "item-title", text: item.title }) : null,
          item.text ? h("p", { className: "item-text", text: item.text }) : null
        );
      })));
    }
    if (guide.links && guide.links.length) {
      section.append(h("div", { className: "link-row" }, guide.links.map(function (link) {
        return makeLink(link.href, link.label, "text-link");
      })));
    }
    return section;
  }

  function renderUseful(block) {
    var list = h("dl", { className: "facts" });
    (block.facts || []).forEach(function (fact) {
      var valueClass = (fact.value || "").length > 28 ? "value long" : "value";
      var value = fact.href
        ? h("dd", { className: valueClass }, makeLink(fact.href, fact.value, "fact-link"))
        : h("dd", { className: valueClass, text: fact.value || "" });
      list.append(h("div", { className: "fact" },
        h("dt", { text: fact.label || "" }),
        value,
        fact.note ? h("dd", { className: "note", text: fact.note }) : null
      ));
    });
    return h("section", { className: "section", attrs: { id: block.id } }, sectionHead(block), list);
  }

  function renderMap(block) {
    var section = h("section", { className: "section", attrs: { id: block.id } }, sectionHead(block));
    var embed = safeUrl(block.embed);
    if (embed && embed.indexOf("https:") === 0) {
      section.append(h("div", { className: "map-frame" },
        h("iframe", {
          attrs: {
            src: embed,
            title: block.embedTitle || block.title || "Map",
            loading: "lazy",
            referrerpolicy: "strict-origin-when-cross-origin"
          }
        })
      ));
    }
    if (block.link) {
      section.append(makeLink(block.link.href, block.link.label, "button"));
    }
    return section;
  }

  function renderFooter(footer) {
    return h("footer", { className: "footer" },
      h("div", { className: "wrap" },
        h("p", { className: "footer-line", text: footer.line || "" }),
        footer.note ? h("p", { className: "footer-note", text: footer.note }) : null,
        h("a", { className: "to-top", attrs: { href: "#top" }, text: "Back to top" })
      )
    );
  }

  function track(items, block) {
    if (block && block.id && block.nav) items.push({ id: block.id, label: block.nav });
  }

  function splitDuration(ms) {
    var total = Math.floor(ms / 1000);
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60
    };
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function startCountdown(container, hero) {
    if (!container) return;
    var start = Date.parse(hero.countdownTo || "");
    var end = Date.parse(hero.tripEnds || "");
    var grid = h("div", { className: "cd-grid", attrs: { "aria-hidden": "true" } });
    var nums = {};
    [["days", "Days"], ["hours", "Hours"], ["minutes", "Minutes"], ["seconds", "Seconds"]].forEach(function (pair) {
      var num = h("span", { className: "cd-num", text: "–" });
      nums[pair[0]] = num;
      grid.append(h("div", { className: "cd-cell" }, num, h("span", { className: "cd-label", text: pair[1] })));
    });
    var caption = h("p", { className: "cd-caption", attrs: { "aria-hidden": "true" } });
    var arrived = h("div", { className: "arrived", attrs: { hidden: "hidden" } },
      h("strong", { className: "arrived-title" }),
      h("p", { className: "arrived-caption" })
    );
    var live = h("p", { className: "vh", attrs: { "aria-live": "polite" } });
    container.append(grid, caption, arrived, live);
    var titleEl = arrived.querySelector(".arrived-title");
    var capEl = arrived.querySelector(".arrived-caption");
    var lastSpoken = "";

    function showMessage(title, cap) {
      grid.hidden = true;
      caption.hidden = true;
      arrived.hidden = false;
      titleEl.textContent = title || "";
      capEl.textContent = cap || "";
      var spoken = [title, cap].filter(Boolean).join(". ");
      if (spoken !== lastSpoken) {
        lastSpoken = spoken;
        live.textContent = spoken;
      }
    }

    function tick() {
      var now = Date.now();
      if (Number.isNaN(start)) {
        showMessage(hero.place || "Madrid", hero.dates || "");
        return;
      }
      if (!Number.isNaN(end) && now >= end) {
        showMessage(hero.afterLabel, hero.afterCaption);
        return;
      }
      if (now >= start) {
        showMessage(hero.duringLabel, hero.duringCaption);
        return;
      }
      grid.hidden = false;
      caption.hidden = false;
      arrived.hidden = true;
      var parts = splitDuration(start - now);
      nums.days.textContent = String(parts.days);
      nums.hours.textContent = pad(parts.hours);
      nums.minutes.textContent = pad(parts.minutes);
      nums.seconds.textContent = pad(parts.seconds);
      caption.textContent = [hero.countdownCaption, hero.timezoneLabel].filter(Boolean).join(" · ");
      var key = parts.days + ":" + parts.hours + ":" + parts.minutes;
      if (key !== lastSpoken) {
        lastSpoken = key;
        live.textContent = parts.days + " days, " + parts.hours + " hours, " + parts.minutes + " minutes. " + caption.textContent;
      }
    }

    tick();
    window.setInterval(tick, 1000);
  }

  function watchNav(nav) {
    if (!nav || !("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
    var byId = {};
    links.forEach(function (link) {
      byId[link.getAttribute("href").slice(1)] = link;
    });
    var sections = Object.keys(byId).map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) {
        return entry.isIntersecting;
      }).sort(function (a, b) {
        return b.intersectionRatio - a.intersectionRatio;
      })[0];
      if (!visible) return;
      links.forEach(function (link) { link.removeAttribute("aria-current"); });
      var current = byId[visible.target.id];
      if (current) current.setAttribute("aria-current", "true");
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4, 0.75] });
    sections.forEach(function (section) { observer.observe(section); });
  }

  function render(data) {
    if (data.meta && data.meta.title) document.title = data.meta.title;
    var description = document.querySelector('meta[name="description"]');
    if (description && data.meta && data.meta.description) {
      description.setAttribute("content", data.meta.description);
    }

    var navItems = [];
    track(navItems, data.travelers);
    track(navItems, data.flights);
    track(navItems, data.stay);
    track(navItems, data.days);
    (data.guides || []).forEach(function (guide) { track(navItems, guide); });
    track(navItems, data.useful);
    track(navItems, data.map);

    var main = h("main", { className: "wrap", attrs: { id: "content" } });
    if (data.travelers) main.append(renderTravelers(data.travelers));
    if (data.flights) main.append(renderFlights(data.flights));
    if (data.stay) main.append(renderStay(data.stay));
    if (data.days) main.append(renderDays(data.days));
    (data.guides || []).forEach(function (guide) { main.append(renderGuide(guide)); });
    if (data.useful) main.append(renderUseful(data.useful));
    if (data.map) main.append(renderMap(data.map));

    var page = h("div", { className: "page" },
      renderHero(data.hero || {}),
      renderNav(navItems),
      main,
      renderFooter(data.footer || {})
    );
    root.replaceChildren(page);
    root.removeAttribute("aria-busy");
    startCountdown(page.querySelector(".countdown"), data.hero || {});
    watchNav(page.querySelector(".nav-scroll"));
  }

  function renderError() {
    root.removeAttribute("aria-busy");
    root.replaceChildren(h("div", { className: "error" },
      h("div", null,
        h("h1", { text: "Madrid" }),
        h("p", { text: "The trip details did not load. Refresh the page in a moment." })
      )
    ));
  }

  function init() {
    var url = new URL("data/trip.json", pageBase());
    fetch(url, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(render)
      .catch(function (error) {
        console.error(error);
        renderError();
      });
  }

  init();
}());
