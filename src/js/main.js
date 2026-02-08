
let navLinks = document.querySelectorAll(".nav-link");

let searchFiltersSection = document.getElementById("search-filters-section");
let mealCategoriesSection = document.getElementById("meal-categories-section");
let allRecipesSection = document.getElementById("all-recipes-section");
let mealDetailsSection = document.getElementById("meal-details");
let productsSection = document.getElementById("products-section");
let foodlogSection = document.getElementById("foodlog-section");

let areasContainer = document.getElementById("areas-container");
let categoriesGrid = document.getElementById("categories-grid");
let recipesGrid = document.getElementById("recipes-grid");
let recipesCount = document.getElementById("recipes-count");
let searchInput = document.getElementById("search-input");

let gridViewBtn = document.getElementById("grid-view-btn");
let listViewBtn = document.getElementById("list-view-btn");

let overlay = document.getElementById("app-loading-overlay");
let backToMealsBtn = document.getElementById("back-to-meals-btn");
let logMealBtn = document.getElementById("log-meal-btn");

let loggedItemsList = document.getElementById("logged-items-list");
let clearFoodlogBtn = document.getElementById("clear-foodlog");

const USDA_API_KEY = "XCbEZ3EQzp3R1MRYda1lBhAfBKkOaNsemzNjvTOd";
;


let selectedArea = "";
let selectedCategory = "";
let currentView = "grid";
let currentLimit = 25;
let defaultSearch = "chicken";
let mealsData = [];
let currentMeal = null;

function setLoading(isLoading) {
  if (!overlay) return;
  overlay.style.display = isLoading ? "flex" : "none";
}

function hideAll() {
  if (searchFiltersSection) searchFiltersSection.style.display = "none";
  if (mealCategoriesSection) mealCategoriesSection.style.display = "none";
  if (allRecipesSection) allRecipesSection.style.display = "none";
  if (mealDetailsSection) mealDetailsSection.style.display = "none";
  if (productsSection) productsSection.style.display = "none";
  if (foodlogSection) foodlogSection.style.display = "none";
}

function showPage(page) {
  hideAll();

  if (page === "meals") {
    if (searchFiltersSection) searchFiltersSection.style.display = "block";
    if (mealCategoriesSection) mealCategoriesSection.style.display = "block";
    if (allRecipesSection) allRecipesSection.style.display = "block";
  } else if (page === "details") {
    if (mealDetailsSection) mealDetailsSection.style.display = "block";
  } else if (page === "products") {
    if (productsSection) productsSection.style.display = "block";
  } else if (page === "foodlog") {
    if (foodlogSection) foodlogSection.style.display = "block";
    renderFoodLog();
  }

  for (let i = 0; i < navLinks.length; i++) {
    navLinks[i].classList.remove("bg-emerald-50", "text-emerald-700");
    navLinks[i].classList.add("text-gray-600");
  }

  if (page === "meals" || page === "details") navLinks[0]?.classList.add("bg-emerald-50", "text-emerald-700");
  else if (page === "products") navLinks[1]?.classList.add("bg-emerald-50", "text-emerald-700");
  else if (page === "foodlog") navLinks[2]?.classList.add("bg-emerald-50", "text-emerald-700");
}

function normalizeInstructions(textOrArray) {
  if (Array.isArray(textOrArray)) return textOrArray;
  if (!textOrArray) return ["Delicious recipe to try!"];

  let parts = String(textOrArray)
    .split(/\r?\n+/)
    .join(" ")
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.length ? parts : ["Delicious recipe to try!"];
}


