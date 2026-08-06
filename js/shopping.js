/*
=====================================
Gezinsplanner
Bestand : core.js
Versie  : v1.36
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

function renderShopping() {
  const sf = shopFilter.value,
    pf = prioFilter.value;
  const arr = state.shopping.filter(
    (x) => (!sf || x.store === sf) && (!pf || x.priority === pf),
  );
  shoppingList.innerHTML = arr.length
    ? arr
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
  ${esc(x.store)}
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
        .join("")
    : `<div class="empty">Geen producten gevonden.</div>`;
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

  // Een automatisch toegevoegd voorraadproduct is gekocht.
  if (item.sourceStockId) {
    const stock = state.stock.find((x) => x.id === item.sourceStockId);

    if (stock && stock.stockType === "exact") {
      const packages = Number(stock.buyCount) || 1;
      const perPackage = Number(stock.packageContent) || 0;
      const added = packages * perPackage;

      if (added > 0) {
        const current =
          stock.currentAmount === "" || stock.currentAmount === null
            ? 0
            : Number(stock.currentAmount);
        stock.currentAmount = current + added;
      }

      state.shopping = state.shopping.filter((x) => x.id !== id);
      save();
      return;
    }

    if (stock && stock.stockType === "simple") {
      stock.simpleStatus = "Voldoende";
      state.shopping = state.shopping.filter((x) => x.id !== id);
      save();
      return;
    }
  }

  if (item.createStockAfterPurchase) {
    const exists = state.stock.some(
      (x) => x.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
    );
    if (!exists) {
      state.stock.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: item.name,
        category: "Overig",
        stockType: "simple",
        simpleStatus: "Aanvullen",
        packageType: "",
        packageContent: "",
        unit: "",
        currentAmount: "",
        minimum: "",
        toHutsel: false,
        buyCount: "",
        amount: "",
      });
    }
    state.shopping = state.shopping.filter((x) => x.id !== id);
    save();
    return;
  }

  // Gewone boodschappen blijven als afgevinkt zichtbaar.
  item.done = !item.done;
  save();
}
