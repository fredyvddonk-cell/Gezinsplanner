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

function recipeStockOptions(selected) {
  return (
    '<option value="">Niet koppelen</option>' +
    state.stock
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "nl"))
      .map(
        (s) =>
          `<option value="${s.id}" ${String(s.id) === String(selected || "") ? "selected" : ""}>${esc(s.name)}</option>`,
      )
      .join("")
  );
}
function addRecipeIngredientRow(item) {
  item = item || {};
  const box = document.getElementById("recipeIngredients");
  if (!box) return;
  const units = [
    "gram",
    "kg",
    "ml",
    "liter",
    "stuks",
    "zakjes",
    "blokjes",
    "eetlepel",
    "theelepel",
    "naar smaak",
  ];
  box.insertAdjacentHTML(
    "beforeend",
    `<div class="ingredient-line">
   <div class="wide"><label>Ingrediënt</label><input class="ri-name" value="${esc(item.name || "")}" placeholder="Bijv. rijst"></div>
   <div><label>Hoeveelheid</label><input class="ri-amount" type="number" min="0" step="any" value="${item.amount === undefined || item.amount === null ? "" : esc(item.amount)}"></div>
   <div><label>Eenheid</label><select class="ri-unit">${units.map((u) => `<option ${u === (item.unit || "gram") ? "selected" : ""}>${u}</option>`).join("")}</select></div>
   <div class="wide"><label>Voorraadproduct</label><select class="ri-stock">${recipeStockOptions(item.stockId)}</select></div>
   <button type="button" class="btn danger ri-remove">×</button>
 </div>`,
  );
  const row = box.lastElementChild;
  row.querySelector(".ri-remove").addEventListener("click", () => row.remove());
}
function clearRecipeForm() {
  document.getElementById("recipeId").value = "";
  document.getElementById("recipeName").value = "";
  document.getElementById("recipePortions").value = "4";
  document.getElementById("recipeMethod").value = "";
  document.getElementById("recipeIngredients").innerHTML = "";
  addRecipeIngredientRow({});
}
function renderRecipes() {
  const el = document.getElementById("recipeList");
  if (!el) return;
  if (!state.recipes.length) {
    el.innerHTML = '<div class="empty">Nog geen recepten opgeslagen.</div>';
    return;
  }
  el.innerHTML = state.recipes
    .map(
      (r) => `<div class="recipe-card">
   <div class="topline">
     <div>
       <b>${esc(r.name)}</b>
       <div class="muted">${Number(r.portions) || 4} personen · ${(r.ingredients || []).length} ingrediënt(en)</div>
     </div>
     <div class="actions">
       <button class="btn" onclick="viewRecipe(${r.id})">Bekijken</button>
       <button class="btn secondary" onclick="planRecipe(${r.id})">Plan</button>
       <button class="btn secondary" onclick="editRecipe(${r.id})">Wijzig</button>
       <button class="btn danger" onclick="deleteRecipe(${r.id})">Verwijder</button>
     </div>
   </div>
 </div>`,
    )
    .join("");
}

function viewRecipe(id) {
  const recipe = state.recipes.find((r) => String(r.id) === String(id));
  if (!recipe) return;

  modalback.classList.add("open");
  modalTitle.textContent = recipe.name;
  modalForm.innerHTML = `<div class="recipe-view">
   <div class="itemmeta">
     <span class="pill">${Number(recipe.portions) || 4} personen</span>
     <span class="pill">${(recipe.ingredients || []).length} ingrediënten</span>
   </div>

   <h4>Ingrediënten</h4>
   <ul>
     ${(recipe.ingredients || []).map((i) => `<li>${i.amount !== "" && i.amount !== null && i.amount !== undefined ? `${esc(i.amount)} ` : ""}${esc(i.unit || "")} ${esc(i.name || "")}</li>`).join("")}
   </ul>

   <h4>Bereiding</h4>
   <div class="recipe-method">${esc(recipe.method || "Nog geen bereidingswijze ingevuld.")}</div>

   <div class="actions">
     <button type="button" class="btn" onclick="planRecipe(${recipe.id})">Plan dit recept</button>
     <button type="button" class="btn secondary" onclick="addRecipeIngredientsToShopping(${recipe.id})">🛒 Ingrediënten naar boodschappenlijst</button>
     <button type="button" class="btn secondary" onclick="closeModal();editRecipe(${recipe.id})">Wijzig</button>
     <button type="button" class="btn secondary" onclick="closeModal()">Sluiten</button>
   </div>
 </div>`;
  modalForm.onsubmit = (e) => e.preventDefault();
}

