/*
=====================================
Gezinsplanner
Bestand : shopping.js
Versie  : v1.37.2-stap2
Laatst gewijzigd : 06-08-2026

Functie :
- Opslaan van gegevens
- LocalStorage
- Algemene functies

Wijzigingen:
- Knop Aankopen verwerken toegevoegd
- Afvinken en verwerken van aankopen gescheiden
- Boodschappen gegroepeerd per winkel
=====================================
*/

const SHOPPING_COLLAPSED_STORES_KEY = "gezinsplanner_shopping_collapsed_stores";

function getCollapsedShoppingStores() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SHOPPING_COLLAPSED_STORES_KEY) || "[]",
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function toggleShoppingStore(store) {
  const collapsedStores = getCollapsedShoppingStores();
  const index = collapsedStores.indexOf(store);

  if (index === -1) {
    collapsedStores.push(store);
  } else {
    collapsedStores.splice(index, 1);
  }

  localStorage.setItem(
    SHOPPING_COLLAPSED_STORES_KEY,
    JSON.stringify(collapsedStores),
  );

  renderShopping();
}

function renderShopping() {
  const sf = shopFilter.value,
    pf = prioFilter.value;
  const arr = state.shopping.filter(
    (x) => (!sf || x.store === sf) && (!pf || x.priority === pf),
  );

  if (!arr.length) {
    shoppingList.innerHTML = `<div class="empty">Geen producten gevonden.</div>`;
    return;
  }

  const storeOrder = ["Picnic", "Jumbo", "AH", "Lidl", "Aldi", "Overig"];
  const storeLabel = (store) =>
    store === "AH" ? "Albert Heijn" : store || "Overig";
  const storeRank = (store) => {
    const index = storeOrder.indexOf(store || "Overig");
    return index === -1 ? storeOrder.length : index;
  };

  const grouped = arr.reduce((groups, item) => {
    const store = item.store || "Overig";
    if (!groups[store]) groups[store] = [];
    groups[store].push(item);
    return groups;
  }, {});

  const stores = Object.keys(grouped).sort((a, b) => {
    const rankDifference = storeRank(a) - storeRank(b);
    return rankDifference || storeLabel(a).localeCompare(storeLabel(b), "nl");
  });

  shoppingList.innerHTML = stores
    .map((store) => {
      const items = grouped[store];
      const rows = items
        .map(
          (
            x,
          ) => `<div class="row"><input class="check" type="checkbox" ${x.done ? "checked" : ""} onchange="toggleShopping(${x.id})"><div class="grow"><b style="${x.done ? "text-decoration:line-through;color:#9aa5ad" : ""}">${esc(x.name)}</b>
        ${
          shoppingAmountText(x)
            ? `<div class="muted">${esc(shoppingAmountText(x))}</div>`
            : ""
        }<div class="itemmeta"><button
  type="button"
  class="pill"
  onclick="cycleShoppingStore(${x.id})"
>
  ${esc(x.store || "Overig")}
</button><span class="pill">${esc(x.person)}</span>${x.sourceStockId ? '<span class="pill">Voorraad gekoppeld</span>' : ""}${x.createStockAfterPurchase ? '<span class="pill">Nieuw naar voorraad</span>' : ""}${
            x.sourceRecipeName
              ? `<button
  type="button"
  class="pill"
  onclick="openRecipeFromShopping(${x.sourceRecipeId})"
>
  🍽️ ${esc(x.sourceRecipeName)}
</button>`
              : x.dish
                ? `<span class="pill">🍽️ ${esc(x.dish)}</span>`
                : ""
          }</div></div><span class="tag ${prioClass(x.priority)}">${esc(x.priority)}</span><button class="btn secondary" onclick="editShoppingStore(${x.id})">Wijzig winkel</button><button class="btn danger" onclick="removeItem('shopping',${x.id})">×</button></div>`,
        )
        .join("");

      const collapsed = getCollapsedShoppingStores().includes(store);

      return `<section
  class="shopping-store-group ${collapsed ? "is-collapsed" : ""}"
  data-store="${esc(store)}"
>
  <button
    type="button"
    class="shopping-store-heading"
    onclick="toggleShoppingStore('${esc(store)}')"
    aria-expanded="${collapsed ? "false" : "true"}"
  >
    <span class="shopping-store-heading-title">
      <span class="shopping-store-arrow">
        ${collapsed ? "▶" : "▼"}
      </span>

      <span>${esc(storeLabel(store))}</span>
    </span>

    <span class="shopping-store-count">
      ${items.length} ${items.length === 1 ? "product" : "producten"}
    </span>
  </button>

  <div class="shopping-store-items">${rows}</div>
</section>`;
    })
    .join("");
}