function buildMealCard(meal) {
  let name = meal.name ;
  let img = meal.thumbnail ;
  let category = meal.category || "Unknown";
  let area = meal.area || "Unknown";

  let steps = normalizeInstructions(meal.instructions);
  let desc = steps[0] || "Delicious recipe to try!";
  if (desc.length > 90) desc = desc.slice(0, 90) + "...";

  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
         onclick="openDetails('${meal.id}')">
      <div class="relative h-48 overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
             src="${img}" alt="${name}" loading="lazy" />
        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            ${category}
          </span>
          <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">
            ${area}
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
          ${name}
        </h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">${desc}</p>
      </div>
    </div>
  `;
}

function buildMealRow(meal) {
  let name = meal.name ;
  let img = meal.thumbnail ;
  let category = meal.category || "Unknown";
  let area = meal.area || "Unknown";

  let steps = normalizeInstructions(meal.instructions);
  let desc = steps[0] || "Delicious recipe to try!";
  if (desc.length > 140) desc = desc.slice(0, 140) + "...";

  return `
    <div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer group flex gap-4 p-4"
         onclick="openDetails('${meal.id}')">
      <div class="w-32 h-24 overflow-hidden rounded-lg shrink-0 bg-gray-100">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
             src="${img}" alt="${name}" loading="lazy" />
      </div>
      <div class="flex-1">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
            ${name}
          </h3>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-gray-100 text-xs font-semibold rounded-full text-gray-700">${category}</span>
            <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">${area}</span>
          </div>
        </div>
        <p class="text-xs text-gray-600 mt-1 line-clamp-2">${desc}</p>
      </div>
    </div>
  `;
}

function renderMeals(meals) {
  if (!recipesGrid) return;

  if (currentView === "grid") {
    recipesGrid.classList.add("grid", "grid-cols-4", "gap-5");
    recipesGrid.classList.remove("gap-3");
  } else {
    recipesGrid.classList.remove("grid-cols-4", "gap-5");
    recipesGrid.classList.add("grid", "gap-3");
  }

  let html = "";
  for (let i = 0; i < meals.length; i++) {
    html += currentView === "grid" ? buildMealCard(meals[i]) : buildMealRow(meals[i]);
  }

  recipesGrid.innerHTML = html || `<p class="col-span-4 text-center text-gray-500">No results</p>`;
  if (recipesCount) recipesCount.innerText = "Showing " + meals.length + " recipes";
}


async function loadMeals() {
  try {
    if (recipesGrid) recipesGrid.innerHTML = `<p class="col-span-4 text-center text-gray-500">Loading...</p>`;
    if (recipesCount) recipesCount.innerText = "Loading...";

    setLoading(true);

   let term = (searchInput && searchInput.value.trim())
  ? searchInput.value.trim()
  : defaultSearch;


    let url = "";

    if (term) {
      url =
        "https://nutriplan-api.vercel.app/api/meals/search?q=" +
        encodeURIComponent(term) +
        "&page=1&limit=" + currentLimit;
    } else if (selectedCategory || selectedArea) {
    
      url =
        "https://nutriplan-api.vercel.app/api/meals/filter?" +
        "category=" + encodeURIComponent(selectedCategory || "") +
        "&area=" + encodeURIComponent(selectedArea || "") +
        "&page=1&limit=" + currentLimit;
    } else {
     
      url =
        "https://nutriplan-api.vercel.app/api/meals/search?page=1&limit=" +
        currentLimit;
    }

    let res = await fetch(url);
    let data = await res.json();

    mealsData = data.results || [];
    renderMeals(mealsData);
    defaultSearch = "";
setLoading(false);
  } catch (err) {
    console.log(err);
    if (recipesGrid) recipesGrid.innerHTML = `<p class="col-span-4 text-center text-red-600">Error loading meals</p>`;
    if (recipesCount) recipesCount.innerText = "Showing 0 recipes";
    setLoading(false);
  } 
}

async function getAreas() {
  try {
    let res = await fetch("https://nutriplan-api.vercel.app/api/meals/areas");
    let data = await res.json();
    let areas = data.results ;

    let firstBtn = areasContainer ? areasContainer.querySelector("button") : null;
    if (firstBtn) {
      firstBtn.onclick = function () {
        selectedArea = "";
        selectedCategory = "";

        let buttons = document.querySelectorAll("#areas-container button");
        for (let i = 0; i < buttons.length; i++) {
          buttons[i].classList.remove("bg-emerald-600", "text-white");
          buttons[i].classList.add("bg-gray-100", "text-gray-700");
        }
        firstBtn.classList.add("bg-emerald-600", "text-white");

        loadMeals();
      };
    }

    
    let old = areasContainer ? areasContainer.querySelectorAll("button[data-area]") : [];
    old.forEach(b => b.remove());

    for (let i = 0; i < areas.length; i++) {
      let btn = document.createElement("button");
      btn.dataset.area = "1";
      btn.className = "px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm";
      btn.innerText = areas[i].name;

      btn.addEventListener("click", function () {
        selectedArea = areas[i].name;

      
        selectedCategory = "";
        let cards = document.querySelectorAll(".category-card");
        for (let k = 0; k < cards.length; k++) {
          cards[k].classList.remove("border-emerald-400", "shadow-md");
        }

        let buttons = document.querySelectorAll("#areas-container button");
        for (let j = 0; j < buttons.length; j++) {
          buttons[j].classList.remove("bg-emerald-600", "text-white");
          buttons[j].classList.add("bg-gray-100", "text-gray-700");
        }

        btn.classList.remove("bg-gray-100", "text-gray-700");
        btn.classList.add("bg-emerald-600", "text-white");

        loadMeals();
      });

      areasContainer.appendChild(btn);
    }
  } catch (err) {
    console.log("error in get areas function");
  }
}


async function getCategories() {
  try {
    let res = await fetch("https://nutriplan-api.vercel.app/api/meals/categories");
    let data = await res.json();
    let cats = data.results || [];

    let html = "";
    for (let i = 0; i < cats.length; i++) {
      let catName = cats[i].name;

      html += `
        <div class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
             onclick="selectCategory(this, '${catName}')">
          <div class="flex items-center gap-2.5">
            <div class="text-white w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <i class="fa-solid fa-utensils"></i>
            </div>
            <div><h3 class="text-sm font-bold text-gray-900">${catName}</h3></div>
          </div>
        </div>
      `;
    }

    categoriesGrid.innerHTML = html;
  } catch (err) {
    console.log("error in categories function");
  }
}

window.selectCategory = function (card, category) {
  selectedCategory = category;

  
  selectedArea = "";
  let buttons = document.querySelectorAll("#areas-container button");
  for (let j = 0; j < buttons.length; j++) {
    buttons[j].classList.remove("bg-emerald-600", "text-white");
    buttons[j].classList.add("bg-gray-100", "text-gray-700");
  }
 
  let firstBtn = areasContainer ? areasContainer.querySelector("button") : null;
  if (firstBtn) firstBtn.classList.add("bg-emerald-600", "text-white");

  let cards = document.querySelectorAll(".category-card");
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.remove("border-emerald-400", "shadow-md");
  }
  card.classList.add("border-emerald-400", "shadow-md");

  loadMeals();
};


function showDetailsOnly() {
  hideAll();
  if (mealDetailsSection) mealDetailsSection.style.display = "block";
}

function renderDetails(meal) {

  let heroImg = mealDetailsSection.querySelector(".relative img");
  if (heroImg) {
    heroImg.src = meal.thumbnail ;
    heroImg.alt = meal.name ;
  }


  let heroTitle = mealDetailsSection.querySelector("h1");
  if (heroTitle) heroTitle.innerText = meal.name ;


  let tagsBox = mealDetailsSection.querySelector(".absolute.bottom-0 .flex.items-center.gap-3");
  if (tagsBox) {
    let cat = meal.category || "Unknown";
    let area = meal.area || "Unknown";
    let extra = (meal.tags && meal.tags.length > 0) ? meal.tags[0] : "Recipe";
    tagsBox.innerHTML = `
      <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${cat}</span>
      <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${area}</span>
      <span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${extra}</span>
    `;
  }

  if (logMealBtn) {
    logMealBtn.setAttribute("data-meal-id", meal.id);
    logMealBtn.dataset.name = meal.name ;
    logMealBtn.dataset.thumbnail = meal.thumbnail ;
  }


  let ingredientsTitle = mealDetailsSection.querySelector(".fa-list-check")?.closest("h2");
  let ingredientsGrid = mealDetailsSection.querySelector(".fa-list-check")?.closest("div")?.querySelector(".grid");
  let ing = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  if (ingredientsTitle) {
    let spanCount = ingredientsTitle.querySelector("span");
    if (spanCount) spanCount.innerText = ing.length + " items";
  }

  if (ingredientsGrid) {
    let html = "";
    for (let i = 0; i < ing.length; i++) {
      html += `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
          <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
          <span class="text-gray-700">
            <span class="font-medium text-gray-900">${ing[i].measure || ""}</span>
            ${ing[i].ingredient || ""}
          </span>
        </div>
      `;
    }
    ingredientsGrid.innerHTML = html || `<p class="text-gray-500">No ingredients</p>`;
  }

  
  let instructionsBox = mealDetailsSection.querySelector(".fa-shoe-prints")?.closest("div")?.querySelector(".space-y-4");
  if (instructionsBox) {
    let steps = normalizeInstructions(meal.instructions);
    let html = "";
    for (let i = 0; i < steps.length; i++) {
      html += `
        <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            ${i + 1}
          </div>
          <p class="text-gray-700 leading-relaxed pt-2">${steps[i]}</p>
        </div>
      `;
    }
    instructionsBox.innerHTML = html;
  }

  
  let iframe = mealDetailsSection.querySelector("iframe");
  if (iframe) {
    if (meal.youtube && String(meal.youtube).includes("youtube")) {
      let embed = String(meal.youtube).replace("watch?v=", "embed/");
      iframe.src = embed;
    } else {
      iframe.src = "";
    }
  }
}

async function getMealById(id) {
  let res = await fetch("https://nutriplan-api.vercel.app/api/meals/" + encodeURIComponent(id));
  let data = await res.json();
  return data; 
}

function buildIngredientLines(meal) {
  
  let ing = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  let lines = [];

  for (let i = 0; i < ing.length; i++) {
    let m = (ing[i].measure || "").trim();
    let n = (ing[i].ingredient || "").trim();
    let line = (m + " " + n).trim();
    if (line) lines.push(line);
  }
  return lines;
}

async function analyzeNutrition(meal) {
  let ingredientLines = buildIngredientLines(meal);

  
  if (!ingredientLines.length) return null;

  let res = await fetch("https://nutriplan-api.vercel.app/api/nutrition/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": USDA_API_KEY 
    },
    body: JSON.stringify({
      recipeName: meal.name || "Recipe",
      ingredients: ingredientLines
    })
  });

  let data = await res.json();


  if (res.status === 401 || String(data?.message || "").toLowerCase().includes("invalid")) {
    alert("Invalid API Key");
    return null;
  }

  
  if (!data || !data.data || !data.data.perServing) {
    console.log("Nutrition not available");
    return null;
  }

  return data.data; 
}


function findMetricRow(container, label) {
  let rows = container.querySelectorAll(".flex.items-center.justify-between");
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    let labelSpan = row.querySelector("span.text-gray-700");
    if (!labelSpan) continue;

    if (labelSpan.innerText.trim().toLowerCase() === label.toLowerCase()) {
      let valueSpan = row.querySelector("span.font-bold");
      let barWrap = row.nextElementSibling;
      let bar = barWrap ? barWrap.querySelector("div") : null;
      return { valueSpan, bar };
    }
  }
  return null;
}

function clampPercent(x) {
  if (x < 0) return 0;
  if (x > 100) return 100;
  return x;
}

function updateNutritionUI(nutri) {
  let container = document.getElementById("nutrition-facts-container");
  if (!container) return;

  let totals = nutri?.totals || {};
  let per = nutri?.perServing || {};

  let calBig = container.querySelector(".text-center .text-4xl");
  if (calBig) calBig.innerText = per.calories ?? 0;


  let calTotalLine = container.querySelector(".text-center .text-xs");
  if (calTotalLine) calTotalLine.innerText = "Total: " + (totals.calories ?? 0) + " cal";

 
  let targets = { protein: 50, carbs: 275, fat: 78, fiber: 28, sugar: 50 };

  function setMetric(label, value, unit, targetKey) {
    let row = findMetricRow(container, label);
    if (!row) return;

    let v = Number(value || 0);
    if (row.valueSpan) row.valueSpan.innerText = v + unit;

    if (row.bar) {
      let t = targets[targetKey] || 100;
      let pct = t > 0 ? (v / t) * 100 : 0;
      row.bar.style.width = clampPercent(pct) + "%";
    }
  }

  setMetric("Protein", per.protein, "g", "protein");
  setMetric("Carbs", per.carbs, "g", "carbs");
  setMetric("Fat", per.fat, "g", "fat");
  setMetric("Fiber", per.fiber, "g", "fiber");
  setMetric("Sugar", per.sugar, "g", "sugar");
}

window.openDetails = async function (id) {
  try {
    setLoading(true);

    let mealData = await getMealById(id);


    let meal = mealData.data ? mealData.data : mealData;


    let listItem = mealsData.find(m => String(m.id) === String(id));
    currentMeal = { ...(listItem || {}), ...(meal || {}) };

    renderDetails(currentMeal);
    showDetailsOnly();

let nutri = await analyzeNutrition(currentMeal);

if (nutri) {
  currentMeal.totals = nutri.totals;
  currentMeal.perServing = nutri.perServing;

  updateNutritionUI(nutri);

  if (logMealBtn) {
    logMealBtn.dataset.calories = currentMeal.perServing?.calories ?? 0;
    logMealBtn.dataset.protein = currentMeal.perServing?.protein ?? 0;
    logMealBtn.dataset.carbs = currentMeal.perServing?.carbs ?? 0;
    logMealBtn.dataset.fat = currentMeal.perServing?.fat ?? 0;
  }
} else {
 
  updateNutritionUI({ totals: {}, perServing: {} });
}


    if (logMealBtn) {
      logMealBtn.dataset.calories = currentMeal.perServing?.calories ?? 0;
      logMealBtn.dataset.protein = currentMeal.perServing?.protein ?? 0;
      logMealBtn.dataset.carbs = currentMeal.perServing?.carbs ?? 0;
      logMealBtn.dataset.fat = currentMeal.perServing?.fat ?? 0;
    }
    setLoading(false);
  } catch (e) {
    console.log(e);
    alert("error in openDetails function");
    setLoading(false);
  } 
};

function getFoodLog() {
  let x = localStorage.getItem("foodLog");
  return x ? JSON.parse(x) : [];
}

function saveFoodLog(arr) {
  localStorage.setItem("foodLog", JSON.stringify(arr));
}

function renderFoodLog() {
  let log = getFoodLog();
  if (!loggedItemsList) return;

  if (log.length === 0) {
    loggedItemsList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
        <p class="font-medium">No meals logged today</p>
        <p class="text-sm">Add meals from the Meals page</p>
      </div>
    `;
    if (clearFoodlogBtn) clearFoodlogBtn.style.display = "none";
    return;
  }

  if (clearFoodlogBtn) clearFoodlogBtn.style.display = "block";

  let html = "";
  for (let i = 0; i < log.length; i++) {
    html += `
      <div class="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
        <img src="${log[i].thumbnail || ""}" class="w-14 h-12 object-cover rounded-lg bg-white" />
        <div class="flex-1">
          <p class="font-semibold text-gray-900 text-sm">${log[i].name}</p>
          <p class="text-xs text-gray-600">
            ${log[i].calories || 0} cal • P ${log[i].protein || 0}g • C ${log[i].carbs || 0}g • F ${log[i].fat || 0}g
          </p>
        </div>
      </div>
    `;
  }

  loggedItemsList.innerHTML = html;
}

