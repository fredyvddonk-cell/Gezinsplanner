/*
=====================================
Gezinsplanner
Bestand : core.js
Versie  : v1.37.2-stap1
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

function mealRecipeOptions(selected) {
  return (
    '<option value="">Geen recept gekoppeld</option>' +
    state.recipes
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "nl"))
      .map(
        (r) =>
          `<option value="${r.id}" ${String(r.id) === String(selected || "") ? "selected" : ""}>${esc(r.name)}</option>`,
      )
      .join("")
  );
}

function editPlannedMeal(id) {
  const meal = state.meals.find((x) => String(x.id) === String(id));
  if (!meal) return;
  // Ook een losse maaltijd moet via deze knop een recept kunnen krijgen.
  openModal("meal", meal);
}

function openModal(type, editData = null) {
  modalback.classList.add("open");
  const forms = {
    shopping: {
      title: "Boodschap toevoegen",
      html: `<div class="formgrid">
  <div class="full"><label>Product</label><input name="name" required placeholder="Bijv. kipfilet"></div>
  <div><label>Aantal</label><input name="quantity" type="number" min="1" step="1" value="1"></div>
  <div><label>Gewicht / inhoud</label><input name="weight" type="number" min="0" step="any" placeholder="Bijv. 750"></div>
  <div><label>Eenheid</label><select name="weightUnit"><option value="">Niet nodig</option><option>gram</option><option>kg</option><option>ml</option><option>liter</option><option>stuks</option></select></div>
  <div><label>Winkel</label><select name="store"><option>Picnic</option><option>Jumbo</option><option>Albert Heijn</option><option>Fruitboer</option><option>Bakker</option></select></div>
  <div><label>Prioriteit</label><select name="priority"><option>Op</option><option>Binnenkort</option><option>Wens</option></select></div>
  <div class="full"><label>Toegevoegd door</label><select name="person"><option>Fredy</option><option>Man</option><option>Dochter 1</option><option>Dochter 2</option><option>Zoon</option></select></div>
  <div class="full"><label>Voorraad na aankoop</label>
    <select name="stockAction" id="shoppingStockAction">
      <option value="none">Niet koppelen</option>
      <option value="link">Koppelen aan bestaand voorraadproduct</option>
      <option value="create">Toevoegen als nieuw voorraadproduct</option>
    </select>
  </div>
  <div class="full" id="shoppingStockLinkWrap" style="display:none">
    <label>Bestaand voorraadproduct</label>
    <select name="sourceStockId">${recipeStockOptions(editData?.sourceStockId || "")}</select>
  </div>
  <div class="full"><div class="muted">Bij nieuw toevoegen wordt het product na afvinken in Voorraad gezet als <b>Alleen aanvullen</b> met status <b>Voldoende</b>.</div></div>
  <div class="full"><button class="btn">Opslaan</button></div></div>`,
    },
    meal: {
      title: editData
        ? editData.recipeId
          ? "Gepland recept wijzigen"
          : "Recept koppelen"
        : "Recept plannen",
      html: `<div class="formgrid">
  <input type="hidden" name="id">
  <input type="hidden" name="recipeId" value="${esc(editData?.recipeId || "")}">
  <div><label>Dag</label><select name="day"><option>Maandag</option><option>Dinsdag</option><option>Woensdag</option><option>Donderdag</option><option>Vrijdag</option><option>Zaterdag</option><option>Zondag</option></select></div>
  <div><label>Letter</label><select name="letter"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option></select></div>
  <div class="full"><label>Maaltijd</label><input type="text" id="mealRecipeSelect" name="recipeName" list="mealRecipeList" value="${esc(editData?.name || "")}" placeholder="Kies een recept of typ zelf een maaltijd"><datalist id="mealRecipeList">${state.recipes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "nl"))
    .map((r) => `<option value="${esc(r.name)}"></option>`)
    .join("")}</datalist></div>
  <div class="full"><label>Notitie</label><textarea name="note"></textarea></div>
  <div class="full"><button class="btn">${editData ? "Wijzigingen opslaan" : "Recept plannen"}</button></div></div>`,
    },
    loosemeal: {
      title: editData ? "Losse maaltijd wijzigen" : "Losse maaltijd plannen",
      html: `<div class="formgrid">
  <input type="hidden" name="id">
  <div><label>Dag</label><select name="day"><option>Maandag</option><option>Dinsdag</option><option>Woensdag</option><option>Donderdag</option><option>Vrijdag</option><option>Zaterdag</option><option>Zondag</option></select></div>
  <div><label>Letter</label><select name="letter"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option></select></div>
  <div class="full"><label>Maaltijd</label><input name="name" required placeholder="Bijv. uit eten of friet halen"></div>
  <div class="full"><label>Notitie</label><textarea name="note"></textarea></div>
  <div class="full"><button class="btn">${editData ? "Wijzigingen opslaan" : "Losse maaltijd plannen"}</button></div></div>`,
    },
    freezer: {
      title: "Vriezeritem toevoegen",
      html: `<div class="formgrid">
  <div class="full"><label>Gerecht</label><input name="name" required></div>
  <div><label>Aantal porties</label><input name="portions" type="number" min="1" value="2"></div>
  <div><label>Invriesdatum</label><input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
  <div class="full"><button class="btn">Opslaan</button></div></div>`,
    },
    hutsel: {
      title: "Hutsel Frutsel toevoegen",
      html: `<div class="formgrid">
  <div class="full"><label>Product</label><input name="name" required></div>
  <div class="full"><label>Binnen hoeveel dagen gebruiken?</label><input name="days" type="number" min="0" value="2"></div>
  <div class="full"><button class="btn">Opslaan</button></div></div>`,
    },
    stock: {
      title: editData
        ? "Voorraadproduct wijzigen"
        : "Voorraadproduct toevoegen",
      html: `<div class="formgrid">
  <div class="full"><label>Product</label><input name="name" required placeholder="Bijv. rijst"></div>

  <div class="full"><label>Categorie</label><select name="category">${categoryOptions(editData?.category || "Overig")}</select></div>

  <div class="full"><label>Standaardwinkel</label><select name="store">
    <option>Picnic</option><option>Jumbo</option><option>AH</option><option>Lidl</option><option>Aldi</option><option>Overig</option>
  </select></div>

  <div class="full"><label>Voorraadtype</label><select name="stockType" id="stockTypeSelect">
    <option value="simple">Alleen aanvullen</option>
    <option value="exact">Exact bijhouden</option>
  </select></div>

  <div><label>Verpakking</label><select name="packageType">
    <option value="">Nog invullen</option><option>zak</option><option>pak</option><option>doos</option><option>doosje</option>
    <option>blik</option><option>blikje</option><option>pot</option><option>tube</option><option>fles</option>
    <option>flesje</option><option>beker</option><option>bakje</option><option>rol</option><option>stuk</option><option>verpakking</option>
  </select></div>

  <div><label>Koop meestal</label><input name="buyCount" type="number" min="1" step="1"></div>

  <div class="full" id="exactFields">
    <div class="formgrid">
      <div><label>Inhoud verpakking</label><input name="packageContent" type="number" min="0" step="any"></div>
      <div><label>Eenheid</label><select name="unit">
        <option value="">Nog invullen</option><option>gram</option><option>kg</option><option>ml</option><option>liter</option>
        <option>stuks</option><option>zakjes</option><option>blokjes</option><option>tabletten</option>
        <option>plakjes</option><option>sneetjes</option><option>capsules</option><option>porties</option>
      </select></div>
      <div><label>Nog aanwezig</label><input name="currentAmount" type="number" min="0" step="any"></div>
      <div><label>Minimumhoeveelheid</label><input name="minimum" type="number" min="0" step="any"></div>
      <div class="full"><div class="note">Komt de aanwezige voorraad lager dan dit minimum, dan zet de app het product automatisch op de boodschappenlijst.</div></div>
      <div class="full checkline">
        <input id="toHutselBox" name="toHutsel" type="checkbox">
        <label for="toHutselBox">Bij minimumhoeveelheid op Hutsel Frutsel zetten</label>
      </div>
    </div>
  </div>

  <div class="full" id="simpleFields">
    <div class="note">Bij Alleen aanvullen houd je geen exacte hoeveelheid bij. Je kiest op de voorraadlijst alleen Voldoende of Aanvullen.</div>
  </div>

  <div class="full"><button class="btn">Opslaan</button></div>
</div>`,
    },
  };
  const f = forms[type];
  modalTitle.textContent = f.title;
  modalForm.innerHTML = f.html;
  modalForm.dataset.type = type;
  if (editData) {
    Object.entries(editData).forEach(([key, val]) => {
      const field = modalForm.elements[key];
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(val);
      else field.value = val ?? "";
    });
  }
  if ((type === "meal" || type === "loosemeal") && !editData) {
    const dagNamen = [
      "Zondag",
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
      "Zaterdag",
    ];
    const vandaag = dagNamen[new Date().getDay()];
    if (modalForm.elements.day) modalForm.elements.day.value = vandaag;
  }

  if (type === "meal") {
    const mealInput = document.getElementById("mealRecipeSelect");

    const fillFromRecipe = () => {
      const mealName = String(mealInput?.value || "")
        .trim()
        .toLowerCase();
      const recipe = state.recipes.find(
        (r) =>
          String(r.name || "")
            .trim()
            .toLowerCase() === mealName,
      );

      if (modalForm.elements.recipeId) {
        modalForm.elements.recipeId.value = recipe ? recipe.id : "";
      }

      if (recipe && !modalForm.elements.note.value.trim()) {
        modalForm.elements.note.value = `${Number(recipe.portions) || 4} personen`;
      }
    };

    mealInput?.addEventListener("input", fillFromRecipe);
    mealInput?.addEventListener("change", fillFromRecipe);
    fillFromRecipe();
  }
  if (type === "shopping") {
    const actionField = document.getElementById("shoppingStockAction");
    const linkWrap = document.getElementById("shoppingStockLinkWrap");
    const updateShoppingStockFields = () => {
      if (linkWrap)
        linkWrap.style.display =
          actionField?.value === "link" ? "block" : "none";
    };
    actionField?.addEventListener("change", updateShoppingStockFields);
    updateShoppingStockFields();
  }

  if (type === "stock") {
    const updateStockFields = () => {
      const simple = modalForm.elements.stockType?.value === "simple";
      const exactFields = document.getElementById("exactFields");
      const simpleFields = document.getElementById("simpleFields");
      if (exactFields) exactFields.style.display = simple ? "none" : "block";
      if (simpleFields) simpleFields.style.display = simple ? "block" : "none";
    };
    modalForm.elements.stockType?.addEventListener("change", updateStockFields);
    updateStockFields();
  }
  modalForm.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const id = Date.now();
    if (type === "shopping")
      state.shopping.push({
        id,
        name: data.name,
        quantity: Number(data.quantity) || 1,
        weight: data.weight === "" ? "" : Number(data.weight),
        weightUnit: data.weightUnit || "",
        store: data.store,
        priority: data.priority,
        person: data.person,
        done: false,
        sourceStockId:
          data.stockAction === "link" && data.sourceStockId
            ? Number(data.sourceStockId)
            : null,
        createStockAfterPurchase: data.stockAction === "create",
      });
    if (type === "meal") {
      const mealName = String(data.recipeName || "").trim();

      if (!mealName) {
        alert("Vul eerst een maaltijd in.");
        return;
      }

      const recipe = state.recipes.find(
        (r) =>
          String(r.id) === String(data.recipeId || "") ||
          String(r.name || "")
            .trim()
            .toLowerCase() === mealName.toLowerCase(),
      );

      const mealItem = {
        id: editData?.id || id,
        day: data.day,
        letter: data.letter,
        name: recipe ? recipe.name : mealName,
        note: data.note || "",
        recipeId: recipe ? recipe.id : null,
        done: false,
      };

      if (editData) {
        const index = state.meals.findIndex((x) => x.id === editData.id);
        if (index >= 0) state.meals[index] = mealItem;
        else state.meals.push(mealItem);
      } else {
        state.meals.push(mealItem);
      }
    }
    if (type === "loosemeal") {
      const mealItem = {
        id: editData?.id || id,
        day: data.day,
        letter: data.letter,
        name: data.name,
        note: data.note || "",
        recipeId: null,
        done: false,
      };

      if (editData) {
        const index = state.meals.findIndex((x) => x.id === editData.id);
        if (index >= 0) state.meals[index] = mealItem;
        else state.meals.push(mealItem);
      } else {
        state.meals.push(mealItem);
      }
    }
    if (type === "finishmeal") {
      const mealId = Number(modalForm.dataset.mealId);
      const meal = state.meals.find((x) => x.id === mealId);
      if (!meal) return;

      meal.done = true;
      meal.portionResult = data.portionResult || "";
      meal.portionNote = data.portionNote || "";

      if (data.addToHutsel === "on") {
        const hutselName = (data.hutselName || data.hutselPreset || "").trim();
        if (hutselName) {
          state.hutsel.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            name: hutselName,
            amount: (data.hutselAmount || "").trim(),
            days: Number(data.hutselDays) || 2,
            sourceMealId: meal.id,
          });
        }
      }

      delete modalForm.dataset.mealId;
    }
    if (type === "freezer")
      state.freezer.push({
        id,
        name: data.name,
        portions: +data.portions,
        date: data.date,
      });
    if (type === "hutsel")
      state.hutsel.push({ id, name: data.name, days: +data.days });
    if (type === "stock") {
      const item = {
        id: editData?.id || id,
        name: data.name,
        category: data.category || "Overig",
        store: data.store || editData?.store || "Picnic",
        stockType: data.stockType || "exact",
        simpleStatus: editData?.simpleStatus || "Voldoende",
        packageType: data.packageType || "",
        packageContent:
          data.stockType === "simple"
            ? ""
            : data.packageContent === ""
              ? ""
              : Number(data.packageContent),
        unit: data.stockType === "simple" ? "" : data.unit || "",
        currentAmount:
          data.stockType === "simple"
            ? ""
            : data.currentAmount === ""
              ? ""
              : Number(data.currentAmount),
        minimum:
          data.stockType === "simple"
            ? ""
            : data.minimum === ""
              ? ""
              : Number(data.minimum),
        toHutsel: data.stockType === "simple" ? false : data.toHutsel === "on",
        buyCount: data.buyCount === "" ? "" : Number(data.buyCount),
        amount: "",
      };
      if (editData) {
        const index = state.stock.findIndex((x) => x.id === editData.id);
        if (index >= 0) state.stock[index] = item;
      } else state.stock.push(item);
      syncStockToHutsel(item);
    }
    save();
    closeModal();
  };
}

function closeModal() {
  modalback.classList.remove("open");
}
try {
  syncLowStockShopping();
  persistState();
  renderAll();
} catch (error) {
  console.error("Fout bij laden van Gezinsplanner:", error);
}
go("start");