function openRecipeFromShopping(recipeId) {
  const recipe = state.recipes.find((r) => String(r.id) === String(recipeId));

  if (!recipe) {
    alert("Het recept is niet meer gevonden.");
    return;
  }

  viewRecipe(recipeId);
}

function editShoppingStore(id) {
  const item = state.shopping.find((x) => x.id === id);

  if (!item) {
    alert("Het boodschappenproduct is niet gevonden.");
    return;
  }

  const choice = prompt(
    "Bij welke winkel wil je dit kopen?",
    item.store || "Picnic",
  );

  if (choice === null) return;

  const newStore = choice.trim();

  if (!newStore) return;

  item.store = newStore;
  save();
}
function cycleShoppingStore(id) {
  const item = state.shopping.find((x) => x.id === id);

  if (!item) return;

  const stores = ["Picnic", "Jumbo", "AH", "Lidl", "Aldi", "Overig"];

  const currentIndex = stores.indexOf(item.store);
  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % stores.length;

  item.store = stores[nextIndex];

  save();
}
shopFilter.onchange = renderShopping;
prioFilter.onchange = renderShopping;
document.addEventListener("input", (e) => {
  if (e.target?.id === "stockSearch") renderStock();
});
document.addEventListener("change", (e) => {
  if (e.target?.id === "stockCategoryFilter") renderStock();
});
function toggleShopping(id) {
  const item = state.shopping.find((x) => x.id === id);
  if (!item) return;

  // In versie 1.37.1 betekent afvinken alleen: dit product is gekocht.
  // De voorraad wordt pas bijgewerkt via Aankopen verwerken.
  item.done = !item.done;
  save();
}

function processPurchasedItems() {
  const purchased = state.shopping.filter((item) => item.done);

  if (!purchased.length) {
    alert("Er zijn nog geen boodschappen afgevinkt.");
    return;
  }

  const confirmed = confirm(
    `Wil je ${purchased.length} afgevinkte ${purchased.length === 1 ? "boodschap" : "boodschappen"} verwerken?`,
  );

  if (!confirmed) return;

  let stockUpdated = 0;
  let recipeItemsRemoved = 0;
  let manualItemsRemoved = 0;
  let newStockItems = 0;

  purchased.forEach((item) => {
    if (item.sourceStockId) {
      const stock = state.stock.find(
        (stockItem) => String(stockItem.id) === String(item.sourceStockId),
      );

      if (stock) {
        if (stock.stockType === "exact") {
          const packages = Number(stock.buyCount) || 1;
          const perPackage = Number(stock.packageContent) || 0;
          const added = packages * perPackage;
          const current = Number(stock.currentAmount) || 0;

          if (added > 0) stock.currentAmount = current + added;
        } else if (stock.stockType === "simple") {
          stock.simpleStatus = "Voldoende";
        }

        stockUpdated += 1;
      }
    } else if (item.createStockAfterPurchase) {
      const exists = state.stock.some(
        (stockItem) =>
          stockItem.name.trim().toLowerCase() ===
          item.name.trim().toLowerCase(),
      );

      if (!exists) {
        state.stock.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: item.name,
          category: "Overig",
          stockType: "simple",
          simpleStatus: "Voldoende",
          packageType: "",
          packageContent: "",
          unit: "",
          currentAmount: "",
          minimum: "",
          toHutsel: false,
          buyCount: "",
          amount: "",
        });
        newStockItems += 1;
      }
    }

    if (item.sourceRecipeId || item.sourceRecipeName || item.dish) {
      recipeItemsRemoved += 1;
    } else if (!item.sourceStockId && !item.createStockAfterPurchase) {
      manualItemsRemoved += 1;
    }
  });

  const purchasedIds = new Set(purchased.map((item) => String(item.id)));
  state.shopping = state.shopping.filter(
    (item) => !purchasedIds.has(String(item.id)),
  );

  save();

  const details = [
    `${purchased.length} ${purchased.length === 1 ? "boodschap verwerkt" : "boodschappen verwerkt"}.`,
  ];

  if (stockUpdated)
    details.push(`${stockUpdated} voorraadproduct(en) bijgewerkt.`);
  if (newStockItems)
    details.push(`${newStockItems} nieuw(e) voorraadproduct(en) toegevoegd.`);
  if (recipeItemsRemoved)
    details.push(`${recipeItemsRemoved} receptingrediënt(en) verwijderd.`);
  if (manualItemsRemoved)
    details.push(`${manualItemsRemoved} losse boodschap(pen) verwijderd.`);

  alert(details.join("\n"));
}
