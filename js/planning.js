/*
=====================================
Gezinsplanner
Bestand : core.js
Versie  : vv1.37.0b • Ontwikkeling
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

// Kookchecklist: apart opgeslagen, zodat vinkjes na opnieuw openen blijven staan.
const COOK_DONE_KEY = "gezinsplanner_cook_done_v1";

function loadCookDone() {
  try {
    const saved = JSON.parse(localStorage.getItem(COOK_DONE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.map(String) : []);
  } catch (error) {
    console.warn("Kookstatus kon niet worden gelezen.", error);
    return new Set();
  }
}

const cookDone = loadCookDone();

function saveCookDone() {
  try {
    localStorage.setItem(COOK_DONE_KEY, JSON.stringify([...cookDone]));
  } catch (error) {
    console.warn("Kookstatus kon niet worden opgeslagen.", error);
  }
}

function toggleCookDone(mealId, checked) {
  if (checked) cookDone.add(String(mealId));
  else cookDone.delete(String(mealId));
  saveCookDone();
  renderCooking();
}

const weekDays = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];

/**
 * Geeft alle geplande maaltijden van één dag terug.
 * Alle schermen gebruiken voortaan deze centrale functie.
 */
function getMealsForDay(day, options = {}) {
  const { includeDone = true } = options;
  return state.meals
    .filter((meal) => meal.day === day && (includeDone || !meal.done))
    .sort((a, b) => {
      const orderA = Number.isFinite(Number(a.order))
        ? Number(a.order)
        : Number(a.id) || 0;
      const orderB = Number.isFinite(Number(b.order))
        ? Number(b.order)
        : Number(b.id) || 0;
      return orderA - orderB;
    });
}

function openMealRecipe(mealId) {
  const meal = state.meals.find((x) => x.id === mealId);
  if (!meal) return;
  const recipe =
    state.recipes.find((r) => String(r.id) === String(meal.recipeId)) ||
    state.recipes.find(
      (r) =>
        String(r.name || "")
          .trim()
          .toLowerCase() ===
        String(meal.name || "")
          .trim()
          .toLowerCase(),
    );
  if (recipe) viewRecipe(recipe.id);
  else alert("Deze maaltijd is nog niet gekoppeld aan een opgeslagen recept.");
}

function renderWeekSlots(containerId, compact = false) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const isSunday = new Date().getDay() === 0;
  const sections = isSunday
    ? [
        { title: "Deze week", days: ["Zondag"], next: false },
        {
          title: "Volgende week",
          days: [
            "Maandag",
            "Dinsdag",
            "Woensdag",
            "Donderdag",
            "Vrijdag",
            "Zaterdag",
            "Zondag",
          ],
          next: true,
        },
      ]
    : [{ title: "", days: weekDays, next: false }];

  const renderDay = (day, sectionIndex) => {
    // Op zondag kan er maar één zondag-maaltijd zijn.
    // Die hoort bij "Deze week"; de zondag van volgende week blijft leeg tot maandag.
    const mealsForDay =
      isSunday && sectionIndex === 1 && day === "Zondag"
        ? []
        : getMealsForDay(day);

    if (!mealsForDay.length) {
      return `<div class="week-slot empty-slot" data-day="${day}" data-section="${sectionIndex}">
       <div class="letter" style="background:#c8d0d4">+</div>
       <div class="grow"><b>${day}</b><div class="muted">Nog niets gepland</div></div>
     </div>`;
    }

    return mealsForDay
      .map(
        (
          meal,
          mealIndex,
        ) => `<div class="week-slot meal-card" data-day="${day}" data-section="${sectionIndex}" data-meal-id="${meal.id}" draggable="true" style="${meal.done ? "opacity:.58" : ""}">
     <div class="meal-drag" title="Sleep naar een andere dag">☰</div>
     <div class="letter ${letterClass(meal.letter)}">${esc(meal.letter)}</div>
     <div class="grow meal-open" onclick="openMealRecipe(${meal.id})">
       <b style="${meal.done ? "text-decoration:line-through" : ""}">${day}${mealsForDay.length > 1 ? ` · ${mealIndex + 1}` : ""}</b>
       <div class="muted">${meal.done ? "✓ Gemaakt · " : ""}${esc(meal.name)}</div>
     </div>
     ${compact ? `<button class="btn secondary" onclick="editPlannedMeal(${meal.id})">${meal.recipeId ? "Wijzig" : "Koppel recept"}</button>` : `<button class="btn secondary" onclick="editPlannedMeal(${meal.id})">${meal.recipeId ? "Wijzig" : "Koppel recept"}</button>${!meal.done ? `<button class="btn secondary" onclick="markMealDone(${meal.id})">Gemaakt</button>` : ""}<button class="btn danger" onclick="removeItem('meals',${meal.id})">×</button>`}
   </div>`,
      )
      .join("");
  };

  el.innerHTML = sections
    .map(
      (section, index) => `
   ${section.title ? `<h4 class="week-section-title ${section.next ? "next" : ""}">${section.title}</h4>` : ""}
   <div class="week-slots">${section.days.map((day) => renderDay(day, index)).join("")}</div>
 `,
    )
    .join("");

  setupMealDragging(containerId);
}