if (logMealBtn) {
  logMealBtn.addEventListener("click", async function () {
    if (!currentMeal || !currentMeal.perServing) return;

    let per = currentMeal.perServing;

    let perCal = Number(per.calories );
    let perProtein = Number(per.protein );
    let perCarbs = Number(per.carbs );
    let perFat = Number(per.fat );

    let servings = 1;

    function calc() {
      return {
        cal: Math.round(perCal * servings),
        p: Math.round(perProtein * servings),
        c: Math.round(perCarbs * servings),
        f: Math.round(perFat * servings)
      };
    }

    function totalsHTML() {
      const t = calc();
      return `
        <div style="background:#ecfdf5;border-radius:14px;padding:14px;margin-top:14px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:12px;text-align:left;">
            Estimated nutrition per serving:
          </div>

          <div style="display:flex;justify-content:space-between;gap:10px;text-align:center;">
            <div style="flex:1;">
              <div id="sw-cals" style="font-size:22px;font-weight:800;color:#10b981;line-height:1;">${t.cal}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Calories</div>
            </div>

            <div style="flex:1;">
              <div id="sw-protein" style="font-size:22px;font-weight:800;color:#2563eb;line-height:1;">${t.p}g</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Protein</div>
            </div>

            <div style="flex:1;">
              <div id="sw-carbs" style="font-size:22px;font-weight:800;color:#f59e0b;line-height:1;">${t.c}g</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Carbs</div>
            </div>

            <div style="flex:1;">
              <div id="sw-fat" style="font-size:22px;font-weight:800;color:#a855f7;line-height:1;">${t.f}g</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Fat</div>
            </div>
          </div>
        </div>
      `;
    }

    const result = await Swal.fire({
      title: "Log This Meal",
      html: `
        <div style="display:flex;gap:12px;align-items:center;justify-content:flex-start;margin-bottom:10px;">
          <img src="${currentMeal.thumbnail || ""}"
               style="width:42px;height:42px;border-radius:10px;object-fit:cover;" />
          <div style="text-align:left;">
            <div style="font-weight:800;color:#111827;line-height:1.15;">
              ${currentMeal.name || "Meal"}
            </div>
          </div>
        </div>

        <div style="text-align:left;font-size:12px;color:#6b7280;margin:10px 0 8px;">
          Number of Servings
        </div>

        <div style="display:flex;align-items:center;gap:10px;justify-content:flex-start;">
          <button id="sw-minus" type="button"
            style="width:44px;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:#f3f4f6;font-size:20px;font-weight:800;">
            −
          </button>

          <input id="sw-servings" value="1" readonly
            style="width:70px;height:40px;border-radius:10px;border:1px solid #e5e7eb;text-align:center;font-size:16px;font-weight:800;background:#fff;" />

          <button id="sw-plus" type="button"
            style="width:44px;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:#f3f4f6;font-size:20px;font-weight:800;">
            +
          </button>
        </div>

        <div id="sw-totals">${totalsHTML()}</div>
      `,
      showCancelButton: true,
      confirmButtonText: "Log Meal",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#e5e7eb",
      focusConfirm: false,
      didOpen: () => {
        const minus = document.getElementById("sw-minus");
        const plus = document.getElementById("sw-plus");
        const input = document.getElementById("sw-servings");
        const totalsBox = document.getElementById("sw-totals");

        function refresh() {
          input.value = String(servings);
          totalsBox.innerHTML = totalsHTML();
        }

        minus.addEventListener("click", () => {
          if (servings > 1) {
            servings--;
            refresh();
          }
        });

        plus.addEventListener("click", () => {
          servings++;
          refresh();
        });
      },
      preConfirm: () => servings
    });

    if (!result.isConfirmed) return;

    const chosenServings = result.value || 1;

    
    const logged = {
      calories: Math.round(perCal * chosenServings),
      protein: Math.round(perProtein * chosenServings),
      carbs: Math.round(perCarbs * chosenServings),
      fat: Math.round(perFat * chosenServings)
    };

    let log = getFoodLog();
    log.push({
      type: "meal",
      id: currentMeal.id,
      name: currentMeal.name ,
      thumbnail: currentMeal.thumbnail ,
      servings: chosenServings,
      ...logged,
      date: new Date().toISOString().split("T")[0]
    });
    saveFoodLog(log);

Swal.fire({
  icon: "success",
  title: "Meal Logged!",
  html: `
    <div style="font-size:14px;color:#6b7280;margin-top:6px;">
      <span style="font-weight:700;color:#111827;">
        ${currentMeal.name || "Meal"}
      </span>
      (${chosenServings} serving${chosenServings > 1 ? "s" : ""})
      has been added to your daily log.
    </div>

    <div style="margin-top:10px;font-weight:800;color:#10b981;font-size:16px;">
      +${logged.calories} calories
    </div>
  `,
  timer: 2000,
  timerProgressBar: true,
  showConfirmButton: false
});


  });
}


