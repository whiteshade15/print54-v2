/* Print54 V2 : JS du site. Créé le 23/11/2026. Aucun traçage, aucun cookie. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var T = window.P54 || {}; // textes de la page (langue), injectés par le HTML

  /* Menu mobile */
  var btn = d.querySelector(".menu-btn"), nav = d.getElementById("nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
  }

  /* Révélation douce au défilement */
  var rev = d.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (el) { io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add("in"); });

  /* Hors ligne */
  var ob = d.getElementById("offline"), of = d.getElementById("offline-form");
  function net() { if (of) { of.hidden = navigator.onLine; if (ob) ob.hidden = true; } else if (ob) ob.hidden = navigator.onLine; }
  window.addEventListener("online", net); window.addEventListener("offline", net); net();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register(T.sw || "/sw.js").catch(function () {}); });
  }

  /* Galerie : filtres + agrandissement */
  var gal = d.getElementById("gallery");
  if (gal) {
    var items = [].slice.call(gal.querySelectorAll("li")), empty = d.getElementById("gallery-empty");
    var filters = [].slice.call(d.querySelectorAll(".filter"));
    function apply(cat) {
      var n = 0;
      items.forEach(function (li) {
        var show = cat === "all" || (" " + li.dataset.cat + " ").indexOf(" " + cat + " ") > -1;
        li.hidden = !show; if (show) n++;
      });
      filters.forEach(function (f) { f.setAttribute("aria-pressed", f.dataset.filter === cat); });
      if (empty) empty.hidden = n > 0;
      gal.hidden = n === 0;
      var st = d.getElementById("gallery-status"); if (st) st.textContent = (T.shown || "{n}").replace("{n}", n);
    }
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        apply(f.dataset.filter);
        history.replaceState(null, "", f.dataset.filter === "all" ? location.pathname : "#" + f.dataset.filter);
      });
    });
    var reset = d.getElementById("gallery-reset");
    if (reset) reset.addEventListener("click", function () { apply("all"); history.replaceState(null, "", location.pathname); });
    var h = location.hash.slice(1);
    apply(["ens", "veh", "vit"].indexOf(h) > -1 ? h : "all");

    var dlg = d.getElementById("lightbox");
    if (dlg && dlg.showModal) {
      var img = dlg.querySelector("img"), cap = dlg.querySelector("figcaption"), cnt = dlg.querySelector(".lb-count"), cur = 0, last;
      function visible() { return items.filter(function (li) { return !li.hidden; }); }
      function show(i) {
        var v = visible(); cur = (i + v.length) % v.length;
        var b = v[cur].querySelector("button"), s = b.querySelector("img");
        img.src = s.currentSrc || s.src; img.alt = s.alt; img.width = s.width; img.height = s.height;
        cap.textContent = b.dataset.caption;
        cnt.textContent = (cur + 1) + " / " + v.length;
      }
      items.forEach(function (li) {
        li.querySelector("button").addEventListener("click", function (e) {
          last = e.currentTarget; show(visible().indexOf(li)); dlg.showModal();
        });
      });
      dlg.querySelector(".lb-prev").addEventListener("click", function () { show(cur - 1); });
      dlg.querySelector(".lb-next").addEventListener("click", function () { show(cur + 1); });
      dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") show(cur - 1);
        if (e.key === "ArrowRight") show(cur + 1);
      });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", function () { if (last) last.focus(); });
    } else if (dlg) {
      items.forEach(function (li) { li.querySelector("button").addEventListener("click", function () { window.open(li.querySelector("img").src); }); });
    }
  }

  /* Devis : prépare un e-mail (mailto). Formspree : voir commentaire dans devis.html */
  var form = d.getElementById("quote");
  if (form) {
    var svc = form.elements.service, q = new URLSearchParams(location.search).get("service");
    if (q && svc.querySelector('option[value="' + q + '"]')) svc.value = q;
    var sum = d.getElementById("quote-errors"), ok = d.getElementById("quote-ok"), copyBtn = d.getElementById("quote-copy");
    var lastBody = "";
    function val(n) { return (form.elements[n] && form.elements[n].value || "").trim(); }
    function setErr(name, msg) {
      var f = form.elements[name], e = d.getElementById("err-" + name);
      f.setAttribute("aria-invalid", msg ? "true" : "false");
      if (e) e.textContent = msg || "";
      return msg ? { name: name, msg: msg } : null;
    }
    function check() {
      var errs = [];
      [["name", !val("name") && T.e_name],
       ["email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email")) && T.e_email],
       ["phone", val("phone") && !/^[+0-9 ().\/-]{8,}$/.test(val("phone")) && T.e_phone],
       ["service", !val("service") && T.e_service],
       ["message", val("message").length < 10 && T.e_message]].forEach(function (c) {
        var r = setErr(c[0], c[1] || ""); if (r) errs.push(r);
      });
      return errs;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errs = check();
      if (errs.length) {
        ok.hidden = true;
        sum.hidden = false;
        sum.querySelector("p").textContent = T.e_sum.replace("{n}", errs.length);
        var ul = sum.querySelector("ul"); ul.textContent = "";
        errs.forEach(function (x) {
          var li = d.createElement("li"), a = d.createElement("a");
          a.href = "#f-" + x.name; a.textContent = x.msg;
          a.addEventListener("click", function (ev) { ev.preventDefault(); form.elements[x.name].focus(); });
          li.appendChild(a); ul.appendChild(li);
        });
        sum.focus();
        return;
      }
      sum.hidden = true;
      var lab = T.f, sname = svc.options[svc.selectedIndex].text;
      lastBody = [
        lab.name + " : " + val("name"), lab.company + " : " + val("company"), lab.email + " : " + val("email"),
        lab.phone + " : " + val("phone"), lab.service + " : " + sname, lab.size + " : " + val("size"),
        lab.place + " : " + val("place"), lab.when + " : " + val("when"), "", lab.message + " :", val("message"), "", T.attach
      ].join("\n");
      var subject = T.subject + " · " + sname + " · " + val("name");
      location.href = "mailto:info@print54.be?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lastBody);
      ok.hidden = false;
      var wa = d.getElementById("quote-wa");
      if (wa) wa.href = "https://wa.me/32477091897?text=" + encodeURIComponent(lastBody);
      ok.focus();
    });
    form.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid") === "true") setErr(e.target.name, ""); });
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var st = d.getElementById("copy-status");
      function done() { st.textContent = T.copied; }
      if (navigator.clipboard) navigator.clipboard.writeText(lastBody).then(done, function () { st.textContent = T.copyfail; });
      else st.textContent = T.copyfail;
    });
  }
})();