function moveMealToDay(mealId, targetDay) {
  const moving = state.meals.find((x) => x.id === mealId);
  if (!moving || moving.day === targetDay) return;
  moving.day = targetDay;
  save();
}

function setupMealDragging(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const slots = [...container.querySelectorAll(".week-slot")];
  let draggedId = null;

  slots.forEach((slot) => {
    const mealId = Number(slot.dataset.mealId) || null;
    if (mealId) {
      slot.addEventListener("dragstart", (e) => {
        draggedId = mealId;
        slot.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(mealId));
      });
      slot.addEventListener("dragend", () => {
        slot.classList.remove("dragging");
        slots.forEach((s) => s.classList.remove("drag-over"));
        draggedId = null;
      });
    }
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggedId) slot.classList.add("drag-over");
    });
    slot.addEventListener("dragleave", () =>
      slot.classList.remove("drag-over"),
    );
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("drag-over");
      const id = draggedId || Number(e.dataTransfer.getData("text/plain"));
      if (id) moveMealToDay(id, slot.dataset.day);
    });
  });

  // Mobiel: sleep via het ☰-handvat.
  container.querySelectorAll(".meal-drag").forEach((handle) => {
    let card = null,
      pointerId = null;
    handle.addEventListener("pointerdown", (e) => {
      card = handle.closest(".meal-card");
      pointerId = e.pointerId;
      handle.setPointerCapture(pointerId);
      card.classList.add("dragging");
      e.preventDefault();
    });
    handle.addEventListener("pointermove", (e) => {
      if (!card || e.pointerId !== pointerId) return;
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest(".week-slot");
      slots.forEach((s) => s.classList.toggle("drag-over", s === target));
      e.preventDefault();
    });
    const finish = (e) => {
      if (!card || e.pointerId !== pointerId) return;
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest(".week-slot");
      const mealId = Number(card.dataset.mealId);
      card.classList.remove("dragging");
      slots.forEach((s) => s.classList.remove("drag-over"));
      card = null;
      pointerId = null;
      if (target && mealId) moveMealToDay(mealId, target.dataset.day);
    };
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  });
}

function renderPlanning() {
  renderWeekSlots("planningMeals", true);
}

function renderCooking() {
  const el = document.getElementById("cookToday");
  if (!el) return;

  const jsDays = [
    "Zondag",
    "Maandag",
    "Dinsdag",
    "Woensdag",
    "Donderdag",
    "Vrijdag",
    "Zaterdag",
  ];
  const today = jsDays[new Date().getDay()];
  const isSunday = today === "Zondag";
  const todayIndex = weekDays.indexOf(today);
  const orderedDays = isSunday
    ? ["Zondag"]
    : todayIndex >= 0
      ? weekDays.slice(todayIndex)
      : [...weekDays];

  let selectedDay = null;
  let plannedRecipes = [];

  for (const day of orderedDays) {
    const candidates = getMealsForDay(day, { includeDone: false })
      .map((meal) => ({
        meal,
        recipe: state.recipes.find(
          (r) => String(r.id) === String(meal.recipeId),
        ),
      }))
      .filter((item) => item.recipe);

    if (candidates.length) {
      selectedDay = day;
      plannedRecipes = candidates;
      break;
    }
  }

  if (!selectedDay) {
    el.innerHTML = isSunday
      ? '<div class="empty">Er staat voor vandaag geen gekoppeld recept gepland.</div>'
      : '<div class="empty">Er staat voor de rest van deze week geen gekoppeld recept meer gepland.</div>';
    return;
  }

  const isToday = selectedDay === today;
  const heading = isToday ? "Vandaag" : `Eerstvolgend: ${esc(selectedDay)}`;
  const totalRecipes = plannedRecipes.length;
  const completedRecipes = plannedRecipes.filter(({ meal }) =>
    cookDone.has(String(meal.id)),
  ).length;
  const progressPercent = totalRecipes
    ? Math.round((completedRecipes / totalRecipes) * 100)
    : 0;
  const countText =
    totalRecipes === 1
      ? "1 recept gepland"
      : `${totalRecipes} recepten gepland`;

  el.innerHTML = `
        <div class="cook-progress-summary">
          <div class="muted">${heading}</div>
          <h3 style="margin:4px 0">${countText}</h3>
          <div class="cook-progress-text">${completedRecipes} van ${totalRecipes} klaar</div>
          <div class="cook-progress" role="progressbar" aria-label="Kookvoortgang" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
            <span style="width:${progressPercent}%"></span>
          </div>
        </div>
        ${plannedRecipes
          .map(
            ({ meal, recipe }, index) => `
          <div class="cook-recipe${cookDone.has(String(meal.id)) ? " cook-session-done" : ""}"${index ? ' style="border-top:1px solid var(--line);padding-top:18px;margin-top:18px"' : ""}>
            <div class="topline">
              <div class="cook-check-title">
                <input
                  class="cook-check"
                  type="checkbox"
                  id="cook-check-${meal.id}"
                  ${cookDone.has(String(meal.id)) ? "checked" : ""}
                  onchange="toggleCookDone(${meal.id}, this.checked)"
                >
                <label for="cook-check-${meal.id}">
                  <h3 style="margin:4px 0">${esc(meal.name)}</h3>
                  ${meal.note ? `<div class="muted">${esc(meal.note)}</div>` : ""}
                </label>
              </div>
            </div>
            <div class="itemmeta">
              <span class="pill">${Number(recipe.portions) || 4} personen</span>
              <span class="pill">${(recipe.ingredients || []).length} ingrediënten</span>
            </div>
            <h4>Ingrediënten</h4>
            <ul>
              ${(recipe.ingredients || []).map((i) => `<li>${i.amount !== "" && i.amount !== null && i.amount !== undefined ? `${esc(i.amount)} ` : ""}${esc(i.unit || "")} ${esc(i.name || "")}</li>`).join("")}
            </ul>
            <h4>Bereiding</h4>
            <div class="cook-method">${esc(recipe.method || "Nog geen bereidingswijze ingevuld.")}</div>
            <div class="actions">
              <button class="btn secondary" onclick="viewRecipe(${recipe.id})">Recept groter openen</button>
              <button class="btn secondary" onclick="editRecipe(${recipe.id})">Recept wijzigen</button>
            </div>
          </div>
        `,
          )
          .join("")}`;
}

