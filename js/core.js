/*
=====================================
Gezinsplanner
Bestand : core.js
Versie  : v1.37.0b
Laatst gewijzigd : 06-08-2026

Functie :
- Opslaan van gegevens
- LocalStorage
- Algemene functies

Wijzigingen:
- Code opgesplitst
- Backup-opslag toegevoegd
=====================================
*/

const persistState = () => {
  try {
    syncLowStockShopping();
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
    localStorage.setItem("gezinsplanner_data_backup", data);
    localStorage.setItem("gezinsplanner_last_saved", new Date().toISOString());
    return true;
  } catch (error) {
    console.error("Opslaan mislukt:", error);
    alert(
      "Opslaan is mislukt. Open de app via een vaste GitHub Pages-link voor betrouwbare opslag.",
    );
    return false;
  }
};
const save = () => {
  persistState();
  renderAll();
};
window.addEventListener("pagehide", persistState);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") persistState();
});

document
  .querySelectorAll("[data-go]")
  .forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
function go(id) {
  if (!document.getElementById(id)) id = "start";
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document
    .querySelectorAll(".nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.go === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" })[m],
  );
const letterClass = (l) =>
  ({ A: "a", B: "b", C: "c", D: "d", E: "e" })[l] || "a";
const prioClass = (p) =>
  p === "Op" ? "op" : p === "Binnenkort" ? "soon" : "wish";
const shoppingAmountText = (item) => {
  const amount =
    item.amount !== "" && item.amount !== null && item.amount !== undefined
      ? item.amount
      : "";

  const unit = item.unit || item.weightUnit || "";

  const quantity = Number(item.quantity) || 0;

  const weight =
    item.weight !== "" && item.weight !== null && item.weight !== undefined
      ? item.weight
      : "";

  if (amount !== "") {
    if (unit === "stuks" && Number(amount) === 1) return "1 stuk";
    return `${amount} ${unit}`.trim();
  }

  if (weight !== "") {
    if (quantity > 1) {
      return `${quantity} × ${weight} ${unit}`.trim();
    }

    return `${weight} ${unit}`.trim();
  }

  if (quantity > 0) {
    return quantity === 1 ? "1 stuk" : `${quantity} stuks`;
  }

  return "";
};

function syncLowStockShopping() {
  state.stock.forEach((item) => {
    if (item.stockType !== "exact") return;

    const currentFilled =
      item.currentAmount !== "" &&
      item.currentAmount !== null &&
      item.currentAmount !== undefined;
    const minimumFilled =
      item.minimum !== "" &&
      item.minimum !== null &&
      item.minimum !== undefined;
    if (!currentFilled || !minimumFilled) return;

    const isLow = Number(item.currentAmount) < Number(item.minimum);
    const linkedItems = state.shopping.filter(
      (x) => x.sourceStockId === item.id,
    );

    if (isLow) {
      // Eén voorraadproduct mag maximaal één keer op de boodschappenlijst staan.
      // Een afgevinkte regel telt ook als bestaande regel en mag dus geen duplicaat veroorzaken.
      if (!linkedItems.length) {
        const buyCount = Number(item.buyCount) || 1;
        const packageText = item.packageType || "verpakking";
        state.shopping.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: `${item.name} — ${buyCount} ${packageText}${buyCount === 1 ? "" : "(en)"}`,
          store: item.store || "Picnic",
          priority: "Binnenkort",
          person: "Fredy",
          done: false,
          sourceStockId: item.id,
        });
      } else if (linkedItems.length > 1) {
        const keeper = linkedItems.find((x) => !x.done) || linkedItems[0];
        state.shopping = state.shopping.filter(
          (x) => x.sourceStockId !== item.id || x.id === keeper.id,
        );
      }
    } else if (linkedItems.length) {
      state.shopping = state.shopping.filter(
        (x) => x.sourceStockId !== item.id,
      );
    }
  });
}

function renderAll() {
  updateRestoreStatus();
  document.getElementById("countShopping").textContent =
    state.shopping.filter((x) => !x.done).length + " open";
  document.getElementById("countMeals").textContent =
    state.meals.length + " maaltijden";
  document.getElementById("countStock").textContent =
    state.stock.length + " producten";
  renderWeekOverview();
  setupRecipeForm();
  setupCategoryManager();
  renderShopping();
  renderMeals();
  renderRecipes();
  renderFreezer();
  renderHutsel();
  setupStockFilters();
  renderStock();
  renderCategories();
  renderDash();
  renderPlanning();
  renderCooking();
}

const WEEKDAY_ORDER = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];

function sortMealsByWeekday(meals) {
  return [...meals].sort((a, b) => {
    const dayA = WEEKDAY_ORDER.indexOf(a.day);
    const dayB = WEEKDAY_ORDER.indexOf(b.day);
    const safeA = dayA === -1 ? 99 : dayA;
    const safeB = dayB === -1 ? 99 : dayB;
    return safeA - safeB;
  });
}

