/* pay.e-irad.org, the Talasbank payment gateway for state services. Nothing typed is sent or stored, and there is
   no card field: "Pay by card" ends at the upgrade notice, "Print slip" makes a slip to pay at a branch. */
(function () {
  "use strict";
  var LANGS = ["ir", "ru", "en"], LANG = "en";
  try { var sv = localStorage.getItem("eirad_lang"); if (LANGS.indexOf(sv) >= 0) LANG = sv; } catch (e) {}
  var q = new URLSearchParams(location.search); if (LANGS.indexOf(q.get("lang")) >= 0) LANG = q.get("lang");
  var PAGE = document.body.getAttribute("data-page");
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function L(o, v) { var s = typeof o === "string" ? o : (o[LANG] != null ? o[LANG] : o.en); return v ? String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }) : s; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function now() { var n = new Date(); return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 6 * 3600000); }
  function today() { var d = now(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
  function addDays(d, n) { return new Date(d.getTime() + n * 864e5); }
  function dmy(d) { return ("0" + d.getUTCDate()).slice(-2) + "." + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "." + d.getUTCFullYear(); }
  function som(x) { var s = Number(x).toFixed(2).split("."); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, LANG === "en" ? "," : " "); return s.join(LANG === "en" ? "." : ",") + " " + L(T.som); }

  var T = {
    gw: { en: "Payment gateway for state services", ir: "Mamlekettik kızmattar üchün tölöm shlyuzu", ru: "Платёжный шлюз для государственных услуг" },
    gw2: { en: "operated for e-Irad by Talasbank", ir: "e-Irad üchün Talasbank tarabınan", ru: "оператор для e-Irad: «Таласбанк»" },
    strip: { en: "<b>Card payments are temporarily unavailable</b> while the payment module is upgraded. You can still prepare a payment slip here and pay it at any Talasbank branch or Irad Pochtasy counter.", ir: "<b>Karta menen tölöö ubaktıluu jok</b>, tölöm modulu jañılanıp jatat. Bul jerde tölöm kvitantsiyasın dayardap, Talasbanktın kaalagan filialında je Irad Pochtasının kassasında tölösöñüz bolot.", ru: "<b>Оплата картой временно недоступна</b> на время модернизации платёжного модуля. Вы можете подготовить здесь квитанцию и оплатить её в любом отделении «Таласбанка» или в окне «Ирад Почтасы»." },
    m_pay: { en: "Make a payment", ir: "Tölöm jasoo", ru: "Произвести платёж" },
    m_check: { en: "Check a payment", ir: "Tölömdü tekshirüü", ru: "Проверить платёж" },
    m_where: { en: "Where to pay", ir: "Kayda tölöö", ru: "Где оплатить" },
    m_status: { en: "Gateway status", ir: "Shlyuzdun abalı", ru: "Состояние шлюза" },
    m_help: { en: "Questions", ir: "Suroolor", ru: "Вопросы" },
    m_eirad: { en: "e-Irad portal", ir: "e-Irad portalı", ru: "Портал e-Irad" },
    m_bank: { en: "Talasbank", ir: "Talasbank", ru: "«Таласбанк»" },
    ssl: { en: "Secure connection<br>SSL 128 bit", ir: "Korgolgon baylanısh<br>SSL 128 bit", ru: "Защищённое соединение<br>SSL 128 бит" },
    foot: { en: "© 1993–2026 Talasbank (Bank of Talas), Talas. Licence of the Bank of Irad No. 4. The gateway accepts payments to state bodies and public utilities listed on e-Irad (e-irad.org). Payments are made in som only. Talasbank never asks for your PIN or the code from an SMS. Best viewed at 1024×768 in Internet Explorer 9 or later.", ir: "© 1993–2026 Talasbank (Talas Banky), Talas. Irad bankinin №4 litsenziyası. Shlyuz e-Iradda (e-irad.org) körsötülgön mamlekettik organdarga jana kommunaldık ishkanalarga tölömdördü kabıl alat. Tölömdör som menen gana jasalat. Talasbank ech kachan PIN-kodduñuzdu je SMStegi koddu surabayt. 1024×768 chechiminde, Internet Explorer 9 je jañıraagında jakshı körünöt.", ru: "© 1993–2026 «Таласбанк» (Банк Таласа), Талас. Лицензия Банка Ирада № 4. Шлюз принимает платежи государственным органам и коммунальным предприятиям, указанным на e-Irad (e-irad.org). Платежи только в сомах. «Таласбанк» никогда не запрашивает PIN-код или код из SMS. Оптимально для 1024×768 в Internet Explorer 9 и выше." },
    som: { en: "som", ir: "som", ru: "сом" }
  };
  function chrome() {
    document.documentElement.lang = { en: "en", ir: "ky-Latn", ru: "ru" }[LANG];
    var names = { ir: "Irad tili", ru: "Русский", en: "English" };
    var menu = [["/", T.m_pay, "pay"], ["/check.html", T.m_check, "check"], ["/where.html", T.m_where, "where"], ["/status.html", T.m_status, "status"], ["/help.html", T.m_help, "help"], ["https://e-irad.org/", T.m_eirad, ""]];
    $("#top").innerHTML = '<div class="page"><div class="top"><a href="/"><img src="/assets/talasbank-logo-white.svg" alt="Talasbank"></a><div class="gw"><b>' + esc(L(T.gw)) + "</b>" + esc(L(T.gw2)) + '</div><div class="langs">' + LANGS.map(function (l) { return '<a href="?lang=' + l + '" data-l="' + l + '"' + (l === LANG ? ' class="on"' : "") + ">" + names[l] + "</a>"; }).join("") + '</div></div><div class="strip">' + L(T.strip) + '</div><div class="cols"><div class="side"><ul>' +
      menu.map(function (m) { return '<li><a href="' + m[0] + '"' + (m[2] === PAGE ? ' class="on"' : "") + ">" + esc(L(m[1])) + "</a></li>"; }).join("") + '</ul><div class="ssl"><svg width="22" height="26" viewBox="0 0 22 26"><rect x="2" y="11" width="18" height="14" rx="2" fill="#c9962b"/><path d="M6 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="#123e7c" stroke-width="2.4"/></svg>' + L(T.ssl) + '</div></div><div class="main" id="app"></div></div><div class="foot">' + esc(L(T.foot)) + "</div></div>";
    $$("[data-l]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); LANG = a.getAttribute("data-l"); try { localStorage.setItem("eirad_lang", LANG); } catch (x) {} render(); }); });
  }

  /* ---------- make a payment ---------- */
  // Payees: id, name, recipient, account, label of the number, test, placeholder
  var DIG = function (a, b) { return function (s) { s = s.replace(/\D/g, ""); return s.length >= a && s.length <= b ? s : null; }; };
  var PAYEES = [
    ["duty", { en: "State duty (e-Irad payment order)", ir: "Mamlekettik alım (e-Irad tölöm tapshırması)", ru: "Госпошлина (платёжное поручение e-Irad)" }, { en: "State Tax Service, Ministry of Economy (state duties)", ir: "Ekonomika ministrligi, Mamlekettik salık kızmatı (mamlekettik alımdar)", ru: "Государственная налоговая служба Министерства экономики (госпошлины)" }, "1280 0001 0000 4401", { en: "Payment order No.", ir: "Tölöm tapshırmasının №", ru: "№ платёжного поручения" }, DIG(6, 6), "417305"],
    ["electricity", { en: "Electricity (Iradenergo)", ir: "Elektr energiyası (Iradenergo)", ru: "Электроэнергия («Ирадэнерго»)" }, { en: "Iradenergo: Talas and Nurzhan Electric Networks", ir: "Iradenergo: Talas jana Nurzhan elektr tarmaktarı", ru: "«Ирадэнерго»: Таласские и Нуржанские электросети" }, "1280 0002 0031 0007", { en: "Personal account", ir: "Jeke esep", ru: "Лицевой счёт" }, DIG(8, 12), "40017733"],
    ["water", { en: "Water and sewerage", ir: "Suu jana kanalizatsiya", ru: "Вода и канализация" }, { en: "City water enterprises", ir: "Shaardık suu ishkanaları", ru: "Городские водоканалы" }, "1280 0002 0040 0011", { en: "Personal account", ir: "Jeke esep", ru: "Лицевой счёт" }, DIG(8, 12), "20314455"],
    ["gas", { en: "Gas", ir: "Gaz", ru: "Газ" }, { en: "City gas services of Talas and Nurzhan", ir: "Talas jana Nurzhan shaardık gaz kızmattarı", ru: "Городские газовые службы Таласа и Нуржана" }, "1280 0002 0052 0003", { en: "Personal account", ir: "Jeke esep", ru: "Лицевой счёт" }, DIG(8, 12), "51120087"],
    ["heating", { en: "Heating", ir: "Jılytuu", ru: "Отопление" }, { en: "Talas Heating Enterprise; Nurzhan Heating Enterprise", ir: "Talas jılytuu ishkanası; Nurzhan jılytuu ishkanası", ru: "Таласское теплопредприятие; Нуржанское теплопредприятие" }, "1280 0002 0060 0019", { en: "Personal account", ir: "Jeke esep", ru: "Лицевой счёт" }, DIG(8, 12), "70002211"],
    ["proptax", { en: "Property tax", ir: "Mülk salıgı", ru: "Налог на имущество" }, { en: "State Tax Service, Ministry of Economy (local taxes)", ir: "Ekonomika ministrligi, Mamlekettik salık kızmatı (jergiliktüü salıktar)", ru: "Государственная налоговая служба Министерства экономики (местные налоги)" }, "1280 0001 0000 4410", { en: "Tax notice No.", ir: "Salık bildirüüsünün №", ru: "№ налогового уведомления" }, DIG(10, 10), "2600417735"],
    ["roadcharge", { en: "Road-use charge", ir: "Joldu koldonuu akısı", ru: "Плата за пользование дорогами" }, { en: "Department of Infrastructure and Communications", ir: "Infrastruktura jana baylanısh departamenti", ru: "Департамент инфраструктуры и связи" }, "1280 0001 0000 5203", { en: "Registration plate", ir: "Mamlekettik nomer", ru: "Госномер" }, function (s) { s = s.toUpperCase().replace(/[\s\-]/g, ""); return /^[A-Z0-9]{5,9}$/.test(s) && /\d/.test(s) ? s : null; }, "01 TL 417 AB"],
    ["fines", { en: "Traffic fine", ir: "Jol kıymıl ayıbı", ru: "Штраф за нарушение ПДД" }, { en: "Highway Patrol Corps, Republican Gendarmerie; city police", ir: "Avtojol patrul korpusu, Respublikalık jandarmeriya; shaar politsiyası", ru: "Корпус дорожного патруля Республиканской жандармерии; городская полиция" }, "1280 0001 0000 7700", { en: "Decision No.", ir: "Toktomdun №", ru: "№ постановления" }, function (s) { s = s.toUpperCase().replace(/[\s\-]/g, ""); return /^[A-Z]{0,3}\d{6,10}$/.test(s) ? s : null; }, "GP 26 0417335"],
    ["kindergarten", { en: "Kindergarten fees", ir: "Bala bakcha akısı", ru: "Оплата детского сада" }, { en: "Education departments of the city halls", ir: "Meriyalardın bilim berüü bölümdörü", ru: "Отделы образования мэрий" }, "1280 0003 0012 0004", { en: "Child's account", ir: "Balanın eseb", ru: "Счёт ребёнка" }, DIG(8, 8), "31004417"]
  ];
  var M = {
    h: { en: "Make a payment", ir: "Tölöm jasoo", ru: "Произвести платёж" },
    s1: { en: "Step 1 of 3: details", ir: "1-kadam (3tön): maalımattar", ru: "Шаг 1 из 3: реквизиты" },
    s2: { en: "Step 2 of 3: check the payment", ir: "2-kadam (3tön): tölömdü tekshirüü", ru: "Шаг 2 из 3: проверка платежа" },
    s3: { en: "Step 3 of 3: payment", ir: "3-kadam (3tön): tölöö", ru: "Шаг 3 из 3: оплата" },
    payee: { en: "Payment for", ir: "Emne üchün", ru: "Назначение" },
    amt: { en: "Amount, som", ir: "Summası, som", ru: "Сумма, сом" },
    payer: { en: "Payer's surname and initials", ir: "Tölööchünün familiyası jana initsialdarı", ru: "Фамилия и инициалы плательщика" },
    next: { en: "Continue", ir: "Ulantuu", ru: "Далее" },
    back: { en: "Back", ir: "Artka", ru: "Назад" },
    badNo: { en: "Check the number: it is printed on your bill, notice or e-Irad page.", ir: "Nomerdi tekshiriñiz: al esepte, bildirüüdö je e-Irad betinde basılgan.", ru: "Проверьте номер: он указан в квитанции, уведомлении или на странице e-Irad." },
    badAmt: { en: "Enter the amount in som, from 1 to 500,000.", ir: "Summanı som menen jazıñız, 1den 500 000ge cheyin.", ru: "Введите сумму в сомах, от 1 до 500 000." },
    badPayer: { en: "Enter the payer's surname and initials.", ir: "Tölööchünün familiyasın jana initsialdarın jazıñız.", ru: "Укажите фамилию и инициалы плательщика." },
    rcpt: { en: "Recipient", ir: "Aluuchu", ru: "Получатель" },
    acc: { en: "Account", ir: "Esep", ru: "Счёт" },
    bank: { en: "Bank", ir: "Bank", ru: "Банк" },
    bankV: { en: "Talasbank, head office, Talas · BIC 128001", ir: "Talasbank, bashkı keñse, Talas · BIK 128001", ru: "«Таласбанк», головной офис, Талас · БИК 128001" },
    comm: { en: "Commission", ir: "Komissiya", ru: "Комиссия" },
    total: { en: "Total", ir: "Bardıgı", ru: "Итого" },
    card: { en: "Pay by Talasbank card", ir: "Talasbank kartası menen tölöö", ru: "Оплатить картой «Таласбанка»" },
    slip: { en: "Print payment slip", ir: "Tölöm kvitantsiyasın basuu", ru: "Распечатать квитанцию" },
    upH: { en: "The card payment module is being upgraded", ir: "Karta menen tölöö modulu jañılanıp jatat", ru: "Модуль оплаты картой модернизируется" },
    upP: { en: "Stage 3 of 4: certification of the 3-D Secure module. Card payments will resume in November 2026. Your card has not been charged. You can print a payment slip and pay it at a branch.", ir: "4tön 3-kadam: 3-D Secure modulun sertifikattoo. Karta menen tölöö 2026-jıldın noyabrında kayra achılat. Kartañızdan akcha alınbadı. Tölöm kvitantsiyasın basıp, filialda tölösöñüz bolot.", ru: "Этап 3 из 4: сертификация модуля 3-D Secure. Оплата картой возобновится в ноябре 2026 года. Средства с вашей карты не списаны. Вы можете распечатать квитанцию и оплатить её в отделении." },
    slipH: { en: "PAYMENT SLIP", ir: "TÖLÖM KVITANTSIYASI", ru: "КВИТАНЦИЯ НА ОПЛАТУ" },
    valid: { en: "Valid until", ir: "Möönötü", ru: "Действительна до" },
    slipP: { en: "Pay at any Talasbank branch or Irad Pochtasy counter. The cashier scans the code; keep the bank's receipt. Payments at Talasbank branches are free of commission.", ir: "Talasbanktın kaalagan filialında je Irad Pochtasının kassasında tölöñüz. Kassir koddu skanerleyt; banktın chegin saktañız. Talasbanktın filialdarında tölöö komissiyasız.", ru: "Оплатите в любом отделении «Таласбанка» или в окне «Ирад Почтасы». Кассир сканирует код; сохраните чек банка. Оплата в отделениях «Таласбанка» без комиссии." },
    print: { en: "Print", ir: "Basuu", ru: "Печать" },
    stop: { en: "Payments are accepted in som only, from Talasbank cards or in cash at a branch. Under Bank of Irad notice 2026/5 on unlicensed payment services, payments through Tulpar Pay and other unlicensed services are not accepted. Cards of other banks and foreign cards are not accepted.", ir: "Tölömdör som menen gana, Talasbanktın kartasınan je filialda nak akcha menen kabıl alınat. Irad bankinin litsenziyasız tölöm kızmattarı tuuraluu 2026/5 bildirüüsünö ılayık Tulpar Pay jana bashka litsenziyasız kızmattar arkıluu tölömdör kabıl alınbayt. Bashka banktardın kartaları jana chet eldik kartalar kabıl alınbayt.", ru: "Платежи принимаются только в сомах, с карт «Таласбанка» или наличными в отделении. Согласно уведомлению Банка Ирада 2026/5 о нелицензированных платёжных сервисах платежи через Tulpar Pay и другие нелицензированные сервисы не принимаются. Карты других банков и зарубежные карты не принимаются." }
  };
  function barcode(code) {
    var x = 0, bars = "", h = hash(code);
    for (var i = 0; i < 64; i++) { var w = 1 + ((h >>> (i % 29)) ^ code.charCodeAt(i % code.length)) % 3; if (i % 2 === 0) bars += '<rect x="' + x + '" y="0" width="' + w + '" height="44"/>'; x += w; }
    return '<svg width="' + x + '" height="56" viewBox="0 0 ' + x + ' 56" style="max-width:100%"><g fill="#000">' + bars + '</g><text x="' + x / 2 + '" y="55" font-family="Courier New,monospace" font-size="10" text-anchor="middle">' + esc(code) + "</text></svg>";
  }
  function pagePay() {
    document.title = L(M.h) + " | pay.e-irad.org";
    var pre = q.get("p"), st = { p: PAYEES[0] };
    function step1() {
      $("#app").innerHTML = "<h1>" + esc(L(M.h)) + '</h1><div class="panel"><div class="ph">' + esc(L(M.s1)) + '</div><div class="pb"><form id="f"><table class="f"><tr><td><label for="py">' + esc(L(M.payee)) + '</label></td><td><select id="py">' + PAYEES.map(function (p) { return '<option value="' + p[0] + '">' + esc(L(p[1])) + "</option>"; }).join("") + '</select></td></tr><tr><td><label for="no" id="nol"></label></td><td><input type="text" id="no" maxlength="16" autocomplete="off"></td></tr><tr><td><label for="am">' + esc(L(M.amt)) + '</label></td><td><input type="text" id="am" maxlength="10" inputmode="decimal" autocomplete="off" style="width:110px"></td></tr><tr><td><label for="pr">' + esc(L(M.payer)) + '</label></td><td><input type="text" id="pr" maxlength="40" autocomplete="off"></td></tr><tr><td></td><td><button class="btn" type="submit">' + esc(L(M.next)) + ' »</button> <span class="err" id="er"></span></td></tr></table></form></div></div><p class="small">' + esc(L(M.stop)) + "</p>";
      function lbl() { var p = PAYEES.filter(function (x) { return x[0] === $("#py").value; })[0]; $("#nol").textContent = L(p[4]); $("#no").placeholder = p[6]; }
      if (pre && PAYEES.some(function (x) { return x[0] === pre; })) $("#py").value = pre;
      if (st.vals) { $("#py").value = st.p[0]; $("#no").value = st.vals.raw; $("#am").value = st.vals.amr; $("#pr").value = st.vals.payer; }
      $("#py").addEventListener("change", lbl); lbl();
      $("#f").addEventListener("submit", function (e) {
        e.preventDefault();
        var p = PAYEES.filter(function (x) { return x[0] === $("#py").value; })[0], raw = $("#no").value, n = p[5](raw), amr = $("#am").value, a = parseFloat(amr.replace(/\s/g, "").replace(",", ".")), payer = $("#pr").value.trim();
        if (!n) { $("#er").textContent = L(M.badNo); $("#no").focus(); return; }
        if (!(a >= 1 && a <= 500000)) { $("#er").textContent = L(M.badAmt); $("#am").focus(); return; }
        if (payer.length < 3) { $("#er").textContent = L(M.badPayer); $("#pr").focus(); return; }
        st = { p: p, n: n, a: Math.round(a * 100) / 100, payer: payer.toUpperCase(), vals: { raw: raw, amr: amr, payer: payer } };
        step2();
      });
    }
    function step2() {
      var p = st.p;
      $("#app").innerHTML = "<h1>" + esc(L(M.h)) + '</h1><div class="panel"><div class="ph">' + esc(L(M.s2)) + '</div><div class="pb"><table class="d"><tr><th>' + esc(L(M.payee)) + "</th><td>" + esc(L(p[1])) + "</td></tr><tr><th>" + esc(L(p[4])) + "</th><td>" + esc(st.n) + "</td></tr><tr><th>" + esc(L(M.rcpt)) + "</th><td>" + esc(L(p[2])) + "</td></tr><tr><th>" + esc(L(M.acc)) + "</th><td>" + p[3] + "</td></tr><tr><th>" + esc(L(M.bank)) + "</th><td>" + esc(L(M.bankV)) + "</td></tr><tr><th>" + esc(L(M.payer)) + "</th><td>" + esc(st.payer) + '</td></tr><tr><th>' + esc(L(M.amt)) + '</th><td class="n">' + som(st.a) + '</td></tr><tr><th>' + esc(L(M.comm)) + '</th><td class="n">' + som(0) + '</td></tr><tr><th>' + esc(L(M.total)) + '</th><td class="n"><b>' + som(st.a) + '</b></td></tr></table><p class="noprint"><button class="btn grey" id="bk">« ' + esc(L(M.back)) + '</button> <button class="btn" id="cd">' + esc(L(M.card)) + '</button> <button class="btn gold" id="sl">' + esc(L(M.slip)) + '</button></p><div id="r"></div></div></div>';
      $("#bk").addEventListener("click", step1);
      $("#cd").addEventListener("click", function () { $("#r").innerHTML = '<div class="box red"><b>' + esc(L(M.upH)) + '</b><div class="bar"><i style="width:75%"></i></div>' + esc(L(M.upP)) + "</div>"; });
      $("#sl").addEventListener("click", function () {
        var code = "TB" + String(hash(st.p[0] + st.n + st.a + dmy(today())) % 1e10).padStart(10, "0");
        $("#r").innerHTML = '<div class="slip"><div class="hd"><span>TALASBANK · ' + esc(L(M.slipH)) + "</span><span>" + dmy(today()) + "</span></div>" + esc(L(M.rcpt)) + ": " + esc(L(st.p[2])) + "<br>" + esc(L(M.acc)) + ": " + st.p[3] + " · BIC 128001<br>" + esc(L(st.p[4])) + ": " + esc(st.n) + "<br>" + esc(L(M.payer)) + ": " + esc(st.payer) + "<br>" + esc(L(M.total)) + ": <b>" + som(st.a) + "</b><br>" + esc(L(M.valid)) + ": " + dmy(addDays(today(), 10)) + '<div style="margin-top:8px">' + barcode(code) + '</div></div><p class="small">' + esc(L(M.slipP)) + '</p><p class="noprint"><button class="btn grey" id="pt">' + esc(L(M.print)) + "</button></p>";
        $("#pt").addEventListener("click", function () { window.print(); });
      });
    }
    step1();
  }

  /* ---------- check a payment ---------- */
  var C = {
    h: { en: "Check a payment", ir: "Tölömdü tekshirüü", ru: "Проверить платёж" },
    p: { en: "Enter the operation number from the receipt given at the Talasbank branch, or the code under the barcode of your payment slip.", ir: "Talasbanktın filialında berilgen chektegi operatsiya nomerin je tölöm kvitantsiyañızdagı shtrikh-koddun astındagı koddu jazıñız.", ru: "Введите номер операции с чека, выданного в отделении «Таласбанка», или код под штрихкодом вашей квитанции." },
    no: { en: "Operation number or slip code", ir: "Operatsiya nomeri je kvitantsiya kodu", ru: "Номер операции или код квитанции" },
    btn: { en: "Check", ir: "Tekshirüü", ru: "Проверить" },
    bad: { en: "Operation numbers look like 014-2604117 (branch, then seven digits); slip codes look like TB0123456789.", ir: "Operatsiya nomeri 014-2604117 sıyaktuu bolot (filial, andan kiyin jeti sıfra); kvitantsiya kodu TB0123456789 sıyaktuu.", ru: "Номер операции выглядит как 014-2604117 (отделение и семь цифр); код квитанции — как TB0123456789." },
    unpaid: { en: "This slip has not been paid. Slips are valid for ten days from the date printed on them.", ir: "Bul kvitantsiya tölöngön emes. Kvitantsiyalar anda basılgan kündön baslap on kün jaraktuu.", ru: "Квитанция не оплачена. Квитанция действительна десять дней с указанной в ней даты." },
    done: { en: "Paid on {a} and credited to the recipient's account on {b}.", ir: "{a} tölöngön jana {b} aluuchunun esebine tüshkön.", ru: "Оплачено {a}, зачислено на счёт получателя {b}." },
    proc: { en: "Paid on {a}. In processing: payments made after 15:00 or on Saturday are credited on the next working day.", ir: "{a} tölöngön. Ishtelip jatat: 15:00dön kiyin je ishembi künü jasalgan tölömdör kiyinki ish künü tüshöt.", ru: "Оплачено {a}. В обработке: платежи, внесённые после 15:00 или в субботу, зачисляются на следующий рабочий день." },
    ret: { en: "Paid on {a}. Returned by the recipient on {b}: the account number does not exist. The money is returned to the payer in cash at the branch where the payment was made, with the receipt and ID card.", ir: "{a} tölöngön. {b} aluuchu tarabınan kaytarıldı: mından esep nomeri jok. Akcha tölöm jasalgan filialda chek jana jeke kuböölük menen tölööchügö nak kaytarılat.", ru: "Оплачено {a}. Возвращено получателем {b}: такого лицевого счёта не существует. Деньги возвращаются плательщику наличными в отделении, где был внесён платёж, по чеку и удостоверению личности." },
    nf: { en: "No operation with this number was found.", ir: "Bul nomerdegi operatsiya tabılgan jok.", ru: "Операция с таким номером не найдена." }
  };
  function pageCheck() {
    document.title = L(C.h) + " | pay.e-irad.org";
    $("#app").innerHTML = "<h1>" + esc(L(C.h)) + "</h1><p>" + esc(L(C.p)) + '</p><div class="panel"><div class="pb"><form id="f"><table class="f"><tr><td><label for="n">' + esc(L(C.no)) + '</label></td><td><input type="text" id="n" maxlength="16" autocomplete="off" placeholder="014-2604117"> <button class="btn" type="submit">' + esc(L(C.btn)) + '</button></td></tr></table></form><div id="r"></div></div></div>';
    $("#f").addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = $("#n").value.toUpperCase().replace(/\s/g, ""), h = hash("chk" + raw), r = h % 100;
      if (/^TB\d{10}$/.test(raw)) { $("#r").innerHTML = '<div class="box warn">' + esc(L(C.unpaid)) + "</div>"; return; }
      var m = /^(\d{3})-?(\d{7})$/.exec(raw);
      if (!m) { $("#r").innerHTML = '<div class="box warn">' + esc(L(C.bad)) + "</div>"; return; }
      if (+m[1] < 1 || +m[1] > 28 || r < 8) { $("#r").innerHTML = '<div class="box red">' + esc(L(C.nf)) + "</div>"; return; }
      var a = addDays(today(), -((h >>> 7) % 30)), b = addDays(a, 1 + (h >>> 3) % 2);
      if (r < 16) $("#r").innerHTML = '<div class="box red">' + esc(L(C.ret, { a: dmy(a), b: dmy(addDays(a, 4)) })) + "</div>";
      else if (b > today()) $("#r").innerHTML = '<div class="box warn">' + esc(L(C.proc, { a: dmy(a) })) + "</div>";
      else $("#r").innerHTML = '<div class="box ok">' + esc(L(C.done, { a: dmy(a), b: dmy(b) })) + "</div>";
    });
  }

  /* ---------- where to pay ---------- */
  var W = {
    h: { en: "Where to pay", ir: "Kayda tölöö", ru: "Где оплатить" },
    rows: [
      [{ en: "Talasbank branches", ir: "Talasbanktın filialdarı", ru: "Отделения «Таласбанка»" }, { en: "28 branches: 20 in Talas, 6 in Nurzhan, 2 in Iyık Janyl. Monday to Friday 9:00–17:00, Saturday 9:00–13:00. No commission on payments to state bodies and utilities. Addresses on Attelkom Maps.", ir: "28 filial: Talasta 20, Nurzhanda 6, Iyık Janılda 2. Düyshömbüdön jumaga cheyin 9:00–17:00, ishembi 9:00–13:00. Mamlekettik organdarga jana kommunaldık ishkanalarga tölömdörgö komissiya jok. Darekter Attelkom kartalarında.", ru: "28 отделений: 20 в Таласе, 6 в Нуржане, 2 в Ийык-Джаныле. Понедельник–пятница 9:00–17:00, суббота 9:00–13:00. Без комиссии за платежи государственным органам и коммунальным предприятиям. Адреса на картах «Аттелкома»." }, "https://maps.attelkom.net/"],
      [{ en: "Irad Pochtasy counters", ir: "Irad Pochtasının kassaları", ru: "Окна «Ирад Почтасы»" }, { en: "All post offices accept payment slips with a barcode. The post office charges its own fee.", ir: "Bardık pochta bölümdörü shtrikh-kodu bar tölöm kvitantsiyaların kabıl alat. Pochta öz akısın alat.", ru: "Все почтовые отделения принимают квитанции со штрихкодом. Почта взимает собственную комиссию." }, "https://post.iradgov.org/"],
      [{ en: "Cash desks of the providers", ir: "Kızmat körsötkündördün kassaları", ru: "Кассы поставщиков услуг" }, { en: "Iradenergo, the water enterprises and the heating enterprises accept their own bills in cash at their offices.", ir: "Iradenergo, suu ishkanaları jana jılytuu ishkanaları öz esepterin keñselerinde nak akcha menen kabıl alat.", ru: "«Ирадэнерго», водоканалы и теплопредприятия принимают оплату своих счетов наличными в своих офисах." }, ""]
    ],
    tenth: { en: "On the 10th of each month pensions are paid, and the queues at the branches are long, especially at the Azatlık branch in Nurzhan. Pay on another day if you can.", ir: "Ar aydın 10-künü pensiyalar tölönöt, filialdardagı kezekter uzun, ayrıkcha Nurzhandagı Azattık filialında. Mümkün bolso bashka künü tölöñüz.", ru: "10-го числа каждого месяца выплачиваются пенсии, и очереди в отделениях длинные, особенно в отделении «Азатлык» в Нуржане. По возможности платите в другой день." }
  };
  function pageWhere() {
    document.title = L(W.h) + " | pay.e-irad.org";
    $("#app").innerHTML = "<h1>" + esc(L(W.h)) + '</h1><table class="d">' + W.rows.map(function (r) { return "<tr><th>" + esc(L(r[0])) + "</th><td>" + esc(L(r[1])) + (r[2] ? ' <a href="' + r[2] + '">' + esc(r[2].replace(/^https:\/\/|\/$/g, "")) + "</a>" : "") + "</td></tr>"; }).join("") + '</table><div class="box warn">' + esc(L(W.tenth)) + "</div>";
  }

  /* ---------- gateway status ---------- */
  var G = {
    h: { en: "Gateway status", ir: "Shlyuzdun abalı", ru: "Состояние шлюза" },
    sys: [
      [{ en: "Payment slips (print and pay at a branch)", ir: "Tölöm kvitantsiyaları (basıp, filialda tölöö)", ru: "Квитанции (печать и оплата в отделении)" }, 1],
      [{ en: "Payment check", ir: "Tölömdü tekshirüü", ru: "Проверка платежа" }, 1],
      [{ en: "Card payments (Talasbank cards)", ir: "Karta menen tölöö (Talasbank kartaları)", ru: "Оплата картой («Таласбанк»)" }, 0],
      [{ en: "Link with e-Irad (pay from a bill page)", ir: "e-Irad menen baylanısh (esep betinen tölöö)", ru: "Связь с e-Irad (оплата со страницы счёта)" }, 0]
    ],
    up: { en: "Working", ir: "Ishtep jatat", ru: "Работает" },
    down: { en: "Upgrade", ir: "Jañıloo", ru: "Модернизация" },
    logH: { en: "Notices", ir: "Bildirüülör", ru: "Объявления" },
    log: [
      ["2026-10-19", { en: "The upgrade of the card payment module will continue into November. Certification of the 3-D Secure module is in progress. Payment slips work as usual.", ir: "Karta menen tölöö modulun jañıloo noyabrga cheyin ulanat. 3-D Secure modulun sertifikattoo jürüp jatat. Tölöm kvitantsiyaları adattagıday ishteyt.", ru: "Модернизация модуля оплаты картой продлится до ноября. Идёт сертификация модуля 3-D Secure. Квитанции работают в обычном режиме." }],
      ["2026-10-01", { en: "e-Irad opens in pilot. Payment buttons on e-Irad bill pages will be connected to this gateway when the card module is ready.", ir: "e-Irad sınoo rejiminde achıldı. e-Iraddın esep betterindegi tölöö baskıchtarı karta modulu dayar bolgondo bul shlyuzga tutashtırılat.", ru: "e-Irad открыт в пилотном режиме. Кнопки оплаты на страницах счетов e-Irad будут подключены к шлюзу после готовности модуля оплаты картой." }],
      ["2026-09-30", { en: "Card payments will resume in October after certification.", ir: "Karta menen tölöö sertifikattoodon kiyin oktyabrda kayra achılat.", ru: "Оплата картой возобновится в октябре после сертификации." }],
      ["2026-08-31", { en: "The works are extended to 30 September for integration with the e-Irad portal.", ir: "Ishter e-Irad portalı menen integratsiyaloo üchün 30-sentyabrga cheyin uzartıldı.", ru: "Работы продлены до 30 сентября для интеграции с порталом e-Irad." }],
      ["2026-08-12", { en: "Planned upgrade of the card payment module from 15 to 31 August 2026. Payments at branches are not affected.", ir: "2026-jıldın 15–31-avgustunda karta menen tölöö modulun pländuu jañıloo. Filialdardagı tölömdörgö tiyishpeyt.", ru: "Плановая модернизация модуля оплаты картой с 15 по 31 августа 2026 года. Платежи в отделениях не затрагиваются." }]
    ]
  };
  function pageStatus() {
    document.title = L(G.h) + " | pay.e-irad.org";
    $("#app").innerHTML = "<h1>" + esc(L(G.h)) + '</h1><table class="d">' + G.sys.map(function (s) { return "<tr><td>" + esc(L(s[0])) + '</td><td class="n"><b style="color:' + (s[1] ? "#1d7a1d" : "#b0201a") + '">' + esc(L(s[1] ? G.up : G.down)) + "</b></td></tr>"; }).join("") + "</table><h2>" + esc(L(G.logH)) + '</h2><table class="d">' + G.log.map(function (x) { return '<tr><td class="n">' + dmy(new Date(x[0] + "T00:00:00Z")) + "</td><td>" + esc(L(x[1])) + "</td></tr>"; }).join("") + "</table>";
  }

  /* ---------- questions ---------- */
  var F = [
    [{ en: "Is there a commission?", ir: "Komissiya barbı?", ru: "Есть ли комиссия?" }, { en: "No. Payments to state bodies and public utilities through the gateway and at Talasbank branches are free of commission. Irad Pochtasy charges its own fee.", ir: "Jok. Shlyuz arkıluu jana Talasbanktın filialdarında mamlekettik organdarga jana kommunaldık ishkanalarga tölömdör komissiyasız. Irad Pochtası öz akısın alat.", ru: "Нет. Платежи государственным органам и коммунальным предприятиям через шлюз и в отделениях «Таласбанка» без комиссии. «Ирад Почтасы» взимает собственную комиссию." }],
    [{ en: "Why only Talasbank cards?", ir: "Emne üchün Talasbanktın kartaları gana?", ru: "Почему только карты «Таласбанка»?" }, { en: "Talasbank keeps the accounts of the state bodies listed on e-Irad. Payments by cards of other banks would pass through the interbank clearing of the Bank of Irad and are not yet provided for.", ir: "Talasbank e-Iradda körsötülgön mamlekettik organdardın esepterin jürgüzöt. Bashka banktardın kartaları menen tölömdör Irad bankinin banktar aralık kliringi arkıluu ötmök, alar azırıncha karalgan emes.", ru: "«Таласбанк» ведёт счета государственных органов, указанных на e-Irad. Платежи картами других банков проходили бы через межбанковский клиринг Банка Ирада и пока не предусмотрены." }],
    [{ en: "Can I pay with Tulpar Pay?", ir: "Tulpar Pay menen tölösö bolobu?", ru: "Можно ли оплатить через Tulpar Pay?" }, { en: "No. Tulpar Pay is not accepted for state services.", ir: "Jok. Tulpar Pay mamlekettik kızmattar üchün kabıl alınbayt.", ru: "Нет. Tulpar Pay для государственных услуг не принимается." }],
    [{ en: "Can I pay in dollars?", ir: "Dollar menen tölösö bolobu?", ru: "Можно ли заплатить в долларах?" }, { en: "Payments to state bodies are accepted in som only. Dollars can be exchanged at the official rate of the Bank of Irad at any Talasbank branch.", ir: "Mamlekettik organdarga tölömdör som menen gana kabıl alınat. Dollarlardı Talasbanktın kaalagan filialında Irad bankinin rasmiy kursu boyuncha almashtırsa bolot.", ru: "Платежи государственным органам принимаются только в сомах. Доллары можно обменять по официальному курсу Банка Ирада в любом отделении «Таласбанка»." }, "https://bank.iradgov.org/"],
    [{ en: "I paid the wrong account.", ir: "Tuura emes esepke tölöp koydum.", ru: "Я оплатил не тот счёт." }, { en: "Write an application at the branch where you paid, with the receipt and your ID card. The money is returned after the recipient confirms, usually within 30 days.", ir: "Tölögön filialıñızda chek jana jeke kuböölük menen arız jazıñız. Akcha aluuchu tastıktagandan kiyin, adatta 30 kündün ichinde kaytarılat.", ru: "Напишите заявление в отделении, где вы платили, приложив чек и удостоверение личности. Деньги возвращаются после подтверждения получателем, обычно в течение 30 дней." }]
  ];
  function pageHelp() {
    document.title = L(T.m_help) + " | pay.e-irad.org";
    $("#app").innerHTML = "<h1>" + esc(L(T.m_help)) + "</h1>" + F.map(function (f) { return "<h2>" + esc(L(f[0])) + "</h2><p>" + esc(L(f[1])) + (f[2] ? ' <a href="' + f[2] + '">' + f[2].replace(/^https:\/\/|\/$/g, "") + "</a>" : "") + "</p>"; }).join("");
  }

  function render() { chrome(); ({ pay: pagePay, check: pageCheck, where: pageWhere, status: pageStatus, help: pageHelp }[PAGE] || pagePay)(); }
  render();
})();