function markMealDone(id) {
  const meal = state.meals.find((x) => x.id === id);
  if (!meal) return;

  const recipe = state.recipes.find(
    (r) => String(r.id) === String(meal.recipeId),
  );
  const ingredientOptions = (recipe?.ingredients || [])
    .filter((i) => i.name)
    .map((i) => `<option value="${esc(i.name)}">${esc(i.name)}</option>`)
    .join("");

  modalTitle.textContent = "Maaltijd afronden";
  modalForm.dataset.type = "finishmeal";
  modalForm.dataset.mealId = String(id);
  modalForm.innerHTML = `<div class="formgrid">
   <div class="full">
     <label>Was de hoeveelheid goed?</label>
     <select name="portionResult" required>
       <option value="">Kies een beoordeling</option>
       <option value="Te weinig">Te weinig</option>
       <option value="Voldoende">Voldoende</option>
       <option value="Te veel">Te veel</option>
     </select>
   </div>

   <div class="full">
     <label>Notitie voor de volgende keer</label>
     <textarea name="portionNote" placeholder="Bijv. volgende keer 100 gram extra maken"></textarea>
   </div>

   <div class="full checkline">
     <input id="addCookHutsel" name="addToHutsel" type="checkbox">
     <label for="addCookHutsel">Iets naar Hutsel Frutsel verplaatsen</label>
   </div>

   <div class="full" id="cookHutselFields" style="display:none">
     <div class="formgrid">
       <div class="full">
         <label>Product of restje</label>
         ${
           ingredientOptions
             ? `<select name="hutselPreset"><option value="">Kies ingrediënt of vul zelf in</option>${ingredientOptions}</select>`
             : ""
         }
         <input name="hutselName" placeholder="Bijv. halve paprika of restje saus" style="margin-top:8px">
       </div>
       <div>
         <label>Hoeveelheid</label>
         <input name="hutselAmount" placeholder="Bijv. 200 gram">
       </div>
       <div>
         <label>Binnen hoeveel dagen gebruiken?</label>
         <input name="hutselDays" type="number" min="0" value="2">
       </div>
     </div>
   </div>

   <div class="full actions">
     <button class="btn" type="submit">Opslaan en afronden</button>
     <button class="btn secondary" type="button" onclick="closeModal()">Annuleren</button>
   </div>
 </div>`;

  const check = modalForm.querySelector('[name="addToHutsel"]');
  const fields = document.getElementById("cookHutselFields");
  check.addEventListener("change", () => {
    fields.style.display = check.checked ? "block" : "none";
  });

  const preset = modalForm.querySelector('[name="hutselPreset"]');
  const nameInput = modalForm.querySelector('[name="hutselName"]');
  if (preset && nameInput) {
    preset.addEventListener("change", () => {
      if (preset.value) nameInput.value = preset.value;
    });
  }

  modalback.classList.add("open");
}