if (clearFoodlogBtn) {
  clearFoodlogBtn.addEventListener("click", function () {
    localStorage.removeItem("foodLog");
    renderFoodLog();
  });
}


if (navLinks.length >= 3) {
  navLinks[0].addEventListener("click", function (e) {
    e.preventDefault();
    showPage("meals");
  });
  navLinks[1].addEventListener("click", function (e) {
    e.preventDefault();
    showPage("products");
  });
  navLinks[2].addEventListener("click", function (e) {
    e.preventDefault();
    showPage("foodlog");
  });
}

if (backToMealsBtn) {
  backToMealsBtn.addEventListener("click", function () {
    showPage("meals");
  });
}

let searchTimer = null;
if (searchInput) {
  searchInput.addEventListener("keyup", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      
      loadMeals();
    }, 500);
  });
}

if (gridViewBtn && listViewBtn) {
  gridViewBtn.addEventListener("click", function () {
    currentView = "grid";
    renderMeals(mealsData);
  });

  listViewBtn.addEventListener("click", function () {
    currentView = "list";
    renderMeals(mealsData);
  });
}


(function () {
  const productSearchInput = document.getElementById("product-search-input");
  const searchProductBtn = document.getElementById("search-product-btn");

  const barcodeInput = document.getElementById("barcode-input");
  const lookupBarcodeBtn = document.getElementById("lookup-barcode-btn");

  const productsGrid = document.getElementById("products-grid");
  const productsCount = document.getElementById("products-count");
  const productsEmpty = document.getElementById("products-empty");

  const nutriBtns = document.querySelectorAll(".nutri-score-filter");
  const categoryBtns = document.querySelectorAll(".product-category-btn");

  let lastProducts = [];
  let selectedNutri = "";       
  let selectedCategoryTag = ""; 

  function showEmpty() {
    if (productsGrid) productsGrid.innerHTML = "";
    if (productsEmpty) productsEmpty.classList.remove("hidden");
    if (productsCount) productsCount.innerText = "Search for products to see results";
  }

  function hideEmpty() {
    if (productsEmpty) productsEmpty.classList.add("hidden");
  }

  function categoryToTag(btnText) {
    const t = (btnText || "").toLowerCase();
    if (t.includes("snack")) return "snacks";
    if (t.includes("beverage")) return "beverages";
    if (t.includes("breakfast")) return "breakfast";
    if (t.includes("dessert")) return "dessert";
    if (t.includes("dairy")) return "dairy";
    return "";
  }

  function safeNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  function pickImg(p) {
    return (
      p.image_front_url ||
      p.image_url ||
      p.image_front_small_url ||
      "https://via.placeholder.com/300x200?text=No+Image"
    );
  }

  function applyLocalFilters(list) {
    let out = Array.isArray(list) ? list.slice() : [];

    if (selectedNutri) {
      out = out.filter((p) => String(p.nutriscore_grade || "").toLowerCase() === selectedNutri);
    }

    if (selectedCategoryTag) {
      out = out.filter((p) => {
        const tags = p.categories_tags || p.categories_tags_en || [];
        if (!Array.isArray(tags)) return false;
        return tags.some((x) => String(x).toLowerCase().includes(selectedCategoryTag));
      });
    }

    return out;
  }

  function renderProductsLocal(list) {
    if (!productsGrid) return;

    const filtered = applyLocalFilters(list);

    if (!filtered.length) {
      showEmpty();
      return;
    }

    hideEmpty();
    if (productsCount) productsCount.innerText = `Showing ${filtered.length} products`;

    let html = "";
    for (let i = 0; i < filtered.length; i++) {
      const p = filtered[i];

      const name = p.product_name || p.product_name_en || "Product";
      const brand = p.brands || "Unknown Brand";
      const img = pickImg(p);
      const code = p.code || p._id || "";

      const nutri = String(p.nutriscore_grade || "").toUpperCase();
      const nova = p.nova_group ? String(p.nova_group) : "";

      const kcal100 = safeNum(p.nutriments?.["energy-kcal_100g"]);
      const protein100 = safeNum(p.nutriments?.proteins_100g);
      const carbs100 = safeNum(p.nutriments?.carbohydrates_100g);
      const fat100 = safeNum(p.nutriments?.fat_100g);
      const sugar100 = safeNum(p.nutriments?.sugars_100g);

      html += `
        <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
             data-barcode="${code}">
          <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
            <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                 src="${img}" alt="${name}" loading="lazy" />

            ${
              nutri
                ? `<div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                    Nutri-Score ${nutri}
                  </div>`
                : ""
            }

            ${
              nova
                ? `<div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                     title="NOVA ${nova}">
                    ${nova}
                  </div>`
                : ""
            }
          </div>

          <div class="p-4">
            <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${brand}</p>
            <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
              ${name}
            </h3>

            <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span><i class="fa-solid fa-fire mr-1"></i>${kcal100 ? `${kcal100} kcal/100g` : "—"}</span>
            </div>

            <div class="grid grid-cols-4 gap-1 text-center">
              <div class="bg-emerald-50 rounded p-1.5">
                <p class="text-xs font-bold text-emerald-700">${protein100 ? `${protein100}g` : "—"}</p>
                <p class="text-[10px] text-gray-500">Protein</p>
              </div>
              <div class="bg-blue-50 rounded p-1.5">
                <p class="text-xs font-bold text-blue-700">${carbs100 ? `${carbs100}g` : "—"}</p>
                <p class="text-[10px] text-gray-500">Carbs</p>
              </div>
              <div class="bg-purple-50 rounded p-1.5">
                <p class="text-xs font-bold text-purple-700">${fat100 ? `${fat100}g` : "—"}</p>
                <p class="text-[10px] text-gray-500">Fat</p>
              </div>
              <div class="bg-orange-50 rounded p-1.5">
                <p class="text-xs font-bold text-orange-700">${sugar100 ? `${sugar100}g` : "—"}</p>
                <p class="text-[10px] text-gray-500">Sugar</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    productsGrid.innerHTML = html;
  }


  async function searchOFF(term) {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1" +
      "&page_size=24" +
      "&fields=code,product_name,product_name_en,brands,image_front_url,image_url,image_front_small_url,nutriscore_grade,nova_group,categories,categories_tags,nutriments,quantity,ingredients_text" +
      "&search_terms=" +
      encodeURIComponent(term);

    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  }

  async function barcodeOFF(code) {
    const url =
      "https://world.openfoodfacts.org/api/v2/product/" +
      encodeURIComponent(code) +
      "?fields=code,product_name,product_name_en,brands,image_front_url,image_url,image_front_small_url,nutriscore_grade,nova_group,categories,categories_tags,nutriments,quantity,ingredients_text";

    const res = await fetch(url);
    const data = await res.json();
    if (data && data.product) return [data.product];
    return [];
  }

  function getFoodLog() {
    const x = localStorage.getItem("foodLog");
    return x ? JSON.parse(x) : [];
  }
  function saveFoodLog(arr) {
    localStorage.setItem("foodLog", JSON.stringify(arr));
  }

  function productModal(p) {
    const name = p.product_name || p.product_name_en || "Product";
    const brand = p.brands || "Unknown Brand";
    const img = pickImg(p);

    const nutri = String(p.nutriscore_grade || "").toUpperCase();
    const kcal100 = safeNum(p.nutriments?.["energy-kcal_100g"]);
    const protein100 = safeNum(p.nutriments?.proteins_100g);
    const carbs100 = safeNum(p.nutriments?.carbohydrates_100g);
    const fat100 = safeNum(p.nutriments?.fat_100g);
    const sugar100 = safeNum(p.nutriments?.sugars_100g);

    const html = `
      <div style="display:flex;gap:12px;align-items:center;justify-content:flex-start;">
        <img src="${img}" style="width:52px;height:52px;border-radius:12px;object-fit:cover;background:#f3f4f6;" />
        <div style="text-align:left;">
          <div style="font-weight:900;color:#111827;line-height:1.2;">${name}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">${brand}</div>
          ${nutri ? `<div style="font-size:12px;margin-top:6px;"><b>Nutri-Score:</b> ${nutri}</div>` : ""}
        </div>
      </div>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin-top:14px;text-align:left;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:10px;">Nutrition (per 100g)</div>

        <div style="display:flex;justify-content:space-between;gap:10px;text-align:center;">
          <div style="flex:1;">
            <div style="font-size:20px;font-weight:900;color:#10b981;line-height:1;">${kcal100 || 0}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Calories</div>
          </div>

          <div style="flex:1;">
            <div style="font-size:20px;font-weight:900;color:#2563eb;line-height:1;">${protein100 || 0}g</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Protein</div>
          </div>

          <div style="flex:1;">
            <div style="font-size:20px;font-weight:900;color:#f59e0b;line-height:1;">${carbs100 || 0}g</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Carbs</div>
          </div>

          <div style="flex:1;">
            <div style="font-size:20px;font-weight:900;color:#a855f7;line-height:1;">${fat100 || 0}g</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;">Fat</div>
          </div>
        </div>

        <div style="margin-top:10px;font-size:12px;color:#6b7280;text-align:center;">
          Sugar: <b style="color:#111827">${sugar100 || 0}g</b>
        </div>
      </div>
    `;

    if (!window.Swal) {
      const ok = confirm(`${name}\n${brand}\nCalories/100g: ${kcal100 || 0}\n\nLog this product?`);
      return Promise.resolve({ isConfirmed: ok });
    }

    return Swal.fire({
      title: "Product Details",
      html,
      showCancelButton: true,
      confirmButtonText: "Log This Product",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#e5e7eb",
      focusConfirm: false
    });
  }

  async function onProductClick(card) {
    const code = card.getAttribute("data-barcode");
    const p = lastProducts.find((x) => String(x.code || x._id) === String(code)) || null;
    if (!p) return;

    const result = await productModal(p);
    if (!result.isConfirmed) return;

    const kcal100 = safeNum(p.nutriments?.["energy-kcal_100g"]);
    const protein100 = safeNum(p.nutriments?.proteins_100g);
    const carbs100 = safeNum(p.nutriments?.carbohydrates_100g);
    const fat100 = safeNum(p.nutriments?.fat_100g);

    const log = getFoodLog();
    log.push({
      type: "product",
      id: p.code || "",
      name: p.product_name || p.product_name_en || "Product",
      thumbnail: pickImg(p),
      calories: kcal100,
      protein: protein100,
      carbs: carbs100,
      fat: fat100,
      date: new Date().toISOString().split("T")[0]
    });
    saveFoodLog(log);

    if (window.Swal) {
      Swal.fire({
        icon: "success",
        title: "Added to Food Log!",
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      alert("Added to Food Log ✅");
    }
  }

  if (productsGrid) {
    productsGrid.addEventListener("click", function (e) {
      const card = e.target.closest(".product-card");
      if (!card) return;
      onProductClick(card);
    });
  }


  for (let i = 0; i < nutriBtns.length; i++) {
    nutriBtns[i].addEventListener("click", function () {
      selectedNutri = String(this.dataset.grade || "").toLowerCase();
      renderProductsLocal(lastProducts);
    });
  }


  for (let i = 0; i < categoryBtns.length; i++) {
    categoryBtns[i].addEventListener("click", async function () {
      const tag = categoryToTag(this.innerText) || this.innerText.trim();
      selectedCategoryTag = categoryToTag(this.innerText) || "";

      try {
        if (productsCount) productsCount.innerText = "Loading...";
        hideEmpty();
        if (productsGrid) productsGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">Loading...</p>`;

        const data = await searchOFF(tag);
        lastProducts = data;

        renderProductsLocal(lastProducts);
      } catch (err) {
        console.log(err);
        showEmpty();
      }
    });
  }

  
  if (searchProductBtn && productSearchInput) {
    searchProductBtn.addEventListener("click", async function () {
      const term = productSearchInput.value.trim();
      if (!term) return;

      selectedCategoryTag = "";
      try {
        if (productsCount) productsCount.innerText = "Loading...";
        hideEmpty();
        if (productsGrid) productsGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">Loading...</p>`;

        const data = await searchOFF(term);
        lastProducts = data;

        renderProductsLocal(lastProducts);
      } catch (err) {
        console.log(err);
        showEmpty();
      }
    });
  }


  if (lookupBarcodeBtn && barcodeInput) {
    lookupBarcodeBtn.addEventListener("click", async function () {
      const code = barcodeInput.value.trim();
      if (!code) return;

      selectedCategoryTag = "";
      try {
        if (productsCount) productsCount.innerText = "Loading...";
        hideEmpty();
        if (productsGrid) productsGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">Loading...</p>`;

        const data = await barcodeOFF(code);
        lastProducts = data;

        renderProductsLocal(lastProducts);
      } catch (err) {
        console.log(err);
        showEmpty();
      }
    });
  }

  showEmpty();
})();

