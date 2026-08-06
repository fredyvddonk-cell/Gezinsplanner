/*
=====================================
Gezinsplanner
Bestand : core.js
Versie  : vV1.37.0C
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

function renderMeals() {
  renderWeekSlots("mealList", false);
}

function renderFreezer() {
  freezerList.innerHTML = state.freezer.length
    ? state.freezer
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(
          (x) =>
            `<div class="row"><div class="grow"><b>${esc(x.name)}</b><div class="muted">${x.portions} portie(s) · ingevroren ${esc(x.date)}</div></div><button class="btn secondary" onclick="useFreezer(${x.id})">Opgegeten</button><button class="btn danger" onclick="removeItem('freezer',${x.id})">×</button></div>`,
        )
        .join("")
    : `<div class="empty">Nog niets geregistreerd.</div>`;
}
function useFreezer(id) {
  state.freezer = state.freezer.filter((x) => x.id !== id);
  save();
}
function renderHutsel() {
  hutselList.innerHTML = state.hutsel.length
    ? state.hutsel
        .sort((a, b) => a.days - b.days)
        .map(
          (x) =>
            `<div class="row"><div class="grow"><b>${esc(x.name)}</b><div class="muted">${x.amount ? esc(x.amount) + " · " : ""}Binnen ${x.days} dag(en) gebruiken</div></div><button class="btn secondary" onclick="removeItem('hutsel',${x.id})">Gebruikt</button></div>`,
        )
        .join("")
    : `<div class="empty">De Hutsel Frutsel-bak is leeg.</div>`;
}
function renderStock() {
  syncAllStockToHutsel(false);
  const search = (document.getElementById("stockSearch")?.value || "")
    .trim()
    .toLowerCase();
  const category = document.getElementById("stockCategoryFilter")?.value || "";
  const filtered = state.stock
    .filter(
      (x) =>
        (!search || x.name.toLowerCase().includes(search)) &&
        (!category || x.category === category),
    )
    .sort(
      (a, b) =>
        (a.category || "Overig").localeCompare(b.category || "Overig", "nl") ||
        a.name.localeCompare(b.name, "nl"),
    );

  if (!filtered.length) {
    stockList.innerHTML = '<div class="empty">Geen producten gevonden.</div>';
    return;
  }

  let lastCategory = "";
  stockList.innerHTML = filtered
    .map((x) => {
      const categoryHeader =
        x.category !== lastCategory
          ? `<h4 class="stock-category">${esc(x.category || "Overig")}</h4>`
          : "";
      lastCategory = x.category;

      if (x.stockType === "simple") {
        return `${categoryHeader}<div class="stock-card">
       <div class="stock-top">
         <div>
           <div class="stock-title">${esc(x.name)}</div>
           <div class="stock-sub">${esc(x.packageType || "Verpakking nog invullen")}${x.buyCount ? ` · koop meestal ${esc(x.buyCount)} verpakking(en)` : ""}</div>
         </div>
         <span class="stock-type">Alleen aanvullen</span>
       </div>
       <div class="stock-actions">
         <button class="btn secondary ${x.simpleStatus === "Voldoende" ? "status-good" : ""}" onclick="setSimpleStatus(${x.id},'Voldoende')">Voldoende</button>
         <button class="btn secondary ${x.simpleStatus === "Aanvullen" ? "status-add" : ""}" onclick="setSimpleStatus(${x.id},'Aanvullen')">Aanvullen</button>
         <button class="btn secondary" onclick="editStock(${x.id})">Wijzig</button>
         <button class="btn danger" onclick="removeStock(${x.id})">Verwijder</button>
       </div>
     </div>`;
      }

      const content = Number(x.packageContent) || 0;
      const current =
        x.currentAmount === "" || x.currentAmount === null
          ? null
          : Number(x.currentAmount);
      const pct =
        content > 0 && current !== null
          ? Math.max(0, Math.min(100, Math.round((current / content) * 100)))
          : 0;
      const low =
        x.toHutsel &&
        Number(x.minimum) > 0 &&
        current !== null &&
        current <= Number(x.minimum);
      const packageText = x.packageType
        ? content > 0
          ? `${x.packageType} van ${content} ${x.unit || ""}`
          : x.packageType
        : "Nog niet ingevuld";

      return `${categoryHeader}<div class="stock-card">
     <div class="stock-top">
       <div>
         <div class="stock-title">${esc(x.name)}</div>
         <div class="stock-sub">${esc(packageText)}${x.buyCount ? ` · koop meestal ${esc(x.buyCount)} verpakking(en)` : ""}</div>
       </div>
       <span class="stock-type">Exact bijhouden</span>
     </div>
     <div class="stock-info"><span class="pill">${current === null ? "Aantal nog invullen" : `${current} ${esc(x.unit || "")} aanwezig`}</span></div>
     ${content > 0 && current !== null ? `<div class="stock-progress ${low ? "stock-low" : ""}"><span style="width:${pct}%"></span></div><div class="stock-sub">${pct}% van één verpakking</div>` : ""}
     ${x.toHutsel ? `<div class="stock-sub">Naar Hutsel Frutsel bij ≤ ${esc(x.minimum || 0)} ${esc(x.unit || "")}</div>` : ""}
     <div class="stock-actions">
       <button class="btn secondary" onclick="editStock(${x.id})">Aanvullen / wijzigen</button>
       <button class="btn danger" onclick="removeStock(${x.id})">Verwijder</button>
     </div>
   </div>`;
    })
    .join("");
}

function setAllSimpleStock(status) {
  const label = status === "Voldoende" ? "voldoende" : "aanvullen";
  const simpleItems = state.stock.filter((x) => x.stockType === "simple");

  if (!simpleItems.length) {
    alert("Er zijn geen producten met 'Alleen aanvullen'.");
    return;
  }

  if (
    !confirm(
      `Weet je zeker dat je alle producten met 'Alleen aanvullen' op '${label}' wilt zetten?`,
    )
  )
    return;

  simpleItems.forEach((item) => {
    item.simpleStatus = status;

    if (status === "Aanvullen") {
      state.suppressedStockShopping = state.suppressedStockShopping.filter(
        (stockId) => stockId !== item.id,
      );
    } else {
      state.suppressedStockShopping = state.suppressedStockShopping.filter(
        (stockId) => stockId !== item.id,
      );
    }
    const linkedItems = state.shopping.filter(
      (x) => x.sourceStockId === item.id,
    );

    if (status === "Aanvullen" && !linkedItems.length) {
      const buyCount = Number(item.buyCount) || 1;
      const packageText = item.packageType || "verpakking";
      state.shopping.push({
        id: Date.now() + Math.floor(Math.random() * 1000000),
        name: `${item.name} — ${buyCount} ${packageText}${buyCount === 1 ? "" : "(en)"}`,
        store: "Picnic",
        priority: "Binnenkort",
        person: "Fredy",
        done: false,
        sourceStockId: item.id,
      });
    }

    if (status === "Aanvullen" && linkedItems.length > 1) {
      const keeper = linkedItems.find((x) => !x.done) || linkedItems[0];
      state.shopping = state.shopping.filter(
        (x) => x.sourceStockId !== item.id || x.id === keeper.id,
      );
    }

    if (status === "Voldoende" && linkedItems.length) {
      state.shopping = state.shopping.filter(
        (x) => x.sourceStockId !== item.id,
      );
    }
  });

  save();
  alert(`Alle producten met 'Alleen aanvullen' staan nu op '${label}'.`);
}

function setSimpleStatus(id, status) {
  const item = state.stock.find((x) => x.id === id);
  if (!item) return;

  item.simpleStatus = status;

  // Een bewuste nieuwe statuskeuze maakt een eerdere verwijdering ongedaan.
  state.suppressedStockShopping = state.suppressedStockShopping.filter(
    (stockId) => stockId !== item.id,
  );

  const linkedItems = state.shopping.filter((x) => x.sourceStockId === item.id);

  if (status === "Aanvullen" && !linkedItems.length) {
    const buyCount = Number(item.buyCount) || 1;
    const packageText = item.packageType || "verpakking";
    state.shopping.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: `${item.name} — ${buyCount} ${packageText}${buyCount === 1 ? "" : "(en)"}`,
      store: "Picnic",
      priority: "Binnenkort",
      person: "Fredy",
      done: false,
      sourceStockId: item.id,
    });
  }

  if (status === "Aanvullen" && linkedItems.length > 1) {
    const keeper = linkedItems.find((x) => !x.done) || linkedItems[0];
    state.shopping = state.shopping.filter(
      (x) => x.sourceStockId !== item.id || x.id === keeper.id,
    );
  }

  if (status === "Voldoende" && linkedItems.length) {
    state.shopping = state.shopping.filter((x) => x.sourceStockId !== item.id);
  }

  save();
}
function setupStockFilters() {
  const select = document.getElementById("stockCategoryFilter");
  if (select) {
    const current = select.value;
    const categories = (state.categories || [])
      .slice()
      .sort((a, b) => a.localeCompare(b, "nl"));
    select.innerHTML =
      '<option value="">Alle categorieën</option>' +
      categories.map((c) => `<option>${esc(c)}</option>`).join("");
    select.value = current;
  }
}

function renderCategories() {
  const el = document.getElementById("categoryList");
  if (!el) return;
  const categories = (state.categories || [])
    .slice()
    .sort((a, b) => a.localeCompare(b, "nl"));
  el.innerHTML = categories
    .map((category, index) => {
      const count = state.stock.filter(
        (x) => (x.category || "Overig") === category,
      ).length;
      const locked = category === "Overig";
      return `<div class="category-card">
     <label>Categorie</label>
     <input id="cat-${index}" class="category-name-input" value="${esc(category)}" ${locked ? "disabled" : ""}>
     <div class="category-meta">${count} product(en) gebruiken deze categorie</div>
     <div class="category-actions">
       ${
         locked
           ? '<button class="btn secondary" disabled>Vaste categorie</button>'
           : `<button class="btn secondary" onclick="renameCategory('${encodeURIComponent(category)}',${index})">Opslaan</button>
            <button class="btn danger" onclick="deleteCategory('${encodeURIComponent(category)}')">Verwijderen</button>`
       }
     </div>
   </div>`;
    })
    .join("");
}
function setupCategoryManager() {
  const button = document.getElementById("addCategoryButton");
  if (!button || button.dataset.ready === "1") return;
  button.dataset.ready = "1";
  button.addEventListener("click", addCategory);
  const input = document.getElementById("newCategoryName");
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory();
    }
  });
}
function addCategory() {
  const input = document.getElementById("newCategoryName");
  const name = (input?.value || "").trim();
  if (!name) return;
  const exists = (state.categories || []).some(
    (c) => c.toLowerCase() === name.toLowerCase(),
  );
  if (exists) {
    alert("Deze categorie bestaat al.");
    return;
  }
  state.categories.push(name);
  input.value = "";
  save();
}
function renameCategory(encodedOld, index) {
  const oldName = decodeURIComponent(encodedOld);
  const input = document.getElementById(`cat-${index}`);
  const newName = (input?.value || "").trim();
  if (!newName || newName === oldName) return;
  const exists = state.categories.some(
    (c) => c.toLowerCase() === newName.toLowerCase() && c !== oldName,
  );
  if (exists) {
    alert("Deze categorie bestaat al.");
    return;
  }
  state.categories = state.categories.map((c) => (c === oldName ? newName : c));
  state.stock.forEach((item) => {
    if (item.category === oldName) item.category = newName;
  });
  save();
}
function deleteCategory(encodedName) {
  const name = decodeURIComponent(encodedName);
  if (name === "Overig") return;
  state.stock.forEach((item) => {
    if (item.category === name) item.category = "Overig";
  });
  state.categories = state.categories.filter((c) => c !== name);
  if (!state.categories.includes("Overig")) state.categories.push("Overig");
  save();
}
function categoryOptions(selected = "") {
  return (state.categories || [])
    .slice()
    .sort((a, b) => a.localeCompare(b, "nl"))
    .map(
      (c) => `<option ${c === selected ? "selected" : ""}>${esc(c)}</option>`,
    )
    .join("");
}

function editStock(id) {
  const item = state.stock.find((x) => x.id === id);
  if (item) openModal("stock", item);
}
function removeStock(id) {
  state.stock = state.stock.filter((x) => x.id !== id);
  state.hutsel = state.hutsel.filter((x) => x.sourceStockId !== id);
  save();
}
function syncStockToHutsel(stock) {
  const existing = state.hutsel.find((x) => x.sourceStockId === stock.id);
  if (stock.stockType === "simple") {
    if (existing)
      state.hutsel = state.hutsel.filter((x) => x.sourceStockId !== stock.id);
    return;
  }
  const hasCurrent =
    stock.currentAmount !== "" &&
    stock.currentAmount !== null &&
    stock.currentAmount !== undefined;
  const applies =
    stock.toHutsel &&
    Number(stock.minimum) > 0 &&
    hasCurrent &&
    Number(stock.currentAmount) > 0 &&
    Number(stock.currentAmount) <= Number(stock.minimum);
  if (applies) {
    const amount = `${Number(stock.currentAmount) || 0} ${stock.unit}`;
    if (existing) {
      existing.name = stock.name;
      existing.amount = amount;
      existing.days = 7;
    } else {
      state.hutsel.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: stock.name,
        amount,
        days: 7,
        sourceStockId: stock.id,
      });
    }
  } else if (existing) {
    state.hutsel = state.hutsel.filter((x) => x.sourceStockId !== stock.id);
  }
}
function syncAllStockToHutsel(doSave = true) {
  state.stock.forEach(syncStockToHutsel);
  if (doSave) save();
}
function removeItem(type, id) {
  if (type === "shopping") {
    const item = state.shopping.find((x) => x.id === id);

    // Onthoud dat een automatisch voorraadproduct bewust is verwijderd.
    // Daardoor zet de synchronisatie het niet direct terug.
    if (item?.sourceStockId) {
      if (!state.suppressedStockShopping.includes(item.sourceStockId)) {
        state.suppressedStockShopping.push(item.sourceStockId);
      }
    }
  }

  state[type] = state[type].filter((x) => x.id !== id);
  save();
}