function addRecipeIngredientsToShopping(recipeId) {
  const recipe = state.recipes.find((r) => String(r.id) === String(recipeId));

  if (!recipe) {
    alert("Het recept is niet gevonden.");
    return;
  }

  const ingredients = (recipe.ingredients || []).filter((i) => i.name);

  if (!ingredients.length) {
    alert("Dit recept bevat nog geen ingrediënten.");
    return;
  }

  let addedCount = 0;
  let mergedCount = 0;
  let skippedCount = 0;

  ingredients.forEach((ingredient) => {
    const name = String(ingredient.name || "").trim();
    const unit = String(ingredient.unit || "").trim();
    const store = "Picnic";

    const amount =
      ingredient.amount !== "" &&
      ingredient.amount !== null &&
      ingredient.amount !== undefined
        ? Number(ingredient.amount)
        : "";

    const existing = state.shopping.find(
      (item) =>
        !item.done &&
        String(item.name || "")
          .trim()
          .toLowerCase() === name.toLowerCase() &&
        String(item.unit || "")
          .trim()
          .toLowerCase() === unit.toLowerCase() &&
        String(item.store || "")
          .trim()
          .toLowerCase() === store.toLowerCase(),
    );

    if (existing) {
      const recipeNames = Array.isArray(existing.sourceRecipes)
        ? existing.sourceRecipes
        : [existing.sourceRecipeName || existing.dish].filter(Boolean);

      if (recipeNames.includes(recipe.name)) {
        skippedCount++;
        return;
      }

      const existingAmount = Number(existing.amount);

      if (Number.isFinite(existingAmount) && Number.isFinite(amount)) {
        existing.amount = existingAmount + amount;
        existing.sourceRecipes = [...recipeNames, recipe.name];
        mergedCount++;
        return;
      }
    }

    state.shopping.push({
      id: Date.now() + Math.floor(Math.random() * 1000000),
      name,
      amount,
      unit,
      store,
      priority: "Binnenkort",
      person: "Fredy",
      done: false,
      sourceRecipeId: recipe.id,
      sourceRecipeName: recipe.name,
      sourceRecipes: [recipe.name],
      ingredientName: name,
    });

    addedCount++;
  });

  save();
  closeModal();
  go("boodschappen");

  alert(
    `${addedCount} nieuw toegevoegd.\n` +
      `${mergedCount} samengevoegd.\n` +
      `${skippedCount} stond al op de lijst.`,
  );
}

function planRecipe(id) {
  const recipe = state.recipes.find((r) => String(r.id) === String(id));
  if (!recipe) {
    alert(
      "Dit recept kon niet worden gevonden. Vernieuw de pagina en probeer het opnieuw.",
    );
    return;
  }

  openModal("meal", {
    name: recipe.name,
    recipeId: recipe.id,
    note: `${Number(recipe.portions) || 4} personen`,
  });
}

function editRecipe(id) {
  const recipe = state.recipes.find((r) => String(r.id) === String(id));
  if (!recipe) return;
  go("recepten");
  document.getElementById("recipeId").value = recipe.id;
  document.getElementById("recipeName").value = recipe.name || "";
  document.getElementById("recipePortions").value = recipe.portions || 4;
  document.getElementById("recipeMethod").value = recipe.method || "";
  document.getElementById("recipeIngredients").innerHTML = "";
  (recipe.ingredients && recipe.ingredients.length
    ? recipe.ingredients
    : [{}]
  ).forEach(addRecipeIngredientRow);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function deleteRecipe(id) {
  state.recipes = state.recipes.filter((r) => r.id !== id);
  save();
}
function setupRecipeForm() {
  const form = document.getElementById("recipeForm");
  if (!form || form.dataset.ready === "1") return;
  form.dataset.ready = "1";
  document
    .getElementById("addRecipeIngredient")
    .addEventListener("click", () => addRecipeIngredientRow({}));
  document
    .getElementById("cancelRecipeEdit")
    .addEventListener("click", clearRecipeForm);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("recipeName").value.trim();
    if (!name) {
      alert("Vul eerst een naam voor het recept in.");
      return;
    }
    const rows = [
      ...document.querySelectorAll("#recipeIngredients .ingredient-line"),
    ];
    const ingredients = rows
      .map((row) => ({
        name: (row.querySelector(".ri-name").value || "").trim(),
        amount:
          row.querySelector(".ri-amount").value === ""
            ? ""
            : Number(row.querySelector(".ri-amount").value),
        unit: row.querySelector(".ri-unit").value || "gram",
        stockId: row.querySelector(".ri-stock").value
          ? Number(row.querySelector(".ri-stock").value)
          : null,
      }))
      .filter((i) => i.name);

    const existingId =
      Number(document.getElementById("recipeId").value) || null;
    const recipe = {
      id: existingId || Date.now(),
      name,
      portions: Number(document.getElementById("recipePortions").value) || 4,
      method: document.getElementById("recipeMethod").value || "",
      ingredients,
    };

    if (existingId) {
      const index = state.recipes.findIndex(
        (r) => String(r.id) === String(existingId),
      );
      if (index >= 0) state.recipes[index] = recipe;
      else state.recipes.push(recipe);
    } else {
      state.recipes.push(recipe);
    }

    save();
    clearRecipeForm();
  });
  if (!document.querySelector("#recipeIngredients .ingredient-line"))
    addRecipeIngredientRow({});
}