(function () {
  const foodlogSection = document.getElementById("foodlog-section");
  if (!foodlogSection) return;

  const foodlogDateEl = document.getElementById("foodlog-date");
  const listEl = document.getElementById("logged-items-list");
  const clearBtn = document.getElementById("clear-foodlog");
  const weeklyBox = document.getElementById("weekly-chart");

  const TARGETS = {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65
  };

 
  function getFoodLog() {
    const x = localStorage.getItem("foodLog");
    return x ? JSON.parse(x) : [];
  }
  function saveFoodLog(arr) {
    localStorage.setItem("foodLog", JSON.stringify(arr));
  }


  function dayKey(d) {
    return new Date(d).toISOString().split("T")[0]; 
  }
  function todayKey() {
    return dayKey(new Date());
  }
  function formatHeaderDate() {
    
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "2-digit"
    });
  }
  function formatTimeFromItem(it) {
    
    if (it.time) return it.time;

  
    if (it.loggedAt) {
      const d = new Date(it.loggedAt);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }


    return "";
  }

 
  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  function clampPct(x) {
    if (x < 0) return 0;
    if (x > 100) return 100;
    return x;
  }
  function sumDay(items) {
    let cals = 0, p = 0, c = 0, f = 0;
    for (let i = 0; i < items.length; i++) {
      cals += num(items[i].calories);
      p += num(items[i].protein);
      c += num(items[i].carbs);
      f += num(items[i].fat);
    }
    return {
      calories: Math.round(cals),
      protein: Math.round(p),
      carbs: Math.round(c),
      fat: Math.round(f)
    };
  }

  function getProgressCards() {
    
    const box = document.getElementById("foodlog-today-section");
    if (!box) return [];
    return box.querySelectorAll(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 > div");
  }

  function setCard(card, label, value, target) {
   
    const headerRow = card.querySelector(".flex.items-center.justify-between");
    const labelSpan = headerRow ? headerRow.querySelector("span.text-sm.font-semibold") : null;
    const rightSpan = headerRow ? headerRow.querySelector("span.text-sm.text-gray-500") : null;

    const bar = card.querySelector(".w-full.bg-gray-200 > div");

    const pct = target > 0 ? Math.round((value / target) * 100) : 0;
    const pctText = pct >= 100 ? "100%" : pct + "%";

  
    let barColor = "#ef4444"; 
    let pctColor = "#ef4444";

    if (label === "Carbs") {
      if (pct < 100) {
        barColor = "#f59e0b"; 
        pctColor = "#f59e0b";
      }
    }

   
    let unit = "";
    if (label === "Calories") unit = "kcal";
    else unit = "g";

  
    if (labelSpan) labelSpan.innerText = label;

  
    if (rightSpan) {
      rightSpan.innerHTML = `<span style="color:${pctColor};font-weight:800;">${pctText}</span>`;
    }


    if (bar) {
      bar.style.width = clampPct(target ? (value / target) * 100 : 0) + "%";
      bar.style.backgroundColor = barColor;
    }

    let bottom = card.querySelector(".foodlog-bottom-line");
    if (!bottom) {
      bottom = document.createElement("div");
      bottom.className = "foodlog-bottom-line mt-2 flex items-center justify-between text-sm";
      card.appendChild(bottom);
    }

    const leftVal = `${value} ${unit}`;
    const rightVal = `/ ${target} ${unit}`;

    bottom.innerHTML = `
      <span style="font-weight:800;color:${pct >= 100 ? "#ef4444" : "#111827"}">${leftVal}</span>
      <span style="color:#9ca3af;font-weight:700">${rightVal}</span>
    `;
  }

  function setLoggedHeader(count) {
    const box = document.getElementById("foodlog-today-section");
    if (!box) return;

    const h4 = box.querySelector("h4.text-sm.font-semibold.text-gray-700");
    if (h4) h4.innerText = `Logged Items (${count})`;
  }

  function renderLoggedItems(todayItems, fullLog) {
    if (!listEl) return;

    if (!todayItems.length) {
      listEl.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <div class="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <i class="fa-solid fa-utensils text-3xl text-gray-400"></i>
          </div>
          <p class="font-semibold">No meals logged today</p>
          <p class="text-sm">Add meals from the Meals page or scan products</p>
        </div>
      `;
      return;
    }

    let html = "";
    for (let i = 0; i < todayItems.length; i++) {
      const it = todayItems[i];
      const name = it.name || "Item";
      const img = it.thumbnail || "";
      const servings = it.servings ? `${it.servings} serving${it.servings > 1 ? "s" : ""}` : "";
      const type = it.type === "product" ? "Product" : "Recipe";
      const time = formatTimeFromItem(it);

      const kcal = Math.round(num(it.calories));
      const p = Math.round(num(it.protein));
      const c = Math.round(num(it.carbs));
      const f = Math.round(num(it.fat));

     
      const storageIndex = it.__idx; 

      html += `
        <div class="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img src="${img}" class="w-14 h-14 rounded-xl object-cover bg-gray-100" />
            <div>
              <div class="font-bold text-gray-900">${name}</div>
              <div class="text-sm text-gray-500">
                ${servings ? `<span>${servings}</span> • ` : ""}<span class="text-emerald-600 font-semibold">${type}</span>
              </div>
              ${time ? `<div class="text-xs text-gray-400 mt-1">${time}</div>` : ""}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-emerald-600 font-extrabold text-xl leading-none">${kcal}</div>
              <div class="text-gray-500 text-sm -mt-0.5">kcal</div>
            </div>

            <span class="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">${p}g P</span>
            <span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">${c}g C</span>
            <span class="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">${f}g F</span>

            <button class="foodlog-delete-btn text-gray-400 hover:text-red-500 px-2"
                    data-del-idx="${storageIndex}"
                    title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;

    const delBtns = listEl.querySelectorAll(".foodlog-delete-btn");
    for (let b = 0; b < delBtns.length; b++) {
      delBtns[b].addEventListener("click", function () {
        const idx = Number(this.dataset.delIdx);
        if (!Number.isFinite(idx)) return;

        const log = getFoodLog();
        log.splice(idx, 1);
        saveFoodLog(log);

        if (window.Swal) {
          Swal.fire({
            icon: "success",
            title: "Removed!",
            timer: 1200,
            showConfirmButton: false
          });
        }

        window.renderFoodLog();
      });
    }
  }

  function buildWeekDays() {
    const out = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      out.push(d);
    }
    return out;
  }

  function renderWeekly(log) {
  if (!weeklyBox) return;

  const days = buildWeekDays();
  const map = {};
  for (let i = 0; i < log.length; i++) {
    const k = log[i].date;
    if (!k) continue;
    if (!map[k]) map[k] = { kcal: 0, count: 0 };
    map[k].kcal += num(log[i].calories);
    map[k].count += 1;
  }

  const today = todayKey();

  let html = `
    <div class="w-full overflow-x-auto">
      <div class="flex gap-3 min-w-max">
  `;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const k = dayKey(d);
    const info = map[k] || { kcal: 0, count: 0 };

    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();

    const kcal = Math.round(info.kcal);
    const cnt = info.count;

    const isToday = k === today;

    html += `
      <div class="${isToday ? "bg-indigo-100 border-indigo-200" : "bg-gray-50 border-gray-200"} 
                  border rounded-2xl px-5 py-4 text-center shrink-0"
           style="width: 125px;">
        <div class="text-xs font-semibold text-gray-500">${dayName}</div>
        <div class="text-sm font-bold text-gray-900">${dayNum}</div>

        <div class="mt-3 ${kcal ? "text-emerald-600" : "text-gray-300"} font-extrabold text-xl leading-none">
          ${kcal || 0}
        </div>
        <div class="text-xs ${kcal ? "text-emerald-600" : "text-gray-300"} font-semibold">kcal</div>

        <div class="mt-2 text-xs text-gray-400">${cnt} item${cnt !== 1 ? "s" : ""}</div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  weeklyBox.innerHTML = html;
}

  function ensureStatsRow() {
 
    const wrapper = weeklyBox ? weeklyBox.closest(".bg-white") : null;
    if (!wrapper) return null;

    let stats = document.getElementById("foodlog-stats-row");
    if (stats) return stats;

    stats = document.createElement("div");
    stats.id = "foodlog-stats-row";
    stats.className = "grid grid-cols-1 md:grid-cols-3 gap-4 mt-6";

    stats.innerHTML = `
      <div class="bg-white rounded-2xl p-5 border-2 border-gray-200 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
          <i class="fa-solid fa-chart-line text-emerald-600 text-xl"></i>
        </div>
        <div>
          <div class="text-sm text-gray-500 font-semibold">Weekly Average</div>
          <div class="text-2xl font-extrabold text-gray-900" id="weekly-avg-kcal">0 kcal</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border-2 border-gray-200 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <i class="fa-solid fa-utensils text-blue-600 text-xl"></i>
        </div>
        <div>
          <div class="text-sm text-gray-500 font-semibold">Total Items This Week</div>
          <div class="text-2xl font-extrabold text-gray-900" id="weekly-items-count">0 items</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border-2 border-gray-200 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <i class="fa-solid fa-bullseye text-purple-600 text-xl"></i>
        </div>
        <div>
          <div class="text-sm text-gray-500 font-semibold">Days On Goal</div>
          <div class="text-2xl font-extrabold text-gray-900" id="days-on-goal">0/7</div>
        </div>
      </div>
    `;

   
    wrapper.parentElement.insertBefore(stats, wrapper.nextElementSibling);
    return stats;
  }

  function updateStats(log) {
    const days = buildWeekDays().map(dayKey);
    let totalWeekCals = 0;
    let totalItems = 0;

    const perDay = {};
    for (let i = 0; i < log.length; i++) {
      const k = log[i].date;
      if (!k || !days.includes(k)) continue;

      totalWeekCals += num(log[i].calories);
      totalItems += 1;

      if (!perDay[k]) perDay[k] = 0;
      perDay[k] += num(log[i].calories);
    }

  
    const weeklyAvg = Math.floor(totalWeekCals / 7);

    let onGoal = 0;
    for (let i = 0; i < days.length; i++) {
      const cals = perDay[days[i]] ? Math.round(perDay[days[i]]) : 0;
      if (cals > 0 && cals <= TARGETS.calories) onGoal++;
    }

    ensureStatsRow();
    const avgEl = document.getElementById("weekly-avg-kcal");
    const itemsEl = document.getElementById("weekly-items-count");
    const goalEl = document.getElementById("days-on-goal");

    if (avgEl) avgEl.innerText = `${weeklyAvg} kcal`;
    if (itemsEl) itemsEl.innerText = `${totalItems} item${totalItems !== 1 ? "s" : ""}`;
    if (goalEl) goalEl.innerText = `${onGoal}/7`;
  }

  function renderFoodLog() {
    const log = getFoodLog();
    const today = todayKey();

 
    if (foodlogDateEl) foodlogDateEl.innerText = formatHeaderDate();

    const todayItems = [];
    for (let i = 0; i < log.length; i++) {
      if (log[i].date === today) {
        todayItems.push({ ...log[i], __idx: i });
      }
    }

    
    if (clearBtn) clearBtn.style.display = todayItems.length ? "inline-flex" : "none";

 
    setLoggedHeader(todayItems.length);


    const totals = sumDay(todayItems);
    const cards = getProgressCards();
    if (cards.length >= 4) {
      setCard(cards[0], "Calories", totals.calories, TARGETS.calories);
      setCard(cards[1], "Protein", totals.protein, TARGETS.protein);
      setCard(cards[2], "Carbs", totals.carbs, TARGETS.carbs);
      setCard(cards[3], "Fat", totals.fat, TARGETS.fat);
    }
    renderLoggedItems(todayItems, log);

    renderWeekly(log);

    updateStats(log);
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      const log = getFoodLog();
      const today = todayKey();
      const kept = log.filter((x) => x.date !== today);
      saveFoodLog(kept);

      if (window.Swal) {
        Swal.fire({
          icon: "success",
          title: "Cleared!",
          text: "Today's log has been cleared.",
          timer: 1400,
          showConfirmButton: false
        });
      } else {
        alert("Cleared ✅");
      }

      renderFoodLog();
    });
  }

  window.renderFoodLog = renderFoodLog;

  renderFoodLog();
})();



showPage("meals");
getAreas();
getCategories();
loadMeals();