function renderWeekOverview() {
  const meals = sortMealsByWeekday(state.meals.filter((x) => !x.done));
  const shopping = state.shopping.filter((x) => !x.done);
  const simpleLow = state.stock.filter(
    (x) => x.stockType === "simple" && x.simpleStatus === "Aanvullen",
  );
  const exactLow = state.stock.filter((x) => {
    if (x.stockType !== "exact") return false;
    const current = Number(x.currentAmount);
    const minimum = Number(x.minimum);
    return (
      Number.isFinite(current) && Number.isFinite(minimum) && current < minimum
    );
  });
  const stockLow = [...simpleLow, ...exactLow];
  const hutsel = state.hutsel || [];

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("countWeek", `${meals.length} maaltijden · ${shopping.length} open`);
  setText("weekMealCount", `${meals.length} gepland`);
  setText("weekShoppingCount", `${shopping.length} open`);
  setText("weekStockCount", `${stockLow.length} producten`);
  setText("weekHutselCount", `${hutsel.length} producten`);

  const mealEl = document.getElementById("weekOverviewMeals");
  if (mealEl) {
    mealEl.innerHTML = meals.length
      ? meals
          .slice(0, 7)
          .map(
            (x) =>
              `<div class="row"><div class="letter ${letterClass(x.letter)}">${esc(x.letter)}</div><div class="grow"><b>${esc(x.day)}</b><div class="muted">${esc(x.name)}</div></div></div>`,
          )
          .join("")
      : '<div class="empty">Nog geen maaltijden gepland.</div>';
  }

  const shoppingEl = document.getElementById("weekOverviewShopping");
  if (shoppingEl) {
    shoppingEl.innerHTML = shopping.length
      ? shopping
          .slice(0, 6)
          .map(
            (x) =>
              `<div class="row"><div class="grow"><b>${esc(x.name)}</b>${shoppingAmountText(x) ? `<div class="muted">${esc(shoppingAmountText(x))}</div>` : ""}<div class="itemmeta"><span class="pill">${esc(x.store)}</span></div></div><span class="tag ${prioClass(x.priority)}">${esc(x.priority)}</span></div>`,
          )
          .join("")
      : '<div class="empty">Geen open boodschappen.</div>';
  }

  const stockEl = document.getElementById("weekOverviewStock");
  if (stockEl) {
    stockEl.innerHTML = stockLow.length
      ? stockLow
          .slice(0, 8)
          .map(
            (x) =>
              `<div class="row"><div class="grow"><b>${esc(x.name)}</b><div class="muted">${x.stockType === "simple" ? "Aanvullen" : `${esc(x.currentAmount)} van minimaal ${esc(x.minimum)} ${esc(x.unit || "")}`}</div></div></div>`,
          )
          .join("")
      : '<div class="empty">Alles staat op voldoende.</div>';
  }

  const hutselEl = document.getElementById("weekOverviewHutsel");
  if (hutselEl) {
    hutselEl.innerHTML = hutsel.length
      ? hutsel
          .slice()
          .sort((a, b) => a.days - b.days)
          .slice(0, 8)
          .map(
            (x) =>
              `<div class="row"><div class="grow"><b>${esc(x.name)}</b><div class="muted">Binnen ${esc(x.days)} dag(en) gebruiken</div></div></div>`,
          )
          .join("")
      : '<div class="empty">De Hutsel Frutsel-bak is leeg.</div>';
  }
}

function renderDash() {
  const open = state.shopping.filter((x) => !x.done).slice(0, 6);
  dashShopping.innerHTML = open.length
    ? open
        .map(
          (x) =>
            `<div class="row"><input class="check" type="checkbox" onchange="toggleShopping(${x.id})"><div class="grow"><b>${esc(x.name)}</b>${shoppingAmountText(x) ? `<div class="muted">${esc(shoppingAmountText(x))}</div>` : ""}<div class="itemmeta"><span class="pill">${esc(x.store)}</span><span class="pill">${esc(x.person)}</span>${x.sourceStockId ? '<span class="pill">Voorraad gekoppeld</span>' : ""}${x.createStockAfterPurchase ? '<span class="pill">Nieuw naar voorraad</span>' : ""}${x.sourceRecipeName ? `<span class="pill">🍽️ ${esc(x.sourceRecipeName)}</span>` : ""}${x.dish ? `<span class="pill">🍽️ ${esc(x.dish)}</span>` : ""}</div></div><span class="tag ${prioClass(x.priority)}">${esc(x.priority)}</span></div>`,
        )
        .join("")
    : `<div class="empty">Geen open boodschappen.</div>`;
  dashMeals.innerHTML = sortMealsByWeekday(state.meals)
    .slice(0, 5)
    .map(
      (x) =>
        `<div class="row"><div class="letter ${letterClass(x.letter)}">${esc(x.letter)}</div><div class="grow"><b>${esc(x.name)}</b><div class="muted">${esc(x.day)}</div></div></div>`,
    )
    .join("");
  dashFreezer.innerHTML =
    state.freezer
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
      .map(
        (x) =>
          `<div class="row"><div class="grow"><b>${esc(x.name)}</b><div class="muted">${x.portions} portie(s) · ${esc(x.date)}</div></div></div>`,
      )
      .join("") || `<div class="empty">Vriezerlijst is leeg.</div>`;
  dashHutsel.innerHTML =
    state.hutsel
      .slice(0, 4)
      .map(
        (x) =>
          `<div class="row"><div class="grow"><b>${esc(x.name)}</b><div class="muted">Binnen ${x.days} dag(en) gebruiken</div></div></div>`,
      )
      .join("") || `<div class="empty">De bak is leeg.</div>`;
  hutselHint.style.display = state.hutsel.length >= 5 ? "block" : "none";
}
