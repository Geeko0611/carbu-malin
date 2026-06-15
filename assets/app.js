const FUELS = ["Gazole", "SP95"];
const MAX_SEARCH_KM = 50;
// Mode trajet : rayon de recherche autour de chaque point km (à vol d'oiseau) et marge de sécurité réservoir.
const ROUTE_AERIAL_RADIUS_KM = 10;
const TANK_SAFETY_RATIO = 0.1;
const ROAD_DETOUR_FACTOR = 1.22;
// Le rayon de 10 km est à vol d'oiseau (rapide). Après calcul d'itinéraire réel, on écarte les
// stations dont le détour routier aller dépasse ce plafond (ex. station de l'autre côté d'un
// fleuve : proche à vol d'oiseau mais très loin par la route).
const MAX_ROUTE_DETOUR_ONE_WAY_KM = 15;
const ROUTE_CANDIDATE_BUFFER = 14;
const MAX_ROUTE_CALLS = 5;
const ROUTE_CONCURRENCY = 5;
const ROUTE_TIMEOUT_MS = 4500;
const VALHALLA_ROUTE_URL = "https://valhalla1.openstreetmap.de/route";
const STORAGE_KEY = "prix-carburant-settings-v2";
const ACCOUNT_STORAGE_KEY = "prix-carburant-accounts-v1";
const SESSION_STORAGE_KEY = "prix-carburant-current-account-v1";
const MAP_TILE_ZOOM = 6;
const DASHBOARD_PAGE_SIZE = 100;
const BRAND_GROUPS = new Set([
  "TotalEnergies",
  "Carrefour",
  "Mousquetaires",
  "E.Leclerc",
  "Coopérative U",
  "Auchan",
  "Avia",
  "Esso",
  "ENI",
]);
const BRAND_LOGOS = {
  TotalEnergies: "assets/brands/totalenergies.png",
  Carrefour: "assets/brands/carrefour.png",
  Mousquetaires: "assets/brands/mousquetaires.jpg",
  "E.Leclerc": "assets/brands/leclerc.png",
  "Coopérative U": "assets/brands/cooperative-u.png",
  Auchan: "assets/brands/auchan.png",
  Avia: "assets/brands/avia.svg",
  Esso: "assets/brands/esso.png",
  ENI: "assets/brands/eni.png",
  "Station indépendante": "assets/brands/station-independante.png",
};
let deferredInstallPrompt = null;

const DEPARTMENT_NAMES = {
  "01": "Ain",
  "02": "Aisne",
  "03": "Allier",
  "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes",
  "06": "Alpes-Maritimes",
  "07": "Ardèche",
  "08": "Ardennes",
  "09": "Ariège",
  "10": "Aube",
  "11": "Aude",
  "12": "Aveyron",
  "13": "Bouches-du-Rhône",
  "14": "Calvados",
  "15": "Cantal",
  "16": "Charente",
  "17": "Charente-Maritime",
  "18": "Cher",
  "19": "Corrèze",
  "20": "Corse",
  "21": "Côte-d'Or",
  "22": "Côtes-d'Armor",
  "23": "Creuse",
  "24": "Dordogne",
  "25": "Doubs",
  "26": "Drôme",
  "27": "Eure",
  "28": "Eure-et-Loir",
  "29": "Finistère",
  "2A": "Corse-du-Sud",
  "2B": "Haute-Corse",
  "30": "Gard",
  "31": "Haute-Garonne",
  "32": "Gers",
  "33": "Gironde",
  "34": "Hérault",
  "35": "Ille-et-Vilaine",
  "36": "Indre",
  "37": "Indre-et-Loire",
  "38": "Isère",
  "39": "Jura",
  "40": "Landes",
  "41": "Loir-et-Cher",
  "42": "Loire",
  "43": "Haute-Loire",
  "44": "Loire-Atlantique",
  "45": "Loiret",
  "46": "Lot",
  "47": "Lot-et-Garonne",
  "48": "Lozère",
  "49": "Maine-et-Loire",
  "50": "Manche",
  "51": "Marne",
  "52": "Haute-Marne",
  "53": "Mayenne",
  "54": "Meurthe-et-Moselle",
  "55": "Meuse",
  "56": "Morbihan",
  "57": "Moselle",
  "58": "Nièvre",
  "59": "Nord",
  "60": "Oise",
  "61": "Orne",
  "62": "Pas-de-Calais",
  "63": "Puy-de-Dôme",
  "64": "Pyrénées-Atlantiques",
  "65": "Hautes-Pyrénées",
  "66": "Pyrénées-Orientales",
  "67": "Bas-Rhin",
  "68": "Haut-Rhin",
  "69": "Rhône",
  "70": "Haute-Saône",
  "71": "Saône-et-Loire",
  "72": "Sarthe",
  "73": "Savoie",
  "74": "Haute-Savoie",
  "75": "Paris",
  "76": "Seine-Maritime",
  "77": "Seine-et-Marne",
  "78": "Yvelines",
  "79": "Deux-Sèvres",
  "80": "Somme",
  "81": "Tarn",
  "82": "Tarn-et-Garonne",
  "83": "Var",
  "84": "Vaucluse",
  "85": "Vendée",
  "86": "Vienne",
  "87": "Haute-Vienne",
  "88": "Vosges",
  "89": "Yonne",
  "90": "Territoire de Belfort",
  "91": "Essonne",
  "92": "Hauts-de-Seine",
  "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne",
  "95": "Val-d'Oise",
  "971": "Guadeloupe",
  "972": "Martinique",
  "973": "Guyane",
  "974": "La Réunion",
  "975": "Saint-Pierre-et-Miquelon",
  "976": "Mayotte",
  "977": "Saint-Barthélemy",
  "978": "Saint-Martin",
  "986": "Wallis-et-Futuna",
  "987": "Polynésie française",
  "988": "Nouvelle-Calédonie",
};

const REGION_DEPARTMENTS = {
  "Auvergne-Rhône-Alpes": ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
  "Bourgogne-Franche-Comté": ["21", "25", "39", "58", "70", "71", "89", "90"],
  Bretagne: ["22", "29", "35", "56"],
  "Centre-Val de Loire": ["18", "28", "36", "37", "41", "45"],
  Corse: ["2A", "2B"],
  "Grand Est": ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
  "Hauts-de-France": ["02", "59", "60", "62", "80"],
  "Île-de-France": ["75", "77", "78", "91", "92", "93", "94", "95"],
  Normandie: ["14", "27", "50", "61", "76"],
  "Nouvelle-Aquitaine": ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  Occitanie: ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
  "Pays de la Loire": ["44", "49", "53", "72", "85"],
  "Provence-Alpes-Côte d'Azur": ["04", "05", "06", "13", "83", "84"],
  "Outre-mer": ["971", "972", "973", "974", "975", "976", "977", "978", "986", "987", "988"],
};

const SPECIAL_PLACES = [];

const DEFAULT_SETTINGS = {
  selectedVehicleId: "diesel-default",
  favoriteVehicleId: "diesel-default",
  favoritePlaces: [],
  stationRatings: {},
  ratingFilters: {
    price: 0,
    clean: 0,
    service: 0,
  },
  timeMinutesFor10: 10,
  ignoreTimeCost: false,
  priceView: "vehicle",
  columnPreferencesVersion: 3,
  columnPreferences: {
    local: { fill: true, vehicle: true, time: true },
    route: { fill: true, vehicle: true, time: true },
  },
  vehicles: [
    {
      id: "diesel-default",
      name: "Diesel",
      fuel: "Gazole",
      tankLiters: 40,
      consumptionL100: 5.5,
      catalogPrice: 25000,
      depreciationKm: 0.069,
      costKm: 0.2,
    },
    {
      id: "essence-default",
      name: "Essence",
      fuel: "SP95",
      tankLiters: 40,
      consumptionL100: 6.7,
      catalogPrice: 20000,
      depreciationKm: 0.055,
      costKm: 0.2,
    },
  ],
};

const FALLBACK_VEHICLE_CATALOG = [
  { brand: "Audi", model: "A5", label: "Audi A5 diesel", fuel: "Gazole", consumptionL100: 5.7, catalogPrice: 52000, depreciationKm: 0.143 },
  { brand: "Audi", model: "A5", label: "Audi A5 essence", fuel: "SP95", consumptionL100: 7.2, catalogPrice: 54000, depreciationKm: 0.149 },
  { brand: "Renault", model: "Clio", label: "Renault Clio essence", fuel: "SP95", consumptionL100: 6.1, catalogPrice: 21000, depreciationKm: 0.058 },
  { brand: "Renault", model: "Clio", label: "Renault Clio diesel", fuel: "Gazole", consumptionL100: 4.8, catalogPrice: 23000, depreciationKm: 0.063 },
  { brand: "Peugeot", model: "208", label: "Peugeot 208 essence", fuel: "SP95", consumptionL100: 5.9, catalogPrice: 22000, depreciationKm: 0.061 },
  { brand: "Peugeot", model: "308", label: "Peugeot 308 diesel", fuel: "Gazole", consumptionL100: 5.1, catalogPrice: 29000, depreciationKm: 0.08 },
  { brand: "Dacia", model: "Sandero", label: "Dacia Sandero essence", fuel: "SP95", consumptionL100: 6.2, catalogPrice: 16000, depreciationKm: 0.044 },
  { brand: "Citroen", model: "C3", label: "Citroen C3 essence", fuel: "SP95", consumptionL100: 6.1, catalogPrice: 20000, depreciationKm: 0.055 },
  { brand: "Volkswagen", model: "Golf", label: "Volkswagen Golf diesel", fuel: "Gazole", consumptionL100: 5.2, catalogPrice: 32000, depreciationKm: 0.088 },
  { brand: "Audi", model: "A3", label: "Audi A3 diesel 2024", fuel: "Gazole", consumptionL100: 5.5, catalogPrice: 36000, depreciationKm: 0.099, year: 2024 },
  { brand: "Audi", model: "Q3", label: "Audi Q3 essence 2024", fuel: "SP95", consumptionL100: 7.1, catalogPrice: 43000, depreciationKm: 0.118, year: 2024 },
  { brand: "BMW", model: "Serie 1", label: "BMW Serie 1 diesel 2024", fuel: "Gazole", consumptionL100: 5.4, catalogPrice: 36000, depreciationKm: 0.099, year: 2024 },
  { brand: "BMW", model: "X1", label: "BMW X1 essence 2024", fuel: "SP95", consumptionL100: 7.0, catalogPrice: 45000, depreciationKm: 0.124, year: 2024 },
  { brand: "Mercedes", model: "Classe A", label: "Mercedes Classe A diesel 2024", fuel: "Gazole", consumptionL100: 5.3, catalogPrice: 39000, depreciationKm: 0.107, year: 2024 },
  { brand: "Volkswagen", model: "Polo", label: "Volkswagen Polo essence 2024", fuel: "SP95", consumptionL100: 5.8, catalogPrice: 24000, depreciationKm: 0.066, year: 2024 },
  { brand: "Toyota", model: "Yaris", label: "Toyota Yaris hybride 2024", fuel: "SP95", consumptionL100: 4.3, catalogPrice: 26000, depreciationKm: 0.072, year: 2024 },
  { brand: "Toyota", model: "Corolla", label: "Toyota Corolla hybride 2024", fuel: "SP95", consumptionL100: 4.8, catalogPrice: 34000, depreciationKm: 0.094, year: 2024 },
  { brand: "Hyundai", model: "Tucson", label: "Hyundai Tucson hybride 2024", fuel: "SP95", consumptionL100: 6.0, catalogPrice: 39000, depreciationKm: 0.107, year: 2024 },
  { brand: "Kia", model: "Sportage", label: "Kia Sportage hybride 2024", fuel: "SP95", consumptionL100: 6.1, catalogPrice: 38000, depreciationKm: 0.105, year: 2024 },
  { brand: "Nissan", model: "Qashqai", label: "Nissan Qashqai essence 2024", fuel: "SP95", consumptionL100: 6.4, catalogPrice: 35000, depreciationKm: 0.096, year: 2024 },
  { brand: "Ford", model: "Puma", label: "Ford Puma hybride 2024", fuel: "SP95", consumptionL100: 5.8, catalogPrice: 30000, depreciationKm: 0.083, year: 2024 },
  { brand: "Volvo", model: "XC40", label: "Volvo XC40 essence 2024", fuel: "SP95", consumptionL100: 7.2, catalogPrice: 47000, depreciationKm: 0.129, year: 2024 },
  { brand: "Mini", model: "Cooper", label: "Mini Cooper essence 2024", fuel: "SP95", consumptionL100: 6.2, catalogPrice: 33000, depreciationKm: 0.091, year: 2024 },
  { brand: "Skoda", model: "Octavia", label: "Skoda Octavia diesel 2024", fuel: "Gazole", consumptionL100: 5.0, catalogPrice: 34000, depreciationKm: 0.094, year: 2024 },
  { brand: "Seat", model: "Leon", label: "Seat Leon essence 2024", fuel: "SP95", consumptionL100: 6.3, catalogPrice: 30000, depreciationKm: 0.083, year: 2024 },
  { brand: "Opel", model: "Corsa", label: "Opel Corsa essence 2024", fuel: "SP95", consumptionL100: 5.7, catalogPrice: 23000, depreciationKm: 0.063, year: 2024 },
  { brand: "Fiat", model: "500", label: "Fiat 500 hybride 2024", fuel: "SP95", consumptionL100: 5.2, catalogPrice: 20000, depreciationKm: 0.055, year: 2024 },
  { brand: "MG", model: "HS", label: "MG HS hybride 2024", fuel: "SP95", consumptionL100: 6.8, catalogPrice: 33000, depreciationKm: 0.091, year: 2024 },
  { brand: "Lexus", model: "UX", label: "Lexus UX hybride 2024", fuel: "SP95", consumptionL100: 5.3, catalogPrice: 42000, depreciationKm: 0.116, year: 2024 },
];

const state = {
  stations: [],
  communes: [],
  vehicleCatalog: FALLBACK_VEHICLE_CATALOG,
  metadata: null,
  history: [],
  settings: clone(DEFAULT_SETTINGS),
  accounts: [],
  currentAccountId: null,
  origin: null,
  routeCache: new Map(),
  scoreDataByFuel: new Map(),
  decisionCandidates: [],
  decisionAllCandidates: [],
  decisionSort: "total",
  decisionMode: "total",
  analysisMode: "local",
  decisionLitersToBuy: 0,
  autoDecisionStarted: false,
  decisionMap: null,
  routeLine: null,
  dashboardRows: [],
  dashboardPage: 1,
  selectedDashboardBrands: null,
  selectedDepartmentsByPicker: {
    dashboardDept: null,
    graphDept: null,
    brandDept: null,
  },
  brandMapView: "france",
  map: null,
  mapLayer: null,
  mapCenter: { lat: 46.2, lon: 2.2 },
  mapRenderFrame: null,
  mapCleanup: null,
};

const addressSuggestionCache = new Map();

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadSettings();
  loadAccounts();
  bindEvents();
  restoreSession();

  try {
    await loadData();
    setupDateControls();
    populateDepartmentSelects();
    populateDashboardBrandPicker();
    if (state.currentAccountId) {
      enterApp(state.currentAccountId);
    } else {
      enterGuestApp();
    }
  } catch (error) {
    setText("dataStatus", "Données temporairement indisponibles.");
    console.error(error);
  }
}

function bindEvents() {
  byId("loginForm").addEventListener("submit", loginAccount);
  byId("createAccountForm").addEventListener("submit", createAccount);
  byId("showManualAccount")?.addEventListener("click", () => {
    const form = byId("createAccountForm");
    if (form) {
      form.hidden = false;
      byId("showManualAccount").hidden = true;
      byId("createEmail")?.focus();
    }
  });
  byId("installShortcutButton")?.addEventListener("click", installShortcut);
  byId("installIosButton")?.addEventListener("click", () => {
    setText("installShortcutHint", "iPhone : touche Partager, puis Ajouter a l'ecran d'accueil.");
  });
  byId("landingSearchInput")?.addEventListener("input", updateLandingSearchSuggestions);
  byId("landingSearchInput")?.addEventListener("focus", updateLandingSearchSuggestions);
  byId("landingSearchForm")?.addEventListener("submit", handleLandingSearchSubmit);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setText("installShortcutHint", "Android : clique sur le bouton pour ajouter Carbu-Malin a l'ecran d'accueil.");
  });
  ["createPassword", "createPasswordConfirm"].forEach((id) => {
    byId(id)?.addEventListener("input", updatePasswordStrength);
  });
  ["accountPassword", "accountPasswordConfirm"].forEach((id) => {
    byId(id)?.addEventListener("input", updateAccountPasswordStrength);
  });
  byId("logoutButton").addEventListener("click", logoutAccount);
  byId("currentUserLabel")?.addEventListener("click", () => openSettings("account"));
  document.querySelectorAll("[data-social-provider]").forEach((button) => {
    button.addEventListener("click", () => {
      setText("authStatus", `${button.dataset.socialProvider} sera branché avec le backend de validation des comptes.`);
    });
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab);
      history.replaceState(null, "", `#${button.dataset.tab}`);
    });
  });

  byId("openSettings").addEventListener("click", openSettings);
  byId("editVehiclesShortcut")?.addEventListener("click", () => openSettings("vehicles"));
  byId("openStats")?.addEventListener("click", () => activateTab("graphs"));
  byId("homeButton")?.addEventListener("click", () => activateTab("decision"));
  document.querySelectorAll("[data-back-home]").forEach((button) => {
    button.addEventListener("click", () => activateTab("decision"));
  });
  byId("homeButton")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      activateTab("decision");
      event.preventDefault();
    }
  });
  byId("closeSettings").addEventListener("click", () => activateTab("decision"));
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.addEventListener("click", () => activateSettingsTab(button.dataset.settingsTab));
  });
  byId("addCurrentFavorite")?.addEventListener("click", addCurrentFavoritePlace);
  byId("addFavoriteAddress")?.addEventListener("click", addFavoriteAddress);
  byId("saveAccountPreferences")?.addEventListener("click", saveAccountPreferences);
  byId("accountSearch")?.addEventListener("input", renderAdminAccounts);
  document.addEventListener("click", (event) => {
    const ratingButton = event.target.closest("[data-rate-station]");
    if (ratingButton) {
      rateStation(ratingButton.dataset.rateStation);
      return;
    }
    const stationToggle = event.target.closest("[data-toggle-station-address]");
    if (stationToggle) {
      const cell = stationToggle.closest(".station-cell");
      const address = cell?.querySelector(".station-address");
      const willHide = address ? !address.hidden : true;
      if (address) {
        address.hidden = willHide;
      }
      // Déplie aussi le détail mobile (colonnes secondaires) de la même ligne.
      const extra = stationToggle.closest("td")?.querySelector(".row-mobile-extra");
      if (extra) {
        extra.hidden = willHide;
      }
      return;
    }
    const info = event.target.closest(".info-dot");
    document.querySelectorAll(".info-dot.active").forEach((node) => {
      if (node !== info) {
        node.classList.remove("active");
      }
    });
    if (info) {
      info.classList.toggle("active");
    }
  });
  byId("settingsPanel").addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettings();
    }
  });

  byId("vehicleSelect").addEventListener("change", (event) => {
    state.settings.selectedVehicleId = event.target.value;
    saveSettings();
    renderVehicleSelects();
    updateVehicleBadge();
  });

  byId("settingsVehicleSelect").addEventListener("change", (event) => {
    state.settings.selectedVehicleId = event.target.value;
    saveSettings();
    renderVehicleSelects();
    updateVehicleBadge();
  });

  byId("timeMinutesFor10").addEventListener("input", (event) => {
    state.settings.timeMinutesFor10 = clampNumber(event.target.value, 5, 60, 10);
    renderTimeSettings();
    saveSettings();
  });

  byId("ignoreTimeCost").addEventListener("change", (event) => {
    state.settings.ignoreTimeCost = event.target.checked;
    renderTimeSettings();
    saveSettings();
    if (state.decisionAllCandidates.length || state.decisionCandidates.length) {
      const allCandidates = state.decisionAllCandidates.length ? state.decisionAllCandidates : state.decisionCandidates;
      allCandidates.forEach((candidate) => {
        applyDecisionCosts(candidate, selectedVehicle(), state.decisionLitersToBuy || 0);
      });
      state.decisionSort = decisionSortForMode(state.decisionMode);
      state.decisionCandidates = sortDecisionCandidates(allCandidates, state.decisionSort).slice(0, state.analysisMode === "route" ? 10 : 5);
      renderDecisionSummary(allCandidates);
      renderDecisionResults();
    }
  });
  ["ratingPriceFilter", "ratingCleanFilter", "ratingServiceFilter"].forEach((id) => {
    byId(id)?.addEventListener("change", () => {
      state.settings.ratingFilters = {
        price: Number(byId("ratingPriceFilter").value),
        clean: Number(byId("ratingCleanFilter").value),
        service: Number(byId("ratingServiceFilter").value),
      };
      saveSettings();
      if (state.decisionAllCandidates.length) {
        state.decisionAllCandidates = state.decisionAllCandidates.filter((candidate) => passesStationRatingFilter(candidate.station));
        state.decisionCandidates = sortDecisionCandidates(state.decisionAllCandidates, state.decisionSort).slice(0, state.analysisMode === "route" ? 10 : 5);
        renderDecisionSummary(state.decisionAllCandidates);
        renderDecisionResults();
      }
    });
  });

  byId("vehicleForm").addEventListener("submit", saveVehicleFromForm);
  byId("cancelVehicleEdit").addEventListener("click", resetVehicleForm);
  byId("vehicleModelSearch")?.addEventListener("input", updateVehicleModelSuggestions);
  byId("vehicleModelSearch")?.addEventListener("change", applyVehicleCatalogSelection);
  byId("vehicleCatalogPrice")?.addEventListener("input", updateVehicleDepreciationPreview);
  document.querySelectorAll("[data-analysis-mode]").forEach((button) => {
    button.addEventListener("click", () => setAnalysisMode(button.dataset.analysisMode || "local"));
  });

  byId("fuelGaugeVisual").addEventListener("click", (event) => {
    setGaugeFromClientX(event.clientX);
  });
  byId("fuelGaugeVisual").addEventListener("keydown", (event) => {
    const current = clampNumber(byId("gaugeInput").value, 0, 100, 30);
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      setGaugeValue(current - 5);
      event.preventDefault();
    }
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      setGaugeValue(current + 5);
      event.preventDefault();
    }
    if (event.key === "Home") {
      setGaugeValue(0);
      event.preventDefault();
    }
    if (event.key === "End") {
      setGaugeValue(100);
      event.preventDefault();
    }
  });
  byId("cityInput").addEventListener("input", updateCitySuggestions);
  byId("cityInput").addEventListener("focus", updateCitySuggestions);
  byId("destinationInput")?.addEventListener("input", updateDestinationSuggestions);
  byId("destinationInput")?.addEventListener("focus", updateDestinationSuggestions);
  byId("favoriteAddressInput")?.addEventListener("input", updateFavoriteAddressSuggestions);
  byId("favoriteAddressInput")?.addEventListener("focus", updateFavoriteAddressSuggestions);

  byId("locateButton").addEventListener("click", locateUser);
  byId("mobileParamsRecap")?.addEventListener("click", exitResultsMode);
  setupMobileFilterToggles();
  document.querySelectorAll("[data-decision-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.decisionMode = button.dataset.decisionMode || "total";
      state.decisionSort = decisionSortForMode(state.decisionMode);
      void runDecision();
    });
  });
  document.querySelectorAll("[data-decision-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      state.decisionSort = button.dataset.decisionSort || "total";
      renderDecisionResults();
    });
  });
  document.querySelectorAll("[data-price-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.priceView = button.dataset.priceView || "vehicle";
      state.decisionSort = state.settings.priceView;
      saveSettings();
      syncPriceViewButtons();
      renderDecisionResults();
    });
  });
  document.querySelectorAll("[data-column-pref]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateColumnPreferencesFromInputs();
      saveSettings();
      renderDecisionResults();
    });
  });

  ["mapFuel", "mapStart", "mapEnd"].forEach((id) => {
    byId(id).addEventListener("change", () => void renderFranceMap());
  });
  document.querySelectorAll("[data-period-target]").forEach((group) => {
    group.querySelectorAll("[data-period]").forEach((button) => {
      button.addEventListener("click", () => {
        applyPeriodToControls(group.dataset.periodTarget, button.dataset.period);
      });
    });
  });

  ["dashboardFuel", "dashboardCitySearch", "dashboardStart", "dashboardEnd"].forEach(
    (id) => {
      byId(id).addEventListener(id === "dashboardCitySearch" ? "input" : "change", () => {
        if (id === "dashboardCitySearch") {
          updateDashboardCitySuggestions();
        }
        state.dashboardPage = 1;
        void renderDashboard();
      });
    }
  );

  ["brandFuel", "brandStart", "brandEnd", "brandGroupFilter"].forEach((id) => {
    byId(id)?.addEventListener("change", () => void renderBrands());
  });
  document.querySelectorAll("[data-brand-map-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.brandMapView = button.dataset.brandMapView || "france";
      document.querySelectorAll("[data-brand-map-view]").forEach((node) => {
        node.classList.toggle("active", node.dataset.brandMapView === state.brandMapView);
      });
      void renderBrands();
    });
  });
  document.querySelectorAll("[data-ranking-target]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.rankingTarget || "dashboard"));
  });

  byId("graphFuel").addEventListener("change", () => {
    setupGraphDates(true);
    byId("distributionFuel").value = byId("graphFuel").value;
    setupDistributionDates(true);
    void renderCharts();
  });
  byId("distributionFuel").addEventListener("change", () => {
    setupDistributionDates(true);
    void renderDistributionChart();
  });
  ["graphStart", "graphEnd"].forEach((id) => {
    byId(id).addEventListener("change", renderPriceChart);
  });
  document.querySelectorAll("[data-graph-period]").forEach((button) => {
    button.addEventListener("click", () => {
      applyGraphPeriod(button.dataset.graphPeriod);
    });
  });
  ["distributionDate"].forEach((id) => {
    byId(id).addEventListener("change", () => {
      void renderDistributionChart();
    });
  });
}

function tabFromHash() {
  const tab = window.location.hash.replace("#", "");
  return ["decision", "map", "dashboard", "graphs", "brands"].includes(tab) ? tab : "decision";
}

function loadAccounts() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY));
    state.accounts = Array.isArray(stored) ? stored : [];
  } catch {
    state.accounts = [];
  }
  // Compte admin par défaut — toujours présent
  if (!state.accounts.some((a) => a.email === "admin")) {
    state.accounts.push({
      id: "default-admin",
      email: "admin",
      password: "admin",
      role: "admin",
      status: "approved",
      usageConsent: true,
      settings: null,
      lastLocation: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }
}

function saveAccounts() {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(state.accounts));
}

function restoreSession() {
  const accountId = localStorage.getItem(SESSION_STORAGE_KEY);
  const sessionAccount = state.accounts.find((account) => account.id === accountId);
  if (sessionAccount && sessionAccount.status !== "pending") {
    state.currentAccountId = accountId;
    loadAccountState(accountId);
    showAppShell();
    renderAccountUi();
  } else {
    state.currentAccountId = null;
    showAuthScreen();
  }
}

function currentAccount() {
  return state.accounts.find((account) => account.id === state.currentAccountId) || null;
}

function loadAccountState(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) {
    return;
  }
  state.settings = {
    ...clone(DEFAULT_SETTINGS),
    ...(account.settings || {}),
  };
  normalizeSettings();
  if (state.settings.favoriteVehicleId) {
    state.settings.selectedVehicleId = state.settings.favoriteVehicleId;
  }
  state.origin = account.lastLocation || null;
  if (state.origin) {
    byId("cityInput").value = state.origin.label || "";
  } else {
    byId("cityInput").value = "";
  }
}

function enterApp(accountId) {
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account || account.status === "pending") {
    enterGuestApp();
    return;
  }
  state.currentAccountId = accountId;
  localStorage.setItem(SESSION_STORAGE_KEY, accountId);
  loadAccountState(accountId);
  showAppShell();
  renderAccountUi();
  renderSettings();
  renderVehicleSelects();
  updateVehicleBadge();
  updateFuelGaugeVisual();
  activateTab(tabFromHash());
  scheduleStartupDecision();
}

function enterGuestApp() {
  state.currentAccountId = null;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  state.settings = clone(DEFAULT_SETTINGS);
  normalizeSettings();
  showAuthScreen();
  renderAccountUi();
  renderSettings();
  renderVehicleSelects();
  updateVehicleBadge();
  setGaugeValue(30);
  updateFuelGaugeVisual();
  activateTab("decision");
}

function showAuthScreen() {
  document.body.classList.add("auth-page");
  document.body.classList.remove("app-page");
  byId("authScreen").hidden = false;
  byId("appShell").hidden = true;
}

function showAppShell() {
  document.body.classList.add("app-page");
  document.body.classList.remove("auth-page");
  byId("authScreen").hidden = true;
  byId("appShell").hidden = false;
}

function renderAccountUi() {
  const account = currentAccount();
  setText("currentUserLabel", account ? `${account.email}${account.role === "admin" ? " - admin" : ""}` : "Mode invité");
  byId("logoutButton").hidden = !account;
  const accountEmail = byId("accountEmail");
  if (accountEmail) {
    accountEmail.value = account?.email || "";
  }
  const externalAccount = Boolean(account?.provider);
  ["accountPassword", "accountPasswordConfirm"].forEach((id) => {
    const node = byId(id);
    if (node) {
      node.disabled = externalAccount;
      node.closest(".field")?.toggleAttribute("hidden", externalAccount);
    }
  });
  byId("accountPasswordStrengthFill")?.closest(".password-strength")?.toggleAttribute("hidden", externalAccount);
  byId("saveAccountPreferences")?.toggleAttribute("hidden", externalAccount);
  renderAdminAccounts();
}

function saveAccountPreferences() {
  const account = currentAccount();
  if (!account) {
    return;
  }
  const nextPassword = byId("accountPassword")?.value || "";
  const confirmPassword = byId("accountPasswordConfirm")?.value || "";
  if (nextPassword) {
    const strength = passwordStrength(nextPassword);
    if (strength.score < 5) {
      setText("locationStatus", "Mot de passe trop faible.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setText("locationStatus", "Les deux mots de passe ne sont pas identiques.");
      return;
    }
    account.password = nextPassword;
    byId("accountPassword").value = "";
    byId("accountPasswordConfirm").value = "";
  }
  saveAccounts();
  renderAccountUi();
}

function loginAccount(event) {
  event.preventDefault();
  const email = byId("loginEmail").value.trim().toLowerCase();
  const password = byId("loginPassword").value;
  const account = state.accounts.find((item) => item.email === email && item.password === password);
  if (!account) {
    setText("authStatus", "Email ou mot de passe incorrect.");
    return;
  }
  if (account.status === "pending") {
    setText("authStatus", "Compte en attente de validation manuelle.");
    return;
  }
  byId("loginForm").reset();
  setText("authStatus", "");
  enterApp(account.id);
}

function createAccount(event) {
  event.preventDefault();
  const email = byId("createEmail").value.trim().toLowerCase();
  const password = byId("createPassword").value;
  const confirm = byId("createPasswordConfirm").value;
  const strength = passwordStrength(password);
  if (!email || strength.score < 5) {
    setText("authStatus", "Le mot de passe doit contenir 8 caractères, majuscule, minuscule, chiffre et symbole.");
    return;
  }
  if (password !== confirm) {
    setText("authStatus", "Les deux mots de passe ne sont pas identiques.");
    return;
  }
  if (!byId("createConsent").checked) {
    setText("authStatus", "Le consentement est nécessaire pour demander un compte.");
    return;
  }
  if (state.accounts.some((account) => account.email === email)) {
    setText("authStatus", "Ce compte existe déjà.");
    return;
  }
  const account = {
    id: makeId(),
    email,
    password,
    role: email === adminContactEmail() ? "admin" : "user",
    status: email === adminContactEmail() ? "approved" : "pending",
    usageConsent: true,
    settings: clone(state.settings || DEFAULT_SETTINGS),
    lastLocation: null,
    createdAt: new Date().toISOString(),
  };
  state.accounts.push(account);
  saveAccounts();
  byId("createAccountForm").reset();
  if (account.status === "pending") {
    openAccountRequestEmail(account);
    setText("authStatus", "Demande enregistrée. Le compte sera activé après validation manuelle.");
  } else {
    setText("authStatus", "Compte administrateur créé. Vous pouvez vous connecter.");
  }
}

function passwordStrength(password) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return {
    score: checks.filter(Boolean).length,
    checks,
  };
}

function updatePasswordStrength() {
  const password = byId("createPassword")?.value || "";
  const confirm = byId("createPasswordConfirm")?.value || "";
  updatePasswordStrengthDisplay(password, confirm, "passwordStrengthFill", "passwordStrengthText");
}

function updateAccountPasswordStrength() {
  const password = byId("accountPassword")?.value || "";
  const confirm = byId("accountPasswordConfirm")?.value || "";
  updatePasswordStrengthDisplay(password, confirm, "accountPasswordStrengthFill", "accountPasswordStrengthText");
}

function updatePasswordStrengthDisplay(password, confirm, fillId, textId) {
  const strength = passwordStrength(password);
  const fill = byId(fillId);
  const text = byId(textId);
  if (!fill || !text) {
    return;
  }
  fill.style.width = `${(strength.score / 5) * 100}%`;
  fill.dataset.score = String(strength.score);
  if (!password) {
    text.textContent = "8 caractères, majuscule, minuscule, chiffre et symbole.";
  } else if (strength.score < 5) {
    text.textContent = "Mot de passe trop faible.";
  } else if (confirm && password !== confirm) {
    text.textContent = "Les deux mots de passe ne sont pas identiques.";
  } else {
    text.textContent = "Mot de passe solide.";
  }
}

async function installShortcut() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    setText("installShortcutHint", "Si l'installation n'apparait pas, utilise le menu du navigateur puis Installer.");
    return;
  }
  const isApple = /iphone|ipad|ipod/i.test(navigator.userAgent);
  setText(
    "installShortcutHint",
    isApple
      ? "iPhone : touche Partager, puis Ajouter a l'ecran d'accueil."
      : "Android : ouvre le menu du navigateur, puis Installer ou Ajouter a l'ecran d'accueil."
  );
}

function adminContactEmail() {
  return [112, 97, 117, 108, 46, 98, 114, 105, 103, 97, 110, 100, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109]
    .map((code) => String.fromCharCode(code))
    .join("");
}

function openAccountRequestEmail(account) {
  const subject = encodeURIComponent("Demande de compte Carbu-Malin");
  const body = encodeURIComponent(
    [
      "Nouvelle demande de compte Carbu-Malin.",
      "",
      `Email : ${account.email}`,
      `Date : ${new Date(account.createdAt).toLocaleString("fr-FR")}`,
      "Consentement usage : oui",
      "",
      "Action : valider manuellement le compte depuis l'administration."
    ].join("\n")
  );
  window.location.href = `mailto:${adminContactEmail()}?subject=${subject}&body=${body}`;
}

function logoutAccount() {
  closeSettings();
  state.origin = null;
  state.decisionCandidates = [];
  state.decisionAllCandidates = [];
  enterGuestApp();
}

function saveAccountState() {
  const account = currentAccount();
  if (!account) {
    return;
  }
  account.settings = clone(state.settings);
  account.lastLocation = state.origin ? clone(state.origin) : null;
  saveAccounts();
  renderAccountUi();
}

function renderAdminAccounts() {
  const account = currentAccount();
  const section = byId("adminSection");
  const list = byId("accountList");
  if (!section || !list || account?.role !== "admin") {
    if (section) {
      section.hidden = true;
    }
    return;
  }
  section.hidden = false;
  const needle = normalizeSearchText(byId("accountSearch")?.value || "");
  list.innerHTML = state.accounts
    .filter((item) => !needle || normalizeSearchText(item.email).includes(needle))
    .map(
      (item) => `
        <div class="account-row">
          <div>
            <strong>${escapeHtml(item.email)}</strong>
            <span>${accountStatusLabel(item)} - ${item.role === "admin" ? "Administrateur" : "Utilisateur"} - ${
              item.settings?.vehicles?.length || 0
            } voiture(s)</span>
          </div>
          <div class="account-actions">
            <button class="button secondary small" type="button" data-approve-account="${escapeHtml(item.id)}" ${
              item.status === "pending" ? "" : "hidden"
            }>Valider</button>
            <button class="button secondary small" type="button" data-toggle-admin="${escapeHtml(item.id)}">${
              item.role === "admin" ? "Retirer admin" : "Rendre admin"
            }</button>
            <button class="icon-button danger-button" type="button" aria-label="Supprimer" data-delete-account="${escapeHtml(
              item.id
            )}" ${item.id === account.id ? "disabled" : ""}>x</button>
          </div>
        </div>
      `
    )
    .join("");

  list.querySelectorAll("[data-approve-account]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = state.accounts.find((item) => item.id === button.dataset.approveAccount);
      if (!target) {
        return;
      }
      target.status = "approved";
      saveAccounts();
      renderAccountUi();
    });
  });
  list.querySelectorAll("[data-toggle-admin]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = state.accounts.find((item) => item.id === button.dataset.toggleAdmin);
      if (!target) {
        return;
      }
      target.role = target.role === "admin" ? "user" : "admin";
      saveAccounts();
      renderAccountUi();
    });
  });
  list.querySelectorAll("[data-delete-account]").forEach((button) => {
    button.addEventListener("click", () => {
      const accountId = button.dataset.deleteAccount;
      if (accountId === state.currentAccountId) {
        return;
      }
      state.accounts = state.accounts.filter((item) => item.id !== accountId);
      saveAccounts();
      renderAccountUi();
    });
  });
}

function accountStatusLabel(account) {
  return account.status === "pending" ? "En attente" : "Validé";
}

async function loadData() {
  const [stationsPayload, historyPayload, communesPayload, vehiclePayload] = await Promise.all([
    fetchJson("data/stations.json"),
    fetchJson("data/history.json", { history: [] }),
    fetchJson("data/communes.json", { communes: [] }),
    fetchJson("data/vehicle_catalog.json", { vehicles: FALLBACK_VEHICLE_CATALOG }),
  ]);

  state.stations = (stationsPayload.stations || []).map((station) => ({
    ...station,
    department: normalizeDepartmentCode(station.department, station.cp),
  }));
  state.communes = communesPayload.communes || [];
  state.vehicleCatalog = mergeVehicleCatalog(vehiclePayload.vehicles || [], FALLBACK_VEHICLE_CATALOG);
  state.metadata = stationsPayload.metadata || null;
  state.history = historyPayload.history || [];

  const latest = latestKnownDate();
  setText(
    "dataStatus",
    latest
      ? `${state.stations.length.toLocaleString("fr-FR")} stations - données au ${formatDate(latest)}`
      : `${state.stations.length.toLocaleString("fr-FR")} stations`
  );
}

async function fetchJson(url, fallback = null) {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
}

function mergeVehicleCatalog(primary, fallback) {
  const seen = new Set();
  return [...fallback, ...primary].filter((vehicle) => {
    const key = normalizeSearchText(`${vehicle.brand} ${vehicle.model} ${vehicle.label} ${vehicle.fuel}`);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function activateTab(tabName) {
  closeSettings();
  document.body.classList.toggle("stats-mode", tabName !== "decision");
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });

  if (tabName === "map") {
    void renderFranceMap();
  }
  if (tabName === "dashboard") {
    void renderDashboard();
  }
  if (tabName === "graphs") {
    void renderCharts();
  }
  if (tabName === "brands") {
    void renderBrands();
  }
}

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.vehicles?.length) {
      state.settings = {
        ...clone(DEFAULT_SETTINGS),
        ...stored,
      };
    }
  } catch {
    state.settings = clone(DEFAULT_SETTINGS);
  }
  normalizeSettings();
}

function normalizeSettings() {
  state.settings.vehicles = state.settings.vehicles
    .map((vehicle) => ({
      id: vehicle.id || makeId(),
      name: String(vehicle.name || "Voiture").slice(0, 40),
      fuel: FUELS.includes(vehicle.fuel) ? vehicle.fuel : "Gazole",
      tankLiters: clampNumber(vehicle.tankLiters, 5, 140, 40),
      brand: String(vehicle.brand || "").slice(0, 40),
      model: String(vehicle.model || "").slice(0, 60),
      year: clampNumber(vehicle.year, 1980, 2030, new Date().getFullYear()),
      power: clampNumber(vehicle.power, 0, 500, 0),
      consumptionL100: clampNumber(vehicle.consumptionL100, 2, 20, vehicle.fuel === "SP95" ? 6.7 : 5.8),
      catalogPrice: clampNumber(vehicle.catalogPrice, 5000, 250000, vehicle.fuel === "SP95" ? 20000 : 22000),
      depreciationKm: clampNumber(vehicle.depreciationKm, 0, 1, 0.055),
      costKm: clampNumber(vehicle.costKm, 0, 3, 0.2),
    }))
    .filter((vehicle) => vehicle.name);

  if (!state.settings.vehicles.length) {
    state.settings.vehicles = clone(DEFAULT_SETTINGS.vehicles);
  }
  if (!state.settings.vehicles.some((vehicle) => vehicle.id === state.settings.selectedVehicleId)) {
    state.settings.selectedVehicleId = state.settings.vehicles[0].id;
  }
  if (!state.settings.vehicles.some((vehicle) => vehicle.id === state.settings.favoriteVehicleId)) {
    state.settings.favoriteVehicleId = state.settings.selectedVehicleId;
  }
  if (!Array.isArray(state.settings.favoritePlaces)) {
    state.settings.favoritePlaces = [];
  }
  if (!state.settings.stationRatings || typeof state.settings.stationRatings !== "object") {
    state.settings.stationRatings = {};
  }
  state.settings.ratingFilters = {
    price: clampNumber(state.settings.ratingFilters?.price, 0, 2, 0),
    clean: clampNumber(state.settings.ratingFilters?.clean, 0, 2, 0),
    service: clampNumber(state.settings.ratingFilters?.service, 0, 2, 0),
  };
  state.settings.priceView = ["fill", "vehicle", "time"].includes(state.settings.priceView) ? state.settings.priceView : "vehicle";
  if (state.settings.columnPreferencesVersion !== DEFAULT_SETTINGS.columnPreferencesVersion) {
    state.settings.columnPreferences = clone(DEFAULT_SETTINGS.columnPreferences);
    state.settings.columnPreferencesVersion = DEFAULT_SETTINGS.columnPreferencesVersion;
  }
  state.settings.columnPreferences = {
    local: {
      fill: Boolean(state.settings.columnPreferences?.local?.fill),
      vehicle: Boolean(state.settings.columnPreferences?.local?.vehicle),
      time: Boolean(state.settings.columnPreferences?.local?.time),
    },
    route: {
      fill: Boolean(state.settings.columnPreferences?.route?.fill),
      vehicle: Boolean(state.settings.columnPreferences?.route?.vehicle),
      time: Boolean(state.settings.columnPreferences?.route?.time),
    },
  };
  state.settings.columnPreferencesVersion = DEFAULT_SETTINGS.columnPreferencesVersion;
  state.settings.timeMinutesFor10 = clampNumber(state.settings.timeMinutesFor10, 5, 60, 10);
  state.settings.ignoreTimeCost = Boolean(state.settings.ignoreTimeCost);
}

function saveSettings() {
  normalizeSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  saveAccountState();
}

function renderVehicleSelects() {
  const options = state.settings.vehicles
    .map(
      (vehicle) =>
        `<option value="${escapeHtml(vehicle.id)}">${escapeHtml(vehicleSelectLabel(vehicle))}</option>`
    )
    .join("");

  [byId("vehicleSelect"), byId("settingsVehicleSelect")].forEach((select) => {
    select.innerHTML = options;
    select.value = state.settings.selectedVehicleId;
  });
  const vehicle = selectedVehicle();
  setText("vehicleMeta", vehicle ? `${vehicleDisplayName(vehicle)} - ${vehicleMetaLabel(vehicle)}` : "");
}

function vehicleDisplayName(vehicle) {
  return vehicle.model || vehicle.name || vehicle.brand || "Voiture";
}

function vehicleMetaLabel(vehicle) {
  return `${fuelLabel(vehicle.fuel)} - ${vehicle.tankLiters}L - ${formatNumber(vehicle.consumptionL100 || 0, 1)}L/100`;
}

function vehicleSelectLabel(vehicle) {
  return `${vehicleDisplayName(vehicle)} - ${vehicleMetaLabel(vehicle)}`;
}

function renderSettings() {
  renderTimeSettings();
  renderFavoritePlaces();
  renderAccountUi();
  byId("vehicleList").innerHTML = state.settings.vehicles
    .map((vehicle) => {
      const isSelected = vehicle.id === state.settings.selectedVehicleId ? " active" : "";
      const isFavorite = vehicle.id === state.settings.favoriteVehicleId;
      return `
        <div class="vehicle-row${isSelected}">
          <button class="favorite-button${isFavorite ? " active" : ""}" type="button" aria-label="Définir comme voiture favorite" data-favorite-vehicle="${escapeHtml(
            vehicle.id
          )}">★</button>
          <button class="vehicle-main" type="button" data-edit-vehicle="${escapeHtml(vehicle.id)}">
            <strong>${escapeHtml(vehicleDisplayName(vehicle))}</strong>
            <span>${escapeHtml(fuelLabel(vehicle.fuel))} - ${vehicle.tankLiters} L - ${formatNumber(
              vehicle.consumptionL100,
              1
            )}L - décote estimée ${formatEuro(vehicle.depreciationKm, 3)}/km${
              vehicle.year ? ` - ref. ${vehicle.year}` : ""
            }</span>
          </button>
          <div class="vehicle-actions">
            <button class="icon-button" type="button" aria-label="Modifier" data-edit-vehicle="${escapeHtml(
              vehicle.id
            )}">✎</button>
            <button class="icon-button danger-button" type="button" aria-label="Supprimer" data-delete-vehicle="${escapeHtml(
              vehicle.id
            )}">×</button>
          </div>
        </div>
      `;
    })
    .join("");

  byId("vehicleList").querySelectorAll("[data-edit-vehicle]").forEach((button) => {
    button.addEventListener("click", () => editVehicle(button.dataset.editVehicle));
  });
  byId("vehicleList").querySelectorAll("[data-delete-vehicle]").forEach((button) => {
    button.addEventListener("click", () => deleteVehicle(button.dataset.deleteVehicle));
  });
  byId("vehicleList").querySelectorAll("[data-favorite-vehicle]").forEach((button) => {
    button.addEventListener("click", () => setFavoriteVehicle(button.dataset.favoriteVehicle));
  });
}

function renderTimeSettings() {
  byId("timeMinutesFor10").value = state.settings.timeMinutesFor10;
  byId("timeMinutesOutput").value = `${state.settings.timeMinutesFor10} €`;
  byId("ignoreTimeCost").checked = state.settings.ignoreTimeCost;
  byId("timeMinutesFor10").disabled = state.settings.ignoreTimeCost;
  byId("ratingPriceFilter").value = String(state.settings.ratingFilters?.price ?? 0);
  byId("ratingCleanFilter").value = String(state.settings.ratingFilters?.clean ?? 0);
  byId("ratingServiceFilter").value = String(state.settings.ratingFilters?.service ?? 0);
  syncColumnPreferenceInputs();
  syncPriceViewButtons();
  syncDecisionTimeColumn();
}

function syncPriceViewButtons() {
  document.querySelectorAll("[data-price-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.priceView === state.settings.priceView);
  });
}

function syncColumnPreferenceInputs() {
  document.querySelectorAll("[data-column-pref]").forEach((input) => {
    const [mode, key] = String(input.dataset.columnPref || "").split(".");
    input.checked = Boolean(state.settings.columnPreferences?.[mode]?.[key]);
  });
}

function updateColumnPreferencesFromInputs() {
  const preferences = clone(state.settings.columnPreferences || DEFAULT_SETTINGS.columnPreferences);
  document.querySelectorAll("[data-column-pref]").forEach((input) => {
    const [mode, key] = String(input.dataset.columnPref || "").split(".");
    if (!preferences[mode]) {
      preferences[mode] = {};
    }
    preferences[mode][key] = input.checked;
  });
  state.settings.columnPreferences = preferences;
}

function renderFavoritePlaces() {
  const list = byId("favoritePlacesList");
  if (!list) {
    return;
  }
  const places = favoritePlaces();
  list.innerHTML = places.length
    ? places
        .map(
          (place, index) => `
            <div class="favorite-place-row">
              <div>
                <strong>${escapeHtml(place.name)}</strong>
                <span>${formatNumber(place.lat, 4)}, ${formatNumber(place.lon, 4)}</span>
              </div>
              <button class="icon-button danger-button" type="button" aria-label="Supprimer" data-delete-favorite-place="${index}">x</button>
            </div>
          `
        )
        .join("")
    : `<p class="settings-note">Aucun lieu favori pour le moment. Le premier lieu recherché sera ajouté automatiquement.</p>`;
  list.querySelectorAll("[data-delete-favorite-place]").forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.favoritePlaces.splice(Number(button.dataset.deleteFavoritePlace), 1);
      saveSettings();
      renderFavoritePlaces();
      if (document.body.classList.contains("stats-mode")) {
        void renderFranceMap();
      }
    });
  });
}

function favoritePlaces() {
  return Array.isArray(state.settings.favoritePlaces) ? state.settings.favoritePlaces : [];
}

function addCurrentFavoritePlace() {
  const origin = state.origin;
  if (!origin) {
    setText("locationStatus", "Indique d'abord une adresse de départ.");
    return;
  }
  ensureDefaultFavoritePlace(origin, true);
  renderFavoritePlaces();
}

async function addFavoriteAddress() {
  const input = byId("favoriteAddressInput");
  const query = input?.value.trim();
  if (!query) {
    setText("locationStatus", "Indique une adresse favorite.");
    return;
  }
  try {
    const place = await geocodeCity(query);
    ensureDefaultFavoritePlace({ ...place, label: place.label || query }, true);
    if (input) {
      input.value = "";
    }
    renderFavoritePlaces();
  } catch {
    setText("locationStatus", "Adresse favorite introuvable.");
  }
}

function ensureDefaultFavoritePlace(place, force = false) {
  if (!place?.lat || !place?.lon || (!force && favoritePlaces().length)) {
    return;
  }
  const label = place.label || byId("cityInput").value || "Lieu favori";
  const exists = favoritePlaces().some(
    (item) => Math.abs(item.lat - place.lat) < 0.001 && Math.abs(item.lon - place.lon) < 0.001
  );
  if (exists) {
    return;
  }
  state.settings.favoritePlaces.push({
    name: label === "Position actuelle" ? "Position actuelle" : label,
    lat: place.lat,
    lon: place.lon,
  });
  saveSettings();
  renderFavoritePlaces();
}

function setFavoriteVehicle(vehicleId) {
  if (!state.settings.vehicles.some((vehicle) => vehicle.id === vehicleId)) {
    return;
  }
  state.settings.favoriteVehicleId = vehicleId;
  state.settings.selectedVehicleId = vehicleId;
  saveSettings();
  renderVehicleSelects();
  renderSettings();
  updateVehicleBadge();
}

function saveVehicleFromForm(event) {
  event.preventDefault();
  const editingId = byId("editingVehicleId").value;
  const fuel = byId("vehicleFuel").value;
  const catalogPrice = clampNumber(byId("vehicleCatalogPrice").value, 5000, 250000, fuel === "SP95" ? 20000 : 22000);
  const depreciationKm = roundTo((catalogPrice / 20000) * 0.055, 3);
  const brand = byId("vehicleBrand").value.trim();
  const model = byId("vehicleModel").value.trim() || byId("vehicleModelSearch").value.trim();
  const consumptionL100 = clampNumber(byId("vehicleConsumption").value, 2, 20, fuel === "SP95" ? 6.7 : 5.8);
  const autoName = [brand, model].filter(Boolean).join(" ").trim() || byId("vehicleModelSearch").value.trim() || "Voiture";
  const vehicle = {
    id: editingId || makeId(),
    name: `${autoName} - ${fuelLabel(fuel)} - ${formatNumber(consumptionL100, 1)}L`,
    brand,
    model,
    year: clampNumber(byId("vehicleYear").value, 1980, 2030, new Date().getFullYear()),
    power: clampNumber(byId("vehiclePower").value, 0, 500, 0),
    fuel,
    tankLiters: clampNumber(byId("vehicleTank").value, 5, 140, 40),
    consumptionL100,
    catalogPrice,
    depreciationKm,
    costKm: 0.2,
  };
  if (!vehicle.name) {
    return;
  }

  if (editingId) {
    state.settings.vehicles = state.settings.vehicles.map((current) =>
      current.id === editingId ? vehicle : current
    );
  } else {
    state.settings.vehicles.push(vehicle);
    state.settings.selectedVehicleId = vehicle.id;
    state.settings.favoriteVehicleId = vehicle.id;
  }

  saveSettings();
  resetVehicleForm();
  renderVehicleSelects();
  renderSettings();
  updateVehicleBadge();
}

function editVehicle(vehicleId) {
  const vehicle = state.settings.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return;
  }
  byId("editingVehicleId").value = vehicle.id;
  byId("vehicleName").value = vehicle.name;
  byId("vehicleModelSearch").value = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  byId("vehicleBrand").value = vehicle.brand || "";
  byId("vehicleModel").value = vehicle.model || "";
  byId("vehicleYear").value = vehicle.year || new Date().getFullYear();
  byId("vehiclePower").value = vehicle.power || "";
  byId("vehicleFuel").value = vehicle.fuel;
  byId("vehicleTank").value = vehicle.tankLiters;
  byId("vehicleConsumption").value = vehicle.consumptionL100;
  byId("vehicleCatalogPrice").value = vehicle.catalogPrice;
  byId("vehicleDepreciationKm").value = `${formatEuro(vehicle.depreciationKm, 3)}/km`;
  setText("vehicleFormTitle", "Modifier la voiture");
  setText("vehicleSubmitLabel", "Enregistrer la voiture");
  byId("cancelVehicleEdit").hidden = false;
}

function resetVehicleForm() {
  byId("vehicleForm").reset();
  byId("editingVehicleId").value = "";
  byId("vehicleTank").value = 40;
  byId("vehicleYear").value = new Date().getFullYear();
  byId("vehicleConsumption").value = 6.7;
  byId("vehicleCatalogPrice").value = 20000;
  byId("vehicleDepreciationKm").value = `${formatEuro(0.055, 3)}/km`;
  setText("vehicleFormTitle", "");
  setText("vehicleSubmitLabel", "Ajouter la voiture");
  byId("cancelVehicleEdit").hidden = true;
}

function updateVehicleModelSuggestions() {
  const input = byId("vehicleModelSearch");
  const datalist = byId("vehicleCatalogSuggestions");
  if (!input || !datalist) {
    return;
  }
  const needle = normalizeSearchText(input.value);
  if (needle.length < 2) {
    datalist.innerHTML = "";
    return;
  }
  datalist.innerHTML = vehicleCatalogMatches(needle)
    .slice(0, 12)
    .map((vehicle) => `<option value="${escapeHtml(vehicle.label)}">${escapeHtml(vehicle.brand)} - ${escapeHtml(vehicle.model)}</option>`)
    .join("");
}

function vehicleCatalogMatches(needle) {
  return state.vehicleCatalog
    .map((vehicle) => {
      const haystack = normalizeSearchText(`${vehicle.brand} ${vehicle.model} ${vehicle.label} ${vehicle.energy || ""}`);
      if (!haystack.includes(needle)) {
        return null;
      }
      return {
        vehicle,
        rank: normalizeSearchText(`${vehicle.brand} ${vehicle.model}`).startsWith(needle) ? 0 : 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.vehicle.brand.localeCompare(b.vehicle.brand, "fr"))
    .map((row) => row.vehicle);
}

function applyVehicleCatalogSelection() {
  const input = byId("vehicleModelSearch");
  if (!input) {
    return;
  }
  const needle = normalizeSearchText(input.value);
  const match =
    state.vehicleCatalog.find((vehicle) => normalizeSearchText(vehicle.label) === needle) ||
    vehicleCatalogMatches(needle)[0];
  if (!match) {
    return;
  }
  byId("vehicleBrand").value = match.brand || "";
  byId("vehicleModel").value = match.model || "";
  byId("vehicleFuel").value = match.fuel || "SP95";
  byId("vehicleConsumption").value = match.consumptionL100 || (match.fuel === "Gazole" ? 5.8 : 6.7);
  byId("vehicleCatalogPrice").value = match.catalogPrice || (match.fuel === "Gazole" ? 22000 : 20000);
  byId("vehicleName").value = [match.brand, match.model].filter(Boolean).join(" ");
  updateVehicleDepreciationPreview();
}

function updateVehicleDepreciationPreview() {
  const price = clampNumber(byId("vehicleCatalogPrice").value, 5000, 250000, 20000);
  byId("vehicleDepreciationKm").value = `${formatEuro(roundTo((price / 20000) * 0.055, 3), 3)}/km`;
}

function deleteVehicle(vehicleId) {
  if (state.settings.vehicles.length <= 1) {
    return;
  }
  state.settings.vehicles = state.settings.vehicles.filter((vehicle) => vehicle.id !== vehicleId);
  if (state.settings.favoriteVehicleId === vehicleId) {
    state.settings.favoriteVehicleId = state.settings.vehicles[0]?.id;
  }
  saveSettings();
  resetVehicleForm();
  renderVehicleSelects();
  renderSettings();
  updateVehicleBadge();
}

function selectedVehicle() {
  return (
    state.settings.vehicles.find((vehicle) => vehicle.id === state.settings.selectedVehicleId) ||
    state.settings.vehicles[0]
  );
}

function updateVehicleBadge() {
  setText("activeFuelBadge", "");
}

function updateFuelGaugeVisual() {
  const value = clampNumber(byId("gaugeInput").value, 0, 100, 30);
  byId("gaugeOutput").value = `${value}%`;
  const gauge = byId("fuelGaugeVisual");
  if (gauge) {
    gauge.setAttribute("aria-valuenow", String(value));
  }
  const tiles = byId("fuelGaugeTiles");
  if (!tiles) {
    return;
  }
  tiles.innerHTML = Array.from({ length: 20 }, (_item, index) => {
    const level = (index + 1) * 5;
    const active = level <= value;
    const color = gaugeTileColor(level);
    const mark = [10, 25, 50, 75].includes(level) ? " mark" : "";
    return `<span class="fuel-gauge-tile${active ? " active" : ""}${mark}" style="background:${active ? color : "#f4f7f5"}" data-level="${level}"></span>`;
  }).join("");
}

function gaugeTileColor(level) {
  if (level <= 15) {
    return "#cf3f3f";
  }
  if (level <= 35) {
    return "#ef8f35";
  }
  if (level <= 60) {
    return "#f5b82e";
  }
  return "#0f766e";
}

function setGaugeFromClientX(clientX) {
  const gauge = byId("fuelGaugeVisual");
  const rect = gauge.getBoundingClientRect();
  const ratio = clampNumber((clientX - rect.left) / rect.width, 0, 1, 0);
  setGaugeValue(Math.ceil((ratio * 100) / 5) * 5);
}

function setGaugeValue(value) {
  const nextValue = clampNumber(Math.round(value / 5) * 5, 0, 100, 30);
  byId("gaugeInput").value = String(nextValue);
  updateFuelGaugeVisual();
}

function setAnalysisMode(mode) {
  state.analysisMode = mode === "route" ? "route" : "local";
  document.querySelectorAll("[data-analysis-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.analysisMode === state.analysisMode);
  });
  byId("routeFields").hidden = state.analysisMode !== "route";
  document.querySelectorAll(".local-action").forEach((button) => {
    button.hidden = state.analysisMode === "route";
  });
  document.querySelectorAll(".route-action").forEach((button) => {
    button.hidden = state.analysisMode !== "route";
  });
  state.decisionMode = state.analysisMode === "route" ? "total" : state.decisionMode === "routeLate" ? "total" : state.decisionMode;
  state.decisionSort = decisionSortForMode(state.decisionMode);
  exitResultsMode();
}

// Mobile : après un calcul, on replie le formulaire pour faire remonter la réponse (résultats)
// sur le premier écran. Un récap cliquable rouvre le formulaire.
function enterResultsMode() {
  const recap = byId("mobileParamsRecap");
  if (recap) {
    const origin = state.origin?.label || byId("cityInput").value.trim() || "Départ";
    const vehicle = selectedVehicle();
    const gauge = Math.round(clampNumber(byId("gaugeInput").value, 0, 100, 30));
    const destText = byId("destinationInput")?.value.trim();
    const dest = state.analysisMode === "route" && destText ? ` → ${destText}` : "";
    recap.textContent = `📍 ${origin}${dest} · ${vehicleDisplayName(vehicle)} · ${gauge}% · ✎ Modifier`;
    recap.hidden = false;
  }
  document.body.classList.add("decision-results");
}

function exitResultsMode() {
  document.body.classList.remove("decision-results");
  const recap = byId("mobileParamsRecap");
  if (recap) {
    recap.hidden = true;
  }
}

// Mobile : replie les panneaux de filtres (Classements / Enseignes) derrière un bouton « Filtres »
// pour que les données remontent sur le premier écran. Sans effet sur desktop (CSS ≤640px).
function setupMobileFilterToggles() {
  document.querySelectorAll(".dashboard-filter-panel").forEach((panel) => {
    if (panel.querySelector(":scope > .filter-toggle")) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-toggle";
    button.textContent = "Filtres";
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const open = panel.classList.toggle("filters-open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Masquer les filtres" : "Filtres";
    });
    panel.prepend(button);
  });
}

function scheduleStartupDecision() {
  if (state.autoDecisionStarted) {
    return;
  }
  state.autoDecisionStarted = true;
  setGaugeValue(30);
  window.setTimeout(async () => {
    if (state.analysisMode !== "local") {
      return;
    }
    try {
      if (state.origin) {
        state.decisionMode = "total";
        state.decisionSort = "total";
        await runDecision();
        return;
      }
      setText("locationStatus", "Autorisez la localisation pour lancer le calcul automatique.");
      await locateUser({ quiet: true });
      if (state.origin) {
        state.decisionMode = "total";
        state.decisionSort = "total";
        await runDecision();
      }
    } catch {
      setText("locationStatus", "Indiquez une ville pour lancer le calcul.");
    }
  }, 600);
}

function openSettings(tabName = "vehicles") {
  if (typeof tabName !== "string") {
    tabName = "vehicles";
  }
  renderSettings();
  activateSettingsTab(tabName);
  document.body.classList.add("settings-mode");
  document.body.classList.remove("stats-mode");
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  byId("settingsPanel").classList.add("open");
  byId("settingsPanel").setAttribute("aria-hidden", "false");
}

function closeSettings() {
  document.body.classList.remove("settings-mode");
  byId("settingsPanel").classList.remove("open");
  byId("settingsPanel").setAttribute("aria-hidden", "true");
}

function activateSettingsTab(tabName = "vehicles") {
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTab === tabName);
  });
  document.querySelectorAll(".settings-page").forEach((page) => {
    page.classList.toggle("active", page.id === `settings-${tabName}`);
  });
}

async function locateUser(options = {}) {
  setText("locationStatus", options.quiet ? "Demande de localisation..." : "Localisation en cours...");
  try {
    const position = await browserPosition();
    state.origin = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      label: "Position actuelle",
    };
    byId("cityInput").value = "Position actuelle";
    saveAccountState();
    setText("locationStatus", "");
    return state.origin;
  } catch (error) {
    setText("locationStatus", "Localisation impossible. Indiquez une ville.");
    console.error(error);
    throw error;
  }
}

function browserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 300000,
    });
  });
}

async function resolveOrigin() {
  const city = byId("cityInput").value.trim();
  if (city && city !== "Position actuelle") {
    const result = await geocodeCity(city);
    state.origin = result;
    saveAccountState();
    setText("locationStatus", "");
    return result;
  }
  if (state.origin) {
    return state.origin;
  }
  const position = await browserPosition();
  state.origin = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    label: "Position actuelle",
  };
  byId("cityInput").value = "Position actuelle";
  saveAccountState();
  return state.origin;
}

async function geocodeCity(query) {
  const favorite = favoritePlaces().find((place) => normalizeSearchText(place.name) === normalizeSearchText(query));
  if (favorite) {
    return { lat: favorite.lat, lon: favorite.lon, label: favorite.name };
  }
  if (looksLikeStreetAddress(query)) {
    const remote = await geocodeRemote(query);
    if (remote) {
      return remote;
    }
  }
  const local = geocodeLocalCity(query);
  if (local) {
    return local;
  }

  const remote = await geocodeRemote(query);
  if (remote) {
    return remote;
  }

  throw new Error("Ville ou adresse introuvable.");
}

function looksLikeStreetAddress(query) {
  const text = String(query || "");
  return /\d+\s+\p{L}/u.test(text) || /\b(rue|avenue|boulevard|route|chemin|impasse|place|allee|allée|strasse|straße|via|calle|carrer|rua|straat|weg|laan|gasse|platz|piazza|avenida|paseo|corso|viale)\b/i.test(text);
}

async function geocodeRemote(query) {
  const address = await geocodeFrenchAddress(query);
  if (address) {
    return address;
  }
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "fr,de,gb,es,it,nl,be,ch,at,pt,lu,dk,se,no,fi,cz,hu,ro,sk,si,hr,bg,ee,lv,lt,ie,gr,cy,mt,pl,ad,mc,li,sm");
  url.searchParams.set("q", query);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    const rows = await response.json();
    if (rows.length) {
      return {
        lat: Number(rows[0].lat),
        lon: Number(rows[0].lon),
        label: rows[0].display_name.split(",").slice(0, 2).join(","),
      };
    }
  } catch (error) {
    console.info("Geocoding remote unavailable, using local city index.", error);
  } finally {
    window.clearTimeout(timeout);
  }
  return null;
}

const FOREIGN_COUNTRY_KEYWORDS = /\b(belgique|belgium|belgie|deutschland|germany|allemagne|españa|spain|espagne|italia|italy|italie|nederland|netherlands|pays[- ]bas|schweiz|switzerland|suisse|austria|autriche|österreich|portugal|polska|poland|pologne|dansk|denmark|danemark|sverige|sweden|suède|norge|norway|norvège|suomi|finland|finlande|czech|tchèque|hrvatska|croatia|croatie|slovenija|slovaquie|romania|roumanie|bulgaria|bulgarie|ireland|irlande|grèce|greece|luxembourg|monaco|andorra|andorre|liechtenstein|malte|malta|chypre|cyprus|estonia|estonie|latvia|lettonie|lithuania|lituanie)\b/i;

async function geocodeFrenchAddress(query) {
  // Ne pas appeler l'API française si la requête mentionne un pays étranger
  if (FOREIGN_COUNTRY_KEYWORDS.test(query)) {
    return null;
  }
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("autocomplete", "0");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const feature = payload.features?.[0];
    if (!feature?.geometry?.coordinates?.length) {
      return null;
    }
    // Rejeter les résultats peu pertinents (score < 0.5)
    if (Number(feature.properties?.score ?? 0) < 0.5) {
      return null;
    }
    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties || {};
    return {
      lat: Number(lat),
      lon: Number(lon),
      label: props.label || [props.name, props.postcode, props.city].filter(Boolean).join(" "),
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

function geocodeLocalCity(query) {
  const needle = normalizeSearchText(query);
  const rawQuery = String(query).trim();
  const cpNeedle = (rawQuery.match(/\b\d{5}\b/) || [""])[0];
  const cpOnly = /^\d{5}$/.test(rawQuery);
  if (!needle) {
    return null;
  }

  const communeMatches = state.communes
    .map((commune) => {
      const city = normalizeSearchText(commune.name);
      const postalCodes = commune.cp || [];
      const haystack = normalizeSearchText(`${commune.name} ${postalCodes.join(" ")}`);
      const exact = city === needle || (cpOnly && postalCodes.includes(cpNeedle));
      const partial = haystack.includes(needle) || city.startsWith(needle);
      return exact || partial ? { commune, rank: exact ? 0 : city.startsWith(needle) ? 1 : 2 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || (b.commune.population || 0) - (a.commune.population || 0));

  if (communeMatches.length) {
    const commune = communeMatches[0].commune;
    const cpLabel = commune.cp?.[0] ? ` (${commune.cp[0]})` : "";
    return {
      lat: commune.lat,
      lon: commune.lon,
      label: `${commune.name}${cpLabel}`,
    };
  }

  const stationMatches = state.stations.filter((station) => {
    const city = normalizeSearchText(station.city);
    const cp = normalizeSearchText(station.cp);
    return city === needle || cp === needle || city.includes(needle);
  });
  if (!stationMatches.length) {
    return null;
  }
  const lat = stationMatches.reduce((sum, station) => sum + station.lat, 0) / stationMatches.length;
  const lon = stationMatches.reduce((sum, station) => sum + station.lon, 0) / stationMatches.length;
  const sample = stationMatches[0];
  return { lat, lon, label: `${sample.city}${sample.cp ? ` (${sample.cp})` : ""}` };
}

function updateCitySuggestions() {
  void updatePlaceSuggestions(byId("cityInput"), byId("citySuggestions"), { includeFavorites: true });
}

function updateLandingSearchSuggestions() {
  void updatePlaceSuggestions(byId("landingSearchInput"), byId("landingSearchSuggestions"), { includeFavorites: false });
}

function updateDestinationSuggestions() {
  void updatePlaceSuggestions(byId("destinationInput"), byId("destinationSuggestions"), { includeFavorites: true });
}

function updateFavoriteAddressSuggestions() {
  void updatePlaceSuggestions(byId("favoriteAddressInput"), byId("favoriteAddressSuggestions"), { includeFavorites: false });
}

async function updatePlaceSuggestions(input, datalist, options = {}) {
  if (!input || !datalist) {
    return;
  }
  const needle = normalizeSearchText(input.value);
  if (needle.length < 2 && !(options.includeFavorites && favoritePlaces().length)) {
    datalist.innerHTML = "";
    return;
  }
  const localRows = citySuggestionRows(needle).slice(0, 8);
  datalist.innerHTML = localRows.map((row) => `<option value="${escapeHtml(row.value)}"></option>`).join("");
  if (needle.length < 3) {
    return;
  }
  const queryAtRequest = input.value.trim();
  const remoteRows = await fetchAddressSuggestions(queryAtRequest);
  if (input.value.trim() !== queryAtRequest) {
    return;
  }
  const seen = new Set();
  const rows = [...remoteRows, ...localRows]
    .filter((row) => {
      const key = normalizeSearchText(row.value);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 10);
  datalist.innerHTML = rows.map((row) => `<option value="${escapeHtml(row.value)}"></option>`).join("");
}

async function fetchAddressSuggestions(query) {
  const trimmed = String(query || "").trim();
  if (trimmed.length < 3) {
    return [];
  }
  const cacheKey = normalizeSearchText(trimmed);
  if (addressSuggestionCache.has(cacheKey)) {
    return addressSuggestionCache.get(cacheKey);
  }
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "7");
  url.searchParams.set("autocomplete", "1");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url.toString(), { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Adresse API ${response.status}`);
    }
    const payload = await response.json();
    const rows = (payload.features || [])
      .map((feature) => feature.properties)
      .filter(Boolean)
      .map((props) => ({
        value: props.label || [props.name, props.postcode, props.city].filter(Boolean).join(" "),
      }));
    addressSuggestionCache.set(cacheKey, rows);
    return rows;
  } catch (error) {
    console.info("Address suggestions unavailable, using local index.", error);
    addressSuggestionCache.set(cacheKey, []);
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
}

function handleLandingSearchSubmit(event) {
  event.preventDefault();
  const input = byId("landingSearchInput");
  const query = input?.value.trim() || "";
  if (query) {
    byId("cityInput").value = query;
    localStorage.setItem("prix-carburant-pending-origin-v1", query);
  }
  revealSignupPanel();
}

function revealSignupPanel() {
  const panel = byId("signupPanel");
  if (!panel) {
    return;
  }
  panel.hidden = false;
  panel.classList.add("signup-highlight");
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
  setText("authStatus", "Crée ton compte gratuit pour lancer la recherche avec cette adresse.");
}

function citySuggestionRows(needle) {
  const seen = new Set();
  const rows = [];
  if (!needle) {
    return favoritePlaces().map((place) => ({
      value: place.name,
      label: place.name,
      city: place.name,
      cp: "",
      rank: 0,
      population: 0,
    }));
  }
  const communeRows = state.communes.length ? state.communes : [];
  communeRows.forEach((commune) => {
    const city = commune.name || "";
    const cp = commune.cp?.[0] || "";
    const key = `${normalizeSearchText(city)}:${cp}`;
    if (!city || seen.has(key)) {
      return;
    }
    const haystack = normalizeSearchText(`${city} ${(commune.cp || []).join(" ")}`);
    if (!haystack.includes(needle)) {
      return;
    }
    seen.add(key);
    const normalizedCity = normalizeSearchText(city);
    rows.push({
      value: `${city}${cp ? ` (${cp})` : ""}`,
      label: cp ? `${city} - ${cp}` : city,
      city,
      cp,
      rank: normalizedCity.startsWith(needle) ? 0 : 1,
      population: commune.population || 0,
    });
  });
  if (!rows.length) {
    state.stations.forEach((station) => {
      const city = station.city || "";
      const cp = station.cp || "";
      const key = `${normalizeSearchText(city)}:${cp.slice(0, 2)}`;
      if (!city || seen.has(key)) {
        return;
      }
      const haystack = normalizeSearchText(`${city} ${cp}`);
      if (!haystack.includes(needle)) {
        return;
      }
      seen.add(key);
      const normalizedCity = normalizeSearchText(city);
      rows.push({
        value: `${city}${cp ? ` (${cp})` : ""}`,
        label: cp ? `${city} - ${cp}` : city,
        city,
        cp,
        rank: normalizedCity.startsWith(needle) ? 0 : 1,
        population: 0,
      });
    });
  }
  return rows.sort(
    (a, b) =>
      a.rank - b.rank ||
      (b.population || 0) - (a.population || 0) ||
      a.city.localeCompare(b.city, "fr") ||
      a.cp.localeCompare(b.cp, "fr")
  );
}

function updateDashboardCitySuggestions() {
  const input = byId("dashboardCitySearch");
  const datalist = byId("dashboardCitySuggestions");
  if (!input || !datalist) {
    return;
  }
  const needle = normalizeSearchText(input.value);
  if (needle.length < 2) {
    datalist.innerHTML = "";
    return;
  }
  datalist.innerHTML = citySuggestionRows(needle)
    .slice(0, 10)
    .map((row) => `<option value="${escapeHtml(row.city)}"></option>`)
    .join("");
}

async function runDecision() {
  if (state.analysisMode === "route") {
    await runRouteDecision();
    return;
  }
  const buttons = [...document.querySelectorAll("[data-decision-mode]")];
  buttons.forEach((button) => {
    button.disabled = true;
  });
  syncDecisionTimeColumn();
  setText("decisionStatus", "");
  showDecisionLoader();
  byId("decisionMap").hidden = true;

  try {
    const vehicle = selectedVehicle();
    const fuel = vehicle.fuel;
    const origin = await resolveOrigin();
    ensureDefaultFavoritePlace(origin);
    const gauge = clampNumber(byId("gaugeInput").value, 0, 100, 25);
    const litersToBuy = Math.max(vehicle.tankLiters * (1 - gauge / 100), 0);
    state.decisionLitersToBuy = litersToBuy;
    updateDecisionLitersHeaders(litersToBuy);

    if (litersToBuy <= 0.05) {
      throw new Error("Le réservoir est déjà plein.");
    }

    let candidates = availableStations(fuel)
      .map((station) => {
        const aerialDistance = haversineKm(origin.lat, origin.lon, station.lat, station.lon);
        const roughDistanceOneWay = aerialDistance * 1.22;
        const roughDurationOneWay = (roughDistanceOneWay / 55) * 60;
        return {
          station,
          fuelInfo: station.fuels[fuel],
          aerialDistance,
          oneWayDistanceKm: roughDistanceOneWay,
          oneWayDurationMin: roughDurationOneWay,
          roundTripDistanceKm: roughDistanceOneWay * 2,
          roundTripDurationMin: roughDurationOneWay * 2,
          routeEstimated: true,
        };
      })
      .filter((candidate) => candidate.aerialDistance <= MAX_SEARCH_KM);

    if (!candidates.length) {
      throw new Error(`Aucune station ${fuel} trouvée dans un rayon de ${MAX_SEARCH_KM} km.`);
    }

    candidates.forEach((candidate) => applyDecisionCosts(candidate, vehicle, litersToBuy));
    candidates.sort((a, b) => compareDecisionCandidates(a, b, decisionSortForMode(state.decisionMode)));

    const routeTargets = candidates.slice(0, Math.min(MAX_ROUTE_CALLS, candidates.length));
    let routed = 0;
    await processPool(routeTargets, ROUTE_CONCURRENCY, async (candidate) => {
      const route = await withTimeout(routeToStation(origin, candidate.station), ROUTE_TIMEOUT_MS + 400, null);
      if (route) {
        candidate.oneWayDistanceKm = route.distanceKm;
        candidate.oneWayDurationMin = route.durationMin;
        candidate.roundTripDistanceKm = route.distanceKm * 2;
        candidate.roundTripDurationMin = route.durationMin * 2;
        candidate.routeEstimated = false;
        applyDecisionCosts(candidate, vehicle, litersToBuy);
      }
      routed += 1;
      setText(
        "decisionStatus",
        `Itinéraires ${routed}/${routeTargets.length} - ${candidates.length} stations`
      );
    });

    state.decisionSort = decisionSortForMode(state.decisionMode);
    candidates.sort((a, b) => compareDecisionCandidates(a, b, state.decisionSort));
    state.decisionAllCandidates = candidates;
    state.decisionCandidates = sortDecisionCandidates(candidates, state.decisionSort).slice(0, 5);
    renderDecisionSummary(candidates, vehicle, litersToBuy);
    renderDecisionResults();
    renderDecisionMap(state.decisionCandidates, { origin });
    setText("decisionStatus", `${candidates.length} stations analysées`);
    enterResultsMode();
  } catch (error) {
    byId("decisionResults").innerHTML = `<tr><td colspan="${decisionColumnCount()}" class="empty-cell">${escapeHtml(
      error.message || "Calcul impossible."
    )}</td></tr>`;
    setText("decisionStatus", "Calcul interrompu");
    setText("locationStatus", error.message || "Calcul impossible.");
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

async function runRouteDecision() {
  const buttons = [...document.querySelectorAll("[data-decision-mode]")];
  buttons.forEach((button) => {
    button.disabled = true;
  });
  syncDecisionTimeColumn();
  showRouteProgress(4, "Préparation du trajet");
  setText("decisionStatus", "");
  showDecisionLoader();
  byId("decisionMap").hidden = true;

  try {
    const vehicle = selectedVehicle();
    const fuel = vehicle.fuel;
    const origin = await resolveOrigin();
    ensureDefaultFavoritePlace(origin);
    const destinationText = byId("destinationInput").value.trim();
    if (!destinationText) {
      throw new Error("Indique une ville d'arrivée.");
    }
    const destination = await geocodeCity(destinationText);
    const gauge = clampNumber(byId("gaugeInput").value, 0, 100, 30);
    const route = await routeBetween(origin, destination, { avoidTolls: !byId("allowTolls").checked });
    const routeOptions = equivalentRouteOptions(route.alternatives?.length ? route.alternatives : [route]);
    const analyzedRoutes = routeOptions.length ? routeOptions : [route];
    showRouteProgress(15, "Route trouvée");

    const initialLiters = vehicle.tankLiters * (gauge / 100);
    const consumption = clampNumber(vehicle.consumptionL100, 2, 20, 5.5);
    const stations = availableStations(fuel);
    let candidates = [];

    if (state.decisionMode === "routeLate") {
      const bestByStation = new Map();
      analyzedRoutes.forEach((routeOption, routeIndex) => {
        const routePoints = sampleRouteKilometers(routeOption.coordinates, routeOption.distanceKm);
        buildLateRouteCandidates(routePoints, stations, vehicle, fuel, initialLiters, consumption).forEach((candidate) => {
          candidate.routeOptionIndex = routeIndex + 1;
          const previous = bestByStation.get(candidate.station.id);
          if (!previous || candidate.vehicleLiter < previous.vehicleLiter) {
            bestByStation.set(candidate.station.id, candidate);
          }
        });
      });
      candidates = [...bestByStation.values()].sort((a, b) => a.vehicleLiter - b.vehicleLiter).slice(0, 10);
      state.decisionSort = "vehicle";
      showRouteProgress(90, "Stations atteignables");
    } else {
      // « Le plein le moins cher » sur le trajet.
      // Marge de sécurité : on garde toujours 10 % du réservoir. Le carburant utilisable
      // (jauge - 10 %) détermine jusqu'où on analyse les points km du trajet.
      const tank = clampNumber(vehicle.tankLiters, 5, 140, 40);
      const safetyLiters = tank * TANK_SAFETY_RATIO;
      const usableLiters = Math.max(0, initialLiters - safetyLiters);
      const reachableKm = (usableLiters / consumption) * 100;
      const totalAutonomyKm = (initialLiters / consumption) * 100;
      const stationBest = new Map();

      for (const [routeIndex, routeOption] of analyzedRoutes.entries()) {
        const allPoints = sampleRouteKilometers(routeOption.coordinates, routeOption.distanceKm);
        // On ne calcule que sur les points km atteignables avec le carburant utilisable (hors réserve 10 %).
        const reachablePoints = allPoints.filter((point) => point.km <= reachableKm + 0.001);
        if (!reachablePoints.length) {
          continue;
        }
        // Pré-filtre géographique : bounding box du tronçon atteignable élargie du rayon de recherche,
        // pour ne tester que les stations potentiellement à moins de 10 km du trajet (accélère le calcul).
        const meanLat = reachablePoints[Math.floor(reachablePoints.length / 2)].lat;
        const latPad = ROUTE_AERIAL_RADIUS_KM / 111;
        const lonPad = ROUTE_AERIAL_RADIUS_KM / (111 * Math.max(Math.cos(toRad(meanLat)), 0.2));
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLon = Infinity;
        let maxLon = -Infinity;
        reachablePoints.forEach((point) => {
          minLat = Math.min(minLat, point.lat);
          maxLat = Math.max(maxLat, point.lat);
          minLon = Math.min(minLon, point.lon);
          maxLon = Math.max(maxLon, point.lon);
        });
        const nearbyStations = stations.filter(
          (station) =>
            station.lat >= minLat - latPad &&
            station.lat <= maxLat + latPad &&
            station.lon >= minLon - lonPad &&
            station.lon <= maxLon + lonPad
        );

        let processed = 0;
        for (const station of nearbyStations) {
          // Point km le plus proche de la station (= plus petit détour) parmi les points atteignables.
          // Une station peut être proche de plusieurs points km ; on ne garde que le meilleur.
          const nearest = nearestRoutePointForStation(station, reachablePoints);
          if (!nearest || nearest.distanceKm > ROUTE_AERIAL_RADIUS_KM) {
            continue;
          }
          const oneWayDetourKm = nearest.distanceKm * ROAD_DETOUR_FACTOR;
          const arrivalKm = nearest.point.km + oneWayDetourKm;
          // La voiture doit pouvoir rejoindre physiquement la station : le détour final peut puiser
          // dans la réserve de 10 % puisque c'est précisément là qu'elle refait le plein.
          if (arrivalKm > totalAutonomyKm) {
            continue;
          }
          const remainingLitersAtRoute = initialLiters - (nearest.point.km * consumption) / 100;
          const arrivalLiters = Math.max(0, initialLiters - (arrivalKm * consumption) / 100);
          const litersToBuy = Math.max(tank - arrivalLiters, 0);
          if (litersToBuy <= 0.1) {
            continue;
          }
          // Détour net = aller + retour sur l'itinéraire (la distance d'itinéraire évitée est déjà
          // décomptée car le détour est mesuré depuis le point km, pas depuis le départ).
          const netDetourKm = oneWayDetourKm * 2;
          const candidate = {
            station,
            fuelInfo: station.fuels[fuel],
            routeKm: nearest.point.km,
            routeTotalKm: routeOption.distanceKm,
            routeOptionIndex: routeIndex + 1,
            remainingLitersAtRoute,
            litersToBuy,
            remainingFuelPercent: clampNumber((arrivalLiters / tank) * 100, 0, 100, 0),
            safeAutonomyKm: (arrivalLiters / consumption) * 100,
            routePointLat: nearest.point.lat,
            routePointLon: nearest.point.lon,
            aerialDistance: nearest.distanceKm,
            oneWayDistanceKm: oneWayDetourKm,
            oneWayDurationMin: (oneWayDetourKm / 45) * 60,
            roundTripDistanceKm: netDetourKm,
            roundTripDurationMin: (netDetourKm / 45) * 60,
            routeEstimated: true,
          };
          applyDecisionCosts(candidate, vehicle, litersToBuy);
          const previous = stationBest.get(station.id);
          if (!previous || candidate.vehicleLiter < previous.vehicleLiter) {
            stationBest.set(station.id, candidate);
          }
          processed += 1;
          if (processed % 400 === 0) {
            const routeWeight = (routeIndex + 0.5) / Math.max(analyzedRoutes.length, 1);
            showRouteProgress(15 + routeWeight * 80, "Analyse des stations");
            await nextFrame();
          }
        }
      }
      // On garde un tampon de candidats (par €/L estimé à vol d'oiseau) ; le détour routier réel
      // est calculé ensuite, puis on écarte les détours aberrants avant de retenir le top 10.
      candidates = [...stationBest.values()].sort((a, b) => a.vehicleLiter - b.vehicleLiter).slice(0, ROUTE_CANDIDATE_BUFFER);
      state.decisionSort = "vehicle";
    }
    if (!candidates.length) {
      throw new Error("Aucune station pertinente trouvée sur ce trajet avec l'autonomie disponible.");
    }
    await refineRouteCandidateDistances(candidates, vehicle);
    if (state.decisionMode !== "routeLate") {
      // Après le calcul d'itinéraire réel : écarte les stations au détour routier impraticable.
      const reasonable = candidates.filter((candidate) => oneWayDistance(candidate) <= MAX_ROUTE_DETOUR_ONE_WAY_KM);
      candidates = (reasonable.length ? reasonable : candidates).slice(0, 10);
    } else {
      candidates = candidates.slice(0, 10);
    }

    state.decisionAllCandidates = candidates;
    state.decisionCandidates = candidates;
    state.decisionLitersToBuy = candidates[0].litersToBuy;
    updateDecisionLitersHeaders(candidates[0].litersToBuy);
    renderDecisionSummary(candidates);
    renderDecisionResults();
    renderDecisionMap(candidates, {
      origin,
      destination,
      routeLine: route.estimated ? [] : route.coordinates,
    });
    showRouteProgress(100, "Résultat prêt");
    setText("decisionStatus", `${candidates.length} stations affichées sur le trajet`);
    enterResultsMode();
  } catch (error) {
    byId("decisionResults").innerHTML = `<tr><td colspan="${decisionColumnCount()}" class="empty-cell">${escapeHtml(
      error.message || "Calcul impossible."
    )}</td></tr>`;
    setText("decisionStatus", "Calcul interrompu");
    setText("locationStatus", error.message || "Calcul impossible.");
  } finally {
    window.setTimeout(() => hideRouteProgress(), 900);
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

function buildLateRouteCandidates(routePoints, stations, vehicle, fuel, initialLiters, consumption) {
  if (!routePoints.length || initialLiters <= 0) {
    return [];
  }
  const initialAutonomyKm = (initialLiters / consumption) * 100;
  const triggerKm = Math.max(0, initialAutonomyKm - 100);
  const foundTriggerIndex = routePoints.findIndex((point) => point.km >= triggerKm);
  const triggerIndex = foundTriggerIndex >= 0 ? foundTriggerIndex : routePoints.length - 1;
  const triggerPoint = routePoints[triggerIndex];
  const triggerRemainingLiters = initialLiters - (triggerPoint.km * consumption) / 100;
  const maxReachFromTriggerKm = Math.min(30, Math.max(0, (triggerRemainingLiters / consumption) * 100 - 70));
  if (maxReachFromTriggerKm <= 0) {
    return [];
  }

  return stations
    .map((station) => {
      const nearest = nearestRoutePointForStation(station, routePoints, triggerIndex);
      if (!nearest) {
        return null;
      }
      const routeTravelFromTriggerKm = Math.max(0, nearest.point.km - triggerPoint.km);
      const detourKm = nearest.distanceKm * 1.22;
      const reachNeededKm = routeTravelFromTriggerKm + detourKm;
      const remainingLiters = initialLiters - (nearest.point.km * consumption) / 100;
      const remainingAtStationLiters = Math.max(0, remainingLiters - (detourKm * consumption) / 100);
      const litersToBuy = Math.max(vehicle.tankLiters - remainingAtStationLiters, 0);
      if (reachNeededKm > maxReachFromTriggerKm || remainingAtStationLiters <= 0 || litersToBuy <= 0.1) {
        return null;
      }
      const candidate = {
        station,
        fuelInfo: station.fuels[fuel],
        routeKm: nearest.point.km,
        routeTotalKm: routePoints[routePoints.length - 1]?.km || nearest.point.km,
        remainingLitersAtRoute: remainingLiters,
        litersToBuy,
        ...routeFuelEstimate(vehicle, remainingLiters, consumption, routePoints[routePoints.length - 1]?.km || nearest.point.km, detourKm),
        routePointLat: nearest.point.lat,
        routePointLon: nearest.point.lon,
        aerialDistance: nearest.distanceKm,
        oneWayDistanceKm: detourKm,
        oneWayDurationMin: (detourKm / 45) * 60,
        roundTripDistanceKm: detourKm * 2,
        roundTripDurationMin: (detourKm / 45) * 120,
        routeEstimated: true,
      };
      applyDecisionCosts(candidate, vehicle, litersToBuy);
      if ((candidate.safeAutonomyKm ?? 0) < 30) {
        return null;
      }
      return candidate;
    })
    .filter(Boolean)
    .sort((a, b) => a.vehicleLiter - b.vehicleLiter || oneWayDistance(a) - oneWayDistance(b) || a.routeKm - b.routeKm)
    .slice(0, 10);
}

async function refineRouteCandidateDistances(candidates, vehicle) {
  const targets = candidates.filter((candidate) => candidate.routeEstimated && candidate.routePointLat && candidate.routePointLon);
  const tank = clampNumber(vehicle.tankLiters, 5, 140, 40);
  const consumption = clampNumber(vehicle.consumptionL100, 2, 20, 5.5);
  await processPool(targets.slice(0, ROUTE_CANDIDATE_BUFFER), ROUTE_CONCURRENCY, async (candidate) => {
    // Affine le détour estimé (à vol d'oiseau × 1,22) par un vrai calcul d'itinéraire
    // du point km vers la station, pour les candidats retenus.
    const route = await withTimeout(
      routeToStation({ lat: candidate.routePointLat, lon: candidate.routePointLon }, candidate.station),
      ROUTE_TIMEOUT_MS + 400,
      null
    );
    if (!route) {
      return;
    }
    const oneWayDetourKm = route.distanceKm;
    const netDetourKm = oneWayDetourKm * 2;
    candidate.oneWayDistanceKm = oneWayDetourKm;
    candidate.oneWayDurationMin = route.durationMin;
    candidate.roundTripDistanceKm = netDetourKm;
    candidate.roundTripDurationMin = route.durationMin * 2;
    candidate.routeEstimated = false;
    if (Number.isFinite(candidate.remainingLitersAtRoute)) {
      const arrivalLiters = Math.max(0, candidate.remainingLitersAtRoute - (oneWayDetourKm * consumption) / 100);
      candidate.litersToBuy = Math.max(tank - arrivalLiters, 0);
      candidate.remainingFuelPercent = clampNumber((arrivalLiters / tank) * 100, 0, 100, 0);
      candidate.safeAutonomyKm = (arrivalLiters / consumption) * 100;
    }
    applyDecisionCosts(candidate, vehicle, candidate.litersToBuy);
  });
  candidates.sort((a, b) => compareDecisionCandidates(a, b, state.decisionSort || "vehicle"));
}

function nearestRoutePointForStation(station, routePoints, startIndex = 0) {
  let best = null;
  for (let index = startIndex; index < routePoints.length; index += 1) {
    const point = routePoints[index];
    const distanceKm = haversineKm(point.lat, point.lon, station.lat, station.lon);
    if (!best || distanceKm < best.distanceKm) {
      best = { point, distanceKm };
    }
  }
  return best;
}

function routeFuelEstimate(vehicle, remainingLiters, consumption, routeDistanceKm = 0, detourToStationKm = 0) {
  const tank = clampNumber(vehicle.tankLiters, 5, 140, 40);
  const routeSafetyLiters = Math.max(0, (routeDistanceKm * 0.2 * consumption) / 100);
  const detourLiters = Math.max(0, (detourToStationKm * consumption) / 100);
  const displayLiters = Math.max(0, remainingLiters - detourLiters - routeSafetyLiters);
  return {
    remainingFuelPercent: clampNumber((displayLiters / tank) * 100, 0, 100, 0),
    safeAutonomyKm: (displayLiters / consumption) * 100,
  };
}

async function routeBetween(origin, destination, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS + 2500);
  const urls = routeUrls(origin, destination, options);
  try {
    if (options.avoidTolls) {
      const valhalla = await valhallaRouteBetween(origin, destination, controller.signal);
      if (valhalla) {
        return valhalla;
      }
    }
    let lastError = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`OSRM ${response.status}`);
        }
        const data = await response.json();
        const route = selectPreferredRoute(data.routes || []);
        if (!route?.geometry?.coordinates?.length) {
          throw new Error("No route");
        }
        const mappedRoutes = (data.routes || [])
          .filter((item) => item?.geometry?.coordinates?.length)
          .map(osrmRouteToAppRoute);
        return {
          ...osrmRouteToAppRoute(route),
          alternatives: equivalentRouteOptions(mappedRoutes),
        };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("No route");
  } catch {
    const distanceKm = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon) * 1.22;
    return {
      distanceKm,
      durationMin: (distanceKm / 65) * 60,
      coordinates: [origin, destination],
      estimated: true,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

function osrmRouteToAppRoute(route) {
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    coordinates: route.geometry?.coordinates?.map(([lon, lat]) => ({ lat, lon })) || [],
  };
}

function equivalentRouteOptions(routes) {
  const usable = (Array.isArray(routes) ? routes : [routes]).filter((route) => route?.coordinates?.length);
  if (!usable.length) {
    return [];
  }
  const fastest = Math.min(...usable.map((route) => route.durationMin || Infinity));
  const seen = new Set();
  return usable
    .filter((route) => route.durationMin <= fastest * 1.1)
    .sort((a, b) => a.durationMin - b.durationMin || a.distanceKm - b.distanceKm)
    .filter((route) => {
      const signature = `${Math.round(route.distanceKm * 10)}:${Math.round(route.durationMin)}`;
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    })
    .slice(0, 2);
}

async function valhallaRouteBetween(origin, destination, signal) {
  const payload = {
    locations: [
      { lat: origin.lat, lon: origin.lon, type: "break" },
      { lat: destination.lat, lon: destination.lon, type: "break" },
    ],
    costing: "auto",
    units: "kilometers",
    directions_options: { units: "kilometers" },
    costing_options: {
      auto: {
        use_tolls: 0,
        toll_booth_penalty: 1200,
        toll_booth_cost: 1800,
        use_highways: 0.35,
      },
    },
  };
  try {
    const response = await fetch(`${VALHALLA_ROUTE_URL}?json=${encodeURIComponent(JSON.stringify(payload))}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const leg = data.trip?.legs?.[0];
    const summary = data.trip?.summary || leg?.summary;
    if (!leg?.shape || !summary) {
      return null;
    }
    return {
      distanceKm: Number(summary.length) || haversineKm(origin.lat, origin.lon, destination.lat, destination.lon) * 1.22,
      durationMin: Number(summary.time) ? Number(summary.time) / 60 : 0,
      coordinates: decodeValhallaShape(leg.shape),
    };
  } catch {
    return null;
  }
}

function decodeValhallaShape(encoded) {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  while (index < encoded.length) {
    const latResult = decodePolylineValue(encoded, index);
    lat += latResult.value;
    index = latResult.index;
    const lonResult = decodePolylineValue(encoded, index);
    lon += lonResult.value;
    index = lonResult.index;
    coordinates.push({ lat: lat * 1e-6, lon: lon * 1e-6 });
  }
  return coordinates;
}

function decodePolylineValue(encoded, startIndex) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = null;
  do {
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);
  return {
    value: result & 1 ? ~(result >> 1) : result >> 1,
    index,
  };
}

function routeUrls(origin, destination, options = {}) {
  const base = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
  const common = "overview=full&geometries=geojson&alternatives=true&steps=false";
  const urls = [];
  if (options.avoidTolls) {
    urls.push(`${base}?${common}&exclude=motorway,toll`);
    urls.push(`${base}?${common}&exclude=motorway`);
    return urls;
  }
  urls.push(`${base}?${common}`);
  return urls;
}

function sampleRouteKilometers(coordinates, routeDistanceKm) {
  if (!coordinates.length) {
    return [];
  }
  if (coordinates.length === 1) {
    return [{ ...coordinates[0], km: 0 }];
  }
  const points = [{ ...coordinates[0], km: 0 }];
  let nextKm = 1;
  let traveled = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    const segmentKm = haversineKm(previous.lat, previous.lon, current.lat, current.lon);
    while (traveled + segmentKm >= nextKm && nextKm <= routeDistanceKm) {
      const ratio = (nextKm - traveled) / Math.max(segmentKm, 0.001);
      points.push({
        lat: previous.lat + (current.lat - previous.lat) * ratio,
        lon: previous.lon + (current.lon - previous.lon) * ratio,
        km: nextKm,
      });
      nextKm += 1;
    }
    traveled += segmentKm;
  }
  points.push({ ...coordinates[coordinates.length - 1], km: Math.round(routeDistanceKm) });
  return points;
}

function showDecisionLoader() {
  byId("decisionResults").innerHTML = `
    <tr><td colspan="${decisionColumnCount()}" class="decision-loader-cell">
      <img class="decision-loader-croc" src="assets/mascot-center.png" alt="" />
    </td></tr>
  `;
}

function showRouteProgress(percent, label) {
  const node = byId("routeProgress");
  node.hidden = false;
  setText("routeProgressLabel", label);
  setText("routeProgressPercent", `${Math.round(percent)}%`);
  byId("routeProgressFill").style.width = `${clampNumber(percent, 0, 100, 0)}%`;
}

function hideRouteProgress() {
  byId("routeProgress").hidden = true;
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function applyDecisionCosts(candidate, vehicle, litersToBuy) {
  const price = candidate.fuelInfo.price;
  const hourlyValue = state.settings.ignoreTimeCost ? 0 : state.settings.timeMinutesFor10;
  const roundTripDistance = candidate.roundTripDistanceKm ?? candidate.distanceKm ?? 0;
  const roundTripDuration = candidate.roundTripDurationMin ?? candidate.durationMin ?? 0;
  const consumptionCostKm = (clampNumber(vehicle.consumptionL100, 2, 20, 6) / 100) * price;
  const depreciationKm = clampNumber(vehicle.depreciationKm, 0, 1, 0.055);
  candidate.litersToBuy = litersToBuy;
  candidate.fillCost = litersToBuy * price;
  candidate.kmCost = roundTripDistance * (depreciationKm + consumptionCostKm);
  candidate.timeCost = (roundTripDuration / 60) * hourlyValue;
  candidate.vehicleTotalCost = candidate.fillCost + candidate.kmCost;
  candidate.totalCost = candidate.vehicleTotalCost + candidate.timeCost;
  candidate.vehicleLiter = candidate.vehicleTotalCost / litersToBuy;
  candidate.effectiveLiter = candidate.totalCost / litersToBuy;
}


function renderDecisionSummary(candidates) {
  if (!candidates.length) {
    byId("decisionSummary").innerHTML = "";
    return;
  }
  if (state.analysisMode === "route") {
    const routeLate = state.decisionMode === "routeLate";
    const candidate = sortDecisionCandidates(candidates, "vehicle")[0];
    byId("decisionSummary").innerHTML = `
      <div class="metric recommendation-card ${routeLate ? "" : "accent-card"}">
        <span>${routeLate ? "Faire le plein le plus tard possible" : "Le plein le plus €co du trajet"}</span>
        <strong>${formatEuro(candidate.vehicleTotalCost)}<span class="rec-liter-price">(${formatEuro(candidate.fuelInfo.price, 3)}/L)</span></strong>
        <div class="rec-heading">
          ${stationIdentityHtml(candidate.station)}
          <span class="rec-distance">${formatEuro(candidate.vehicleLiter, 3)}/L total - point ${formatNumber(candidate.routeKm, 0)} km - détour net ${formatNumber(candidate.roundTripDistanceKm ?? 0, 1)} km</span>
        </div>
      </div>
    `;
    setText("locationStatus", "");
    return;
  }
  // D : la carte « moins cher » suit le tri actif du tableau -> elle correspond toujours à la 1re ligne.
  const cheapestSort = state.decisionSort || state.settings.priceView || "vehicle";
  const cheapest = sortDecisionCandidates(candidates, cheapestSort)[0];
  const nearest = sortDecisionCandidates(candidates, "nearest")[0];
  let recommendations;
  if (cheapest && nearest && cheapest.station.id === nearest.station.id) {
    // C : station la plus proche = la moins chère -> une seule carte au lieu de deux identiques.
    recommendations = [{ title: "La plus proche ET la moins chère", accent: true, candidate: cheapest }];
  } else {
    recommendations = [
      { title: "Le plein le moins cher (€co)", accent: true, candidate: cheapest },
      { title: "Station la plus proche (km)", accent: false, candidate: nearest },
    ];
  }
  byId("decisionSummary").innerHTML = recommendations
    .map(({ title, accent, candidate }) => {
      if (!candidate) {
        return "";
      }
      return `
        <div class="metric recommendation-card${accent ? " accent-card" : ""}">
          <span>${escapeHtml(title)}</span>
          <strong>${formatEuro(decisionTotalForDisplay(candidate))}<span class="rec-liter-price">(${formatEuro(candidate.fuelInfo.price, 3)}/L)</span></strong>
          <div class="rec-heading">
            ${stationIdentityHtml(candidate.station)}
            <span class="rec-distance">${formatNumber(oneWayDistance(candidate), 1)} km - ${formatMinutes(oneWayDuration(candidate))}</span>
          </div>
        </div>
      `;
    })
    .join("");
  setText("locationStatus", "");
}

function renderDecisionResults() {
  const selectedView = state.settings.priceView || "vehicle";
  const sortKey = state.decisionSort || selectedView;
  const showTimeCost = !state.settings.ignoreTimeCost;
  syncDecisionTimeColumn();
  syncDecisionColumnVisibility();
  document.querySelectorAll("[data-decision-sort]").forEach((button) => {
    button.classList.toggle("active", button.dataset.decisionSort === sortKey);
  });

  const candidates = [...state.decisionCandidates]
    .sort((a, b) => compareDecisionCandidates(a, b, sortKey))
    .slice(0, state.analysisMode === "route" ? 10 : 5);

  if (!candidates.length) {
    byId("decisionResults").innerHTML = `<tr><td colspan="${decisionColumnCount()}" class="empty-cell">Aucune station dans ce temps maximum.</td></tr>`;
    return;
  }

  updateDecisionLitersHeaders(state.decisionLitersToBuy || 0);
  const routeMode = state.analysisMode === "route";
  byId("decisionResults").innerHTML = candidates
    .map((candidate, index) => {
      const station = candidate.station;
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`;
      const wazeUrl = `https://waze.com/ul?ll=${station.lat},${station.lon}&navigate=yes`;
      const liters = candidate.litersToBuy || state.decisionLitersToBuy;
      const timeCostCell = showTimeCost
        ? `<td class="time-cost-column"><strong>${formatEuro(candidate.totalCost)}</strong><br><span class="muted">${formatNumber(liters, 1)} L - ${formatEuro(
            candidate.effectiveLiter,
            3
          )}/L</span></td>`
        : "";
      // Mode trajet : Point km / Jauge à l'arrivée / Détour net / Litres du plein / Prix du plein.
      const routeKmCell = routeMode
        ? `<td class="route-only-column"><strong>${formatNumber(candidate.routeKm ?? 0, 0)} km</strong><br><span class="muted">/ ${formatNumber(
            candidate.routeTotalKm ?? candidate.routeKm ?? 0,
            0
          )} km</span></td>`
        : "";
      const fuelRemainingCell = routeMode
        ? `<td class="route-only-column"><strong>${formatNumber(candidate.remainingFuelPercent ?? 0, 0)}%</strong><br><span class="muted">~${formatNumber(
            candidate.safeAutonomyKm ?? 0,
            0
          )} km</span></td>`
        : "";
      const distanceCell = routeMode
        ? `<td class="distance-column"><strong>${formatNumber(candidate.roundTripDistanceKm ?? 0, 1)} km${candidate.routeEstimated ? " *" : ""}</strong><br><span class="muted">aller ${formatNumber(
            oneWayDistance(candidate),
            1
          )} km</span></td>`
        : `<td class="distance-column"><strong>${formatNumber(oneWayDistance(candidate), 1)} km${candidate.routeEstimated ? " *" : ""}</strong><br><span class="muted">${formatMinutes(
            oneWayDuration(candidate)
          )}</span></td>`;
      const fillCell = routeMode
        ? `<td class="fill-cost-column"><strong>${formatNumber(liters, 1)} L</strong><br><span class="muted">${formatEuro(candidate.fuelInfo.price, 3)}/L</span></td>`
        : `<td class="fill-cost-column"><strong>${formatEuro(candidate.fillCost)}</strong><br><span class="muted">${formatNumber(liters, 1)} L - ${formatEuro(candidate.fuelInfo.price, 3)}/L</span></td>`;
      const vehicleCell = routeMode
        ? `<td class="vehicle-cost-column"><strong>${formatEuro(candidate.vehicleTotalCost)}</strong><br><span class="muted">${formatEuro(
            candidate.vehicleLiter,
            3
          )}/L total</span></td>`
        : `<td class="vehicle-cost-column"><strong>${formatEuro(candidate.vehicleTotalCost)}</strong><br><span class="muted">${formatNumber(liters, 1)} L - ${formatEuro(
            candidate.vehicleLiter,
            3
          )}/L</span></td>`;
      const mapsWaze = `<a class="mini-link" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a> <a class="mini-link" href="${wazeUrl}" target="_blank" rel="noreferrer">Waze</a>`;
      // Détail replié visible uniquement sur mobile (les colonnes secondaires y sont masquées).
      const mobileExtra = routeMode
        ? `<div class="row-mobile-extra" hidden>
            <span>Jauge à l'arrivée : <strong>${formatNumber(candidate.remainingFuelPercent ?? 0, 0)} %</strong></span>
            <span>Litres du plein : <strong>${formatNumber(liters, 1)} L</strong> (${formatEuro(candidate.fuelInfo.price, 3)}/L)</span>
            <span class="route-links">${mapsWaze}</span>
          </div>`
        : `<div class="row-mobile-extra" hidden>
            <span>Carburant seul : <strong>${formatEuro(candidate.fillCost)}</strong> (${formatEuro(candidate.fuelInfo.price, 3)}/L)</span>
            ${showTimeCost ? `<span>Avec temps payé : <strong>${formatEuro(candidate.totalCost)}</strong> (${formatEuro(candidate.effectiveLiter, 3)}/L)</span>` : ""}
            <span class="route-links">${mapsWaze}</span>
          </div>`;
      return `
        <tr>
          <td>
            ${stationIdentityHtml(station, `${index + 1}. `)}
            ${mobileExtra}
          </td>
          ${routeKmCell}
          ${fuelRemainingCell}
          ${distanceCell}
          ${fillCell}
          ${vehicleCell}
          ${timeCostCell}
          <td class="route-links-column">
            <span class="route-links">
              <a class="mini-link" href="${mapsUrl}" target="_blank" rel="noreferrer">Maps</a>
              <a class="mini-link" href="${wazeUrl}" target="_blank" rel="noreferrer">Waze</a>
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
  syncDecisionColumnVisibility();
}

function stationIdentityHtml(station, prefix = "") {
  return `
    <div class="station-cell compact-station-cell">
      <button class="station-name-toggle" type="button" data-toggle-station-address>
        <strong>${escapeHtml(prefix)}${renderStationNameHtml(station)}</strong>
      </button>
      <span class="station-address" hidden>${escapeHtml(stationFullAddress(station))}</span>
    </div>
  `;
}

function visibleDecisionColumns() {
  if (state.analysisMode === "route") {
    // Mode trajet : colonnes imposées (Litres du plein + Prix du plein), colonne temps masquée.
    return { fill: true, vehicle: true, time: false };
  }
  const selected = state.settings.priceView || "vehicle";
  const preferences = state.settings.columnPreferences?.local || {};
  const visible = {
    fill: Boolean(preferences.fill),
    vehicle: Boolean(preferences.vehicle),
    time: Boolean(preferences.time),
  };
  visible[selected] = true;
  if (state.settings.ignoreTimeCost) {
    visible.time = false;
  }
  return visible;
}

function syncDecisionColumnVisibility() {
  const visible = visibleDecisionColumns();
  const routeMode = state.analysisMode === "route";
  document.querySelectorAll(".route-only-column").forEach((node) => {
    node.hidden = !routeMode;
  });
  document.querySelectorAll(".fill-cost-column").forEach((node) => {
    node.hidden = !visible.fill;
  });
  document.querySelectorAll(".vehicle-cost-column").forEach((node) => {
    node.hidden = !visible.vehicle;
  });
  document.querySelectorAll(".time-cost-column").forEach((node) => {
    node.hidden = !visible.time;
  });
}

function renderDecisionMap(candidates, context = {}) {
  const mapNode = byId("decisionMap");
  if (!mapNode || !window.L || !candidates.length) {
    if (mapNode) {
      mapNode.hidden = true;
    }
    return;
  }
  mapNode.hidden = false;
  if (state.decisionMap) {
    state.decisionMap.remove();
    state.decisionMap = null;
  }
  mapNode.innerHTML = "";
  const map = L.map(mapNode, {
    zoomControl: true,
    scrollWheelZoom: true,
    preferCanvas: true,
  });
  state.decisionMap = map;
  const baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(map);
  baseLayer.on("tileerror", () => {
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
  });

  const bounds = [];
  if (context.routeLine?.length) {
    const line = context.routeLine.map((point) => [point.lat, point.lon]);
    L.polyline(line, { color: "#0f766e", weight: 4, opacity: 0.75 }).addTo(map);
    line.forEach((point) => bounds.push(point));
  }
  if (context.origin) {
    bounds.push([context.origin.lat, context.origin.lon]);
    L.circleMarker([context.origin.lat, context.origin.lon], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#3b82f6",
      fillOpacity: 1,
    }).bindPopup("Départ").addTo(map);
  }
  if (context.destination) {
    bounds.push([context.destination.lat, context.destination.lon]);
    L.circleMarker([context.destination.lat, context.destination.lon], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#f5b82e",
      fillOpacity: 1,
    }).bindPopup("Arrivée").addTo(map);
  }

  candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => (a.index === 0 ? 1 : 0) - (b.index === 0 ? 1 : 0))
    .forEach(({ candidate, index }) => {
    const station = candidate.station;
    const best = index === 0;
    bounds.push([station.lat, station.lon]);
    L.circleMarker([station.lat, station.lon], {
      radius: best ? 12 : 10,
      color: "#111111",
      weight: 2,
      fillColor: "#111111",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);
    L.circleMarker([station.lat, station.lon], {
      radius: best ? 9 : 7.5,
      color: "#ffffff",
      weight: 2,
      fillColor: "#ffffff",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);
    L.circleMarker([station.lat, station.lon], {
      radius: best ? 7 : 5.5,
      color: best ? "#f5b82e" : "#0f766e",
      weight: 1,
      fillColor: best ? "#f5b82e" : "#0f766e",
      fillOpacity: 1,
    })
      .bindPopup(`
        <strong>${renderStationNameHtml(station)}</strong><br>
        ${escapeHtml(stationFullAddress(station))}<br>
        ${candidate.routeKm !== undefined ? `Point ${formatNumber(candidate.routeKm, 0)} km - détour net ${formatNumber(candidate.roundTripDistanceKm ?? 0, 1)} km<br>` : ""}
        Plein : ${formatEuro(candidate.vehicleTotalCost)} (${formatEuro(candidate.vehicleLiter, 3)}/L) - ${formatNumber(candidate.litersToBuy ?? 0, 1)} L${candidate.remainingFuelPercent !== undefined ? `<br>Jauge à l'arrivée : ${formatNumber(candidate.remainingFuelPercent, 0)} %` : ""}
      `)
      .addTo(map);
    });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 13);
  }
  window.setTimeout(() => map.invalidateSize(), 0);
}

function decisionSortForMode(mode) {
  if (mode === "routeLate") {
    return "vehicle";
  }
  if (mode === "nearest") {
    return "nearest";
  }
  if (mode === "fuel") {
    return "fuel";
  }
  return state.settings.priceView || "vehicle";
}

function sortDecisionCandidates(candidates, sortKey) {
  return [...candidates].sort((a, b) => compareDecisionCandidates(a, b, sortKey));
}

function compareDecisionCandidates(a, b, sortKey) {
  if (sortKey === "nearest") {
    return oneWayDistance(a) - oneWayDistance(b);
  }
  if (sortKey === "routeKm") {
    return (a.routeKm ?? 0) - (b.routeKm ?? 0);
  }
  if (sortKey === "fuelRemaining") {
    return (a.remainingFuelPercent ?? 0) - (b.remainingFuelPercent ?? 0);
  }
  if (sortKey === "fuel") {
    return a.fuelInfo.price - b.fuelInfo.price;
  }
  if (sortKey === "fill") {
    return a.fillCost - b.fillCost;
  }
  if (sortKey === "vehicle") {
    if (state.analysisMode === "route" || a.routeKm !== undefined || b.routeKm !== undefined) {
      return a.vehicleLiter - b.vehicleLiter;
    }
    return a.vehicleTotalCost - b.vehicleTotalCost;
  }
  return decisionTotalForDisplay(a) - decisionTotalForDisplay(b);
}

function oneWayDistance(candidate) {
  return candidate.oneWayDistanceKm ?? (candidate.distanceKm ? candidate.distanceKm / 2 : 0);
}

function oneWayDuration(candidate) {
  return candidate.oneWayDurationMin ?? (candidate.durationMin ? candidate.durationMin / 2 : 0);
}

function decisionTotalForDisplay(candidate) {
  return state.settings.ignoreTimeCost ? candidate.vehicleTotalCost : candidate.totalCost;
}

function decisionColumnCount() {
  const base = state.settings.ignoreTimeCost ? 5 : 6;
  return state.analysisMode === "route" ? base + 2 : base;
}

function updateDecisionLitersHeaders(liters) {
  const label = state.analysisMode === "route" ? "" : liters ? `(${formatNumber(liters, 1)} L)` : "";
  setText("fillLitersHeader", label);
  setText("fillLitersHeaderVehicle", label);
  setText("fillLitersHeaderTime", label);
}

function syncDecisionTimeColumn() {
  document.querySelectorAll(".time-cost-column").forEach((node) => {
    node.hidden = state.settings.ignoreTimeCost;
  });
  document.querySelectorAll(".route-only-column").forEach((node) => {
    node.hidden = state.analysisMode !== "route";
  });
  const routeMode = state.analysisMode === "route";
  const distanceHeader = byId("distanceSortHeader");
  if (distanceHeader) {
    distanceHeader.textContent = routeMode ? "Détour net (km)" : "Distance (km)";
  }
  setText("fuelRemainingHeaderLabel", "Jauge à l'arrivée");
  setText("fillCostHeaderLabel", routeMode ? "Litres du plein" : "Prix carburant");
  setText("vehicleCostHeaderLabel", routeMode ? "Prix du plein" : "Prix carburant");
  setText("vehicleCostHeaderSuffix", routeMode ? "carburant + coût détour net" : "+ coût trajet");
  setText("timeCostHeaderSuffix", routeMode ? "+ coût détour + temps payé" : "+ coût trajet + temps payé");
  const distanceInfo = byId("distanceInfoDot");
  if (distanceInfo) {
    distanceInfo.dataset.tooltip = routeMode
      ? "Détour net (aller-retour) à faire depuis l'itinéraire pour accéder à la station et le rejoindre."
      : "Distance entre le départ et la station, avec temps de trajet estimé.";
  }
  const vehicleInfo = byId("vehicleCostInfoDot");
  if (vehicleInfo) {
    vehicleInfo.dataset.tooltip = routeMode
      ? "Prix du plein = carburant acheté + coût du détour net (carburant et usure)."
      : "Ajoute le carburant utilisé pour arriver à la station et revenir au départ.";
  }
}

function renderStationNameHtml(station) {
  return `${escapeHtml(stationCommercialName(station))} ${stationRatingHtml(station)}`;
}

function stationRatingHtml(station) {
  const rating = stationRating(station);
  return `
    <span class="station-rating-badges" aria-label="Avis station">
      <span class="rating-pill ${ratingClass(rating.price)}" title="Prix : ${ratingLabel(rating.price)}"><i class="rating-icon price"></i></span>
      <span class="rating-pill ${ratingClass(rating.clean)}" title="Propreté : ${ratingLabel(rating.clean)}"><i class="rating-icon clean"></i></span>
      <span class="rating-pill ${ratingClass(rating.service)}" title="Service : ${ratingLabel(rating.service)}"><i class="rating-icon service"></i></span>
    </span>
  `;
}

function stationRating(station) {
  return state.settings.stationRatings?.[station.id] || { price: 2, clean: 2, service: 2, comment: "" };
}

function ratingClass(value) {
  return value >= 2 ? "good" : value >= 1 ? "medium" : "bad";
}

function ratingLabel(value) {
  return value >= 2 ? "Bon" : value >= 1 ? "Moyen" : "Mauvais";
}

function stationRatingButtonHtml(station) {
  if (!canRateStation(station)) {
    return "";
  }
  return `<button class="mini-link rate-station-button" type="button" data-rate-station="${escapeHtml(station.id)}">Noter cette station</button>`;
}

function canRateStation(station) {
  return Boolean(state.origin) && haversineKm(state.origin.lat, state.origin.lon, station.lat, station.lon) <= 0.2;
}

function passesStationRatingFilter(station) {
  const rating = stationRating(station);
  const filters = state.settings.ratingFilters || {};
  return (
    rating.price >= (filters.price ?? 0) &&
    rating.clean >= (filters.clean ?? 0) &&
    rating.service >= (filters.service ?? 0)
  );
}

function rateStation(stationId) {
  const station = state.stations.find((item) => item.id === stationId);
  if (!station || !canRateStation(station)) {
    setText("locationStatus", "Tu dois être localisé à moins de 200 m de la station pour la noter.");
    return;
  }
  if (state.settings.stationRatings?.[station.id]?.updatedAt) {
    setText("locationStatus", "Tu as déjà noté cette station.");
    return;
  }
  const current = stationRating(station);
  const price = window.prompt("Prix conforme à l'application ? 2 = oui, 0 = non", String(current.price));
  if (price === null) return;
  const clean = window.prompt("Propreté : 2 = bon, 1 = moyen, 0 = mauvais", String(current.clean));
  if (clean === null) return;
  const service = window.prompt("Service : 2 = bon, 1 = moyen, 0 = mauvais", String(current.service));
  if (service === null) return;
  const comment = window.prompt("Commentaire visible sur la fiche station (facultatif)", current.comment || "");
  state.settings.stationRatings[station.id] = {
    price: clampNumber(price, 0, 2, current.price),
    clean: clampNumber(clean, 0, 2, current.clean),
    service: clampNumber(service, 0, 2, current.service),
    comment: comment || "",
    updatedAt: new Date().toISOString(),
  };
  saveSettings();
  renderDecisionResults();
}

function stationCommercialName(station) {
  const city = titleCasePlace(station.city || "");
  const brand = commercialStationBrand(station);
  if (brand && city) {
    return `${brand} - ${city}`;
  }
  if (brand) {
    return brand;
  }
  return station.name || `Station ${city || station.cp || station.id}`;
}

// Recherche une enseigne comme mot entier (et non sous-chaîne) dans un texte normalisé.
// Évite les faux positifs : « Bretenière » ne doit pas être détecté comme « ENI ».
function brandAliasMatches(normalizedText, alias) {
  const normalizedAlias = normalizeSearchText(alias);
  if (!normalizedAlias) {
    return false;
  }
  return new RegExp(`(^| )${normalizedAlias}( |$)`).test(normalizedText);
}

function commercialStationBrand(station) {
  const raw = String(station.brand || station.name || "").trim();
  const normalized = normalizeSearchText(raw);
  const commercialBrands = [
    ["TotalEnergies Access", ["TotalEnergies Access", "Total Access"]],
    ["TotalEnergies Contact", ["TotalEnergies Contact", "Total Contact"]],
    ["TotalEnergies", ["TotalEnergies", "Total Energies", "Total"]],
    ["Carrefour Market", ["Carrefour Market"]],
    ["Carrefour Contact", ["Carrefour Contact"]],
    ["Carrefour", ["Carrefour"]],
    ["Intermarché Contact", ["Intermarché Contact"]],
    ["Intermarché", ["Intermarché", "Inter Marche"]],
    ["Netto", ["Netto"]],
    ["Coopérative U", ["Système U", "Systeme U", "Coopérative U", "Cooperative U", "Super U", "Hyper U", "U Express", "Utile"]],
    ["E.Leclerc", ["E.Leclerc", "Leclerc", "E Leclerc"]],
    ["Auchan", ["Auchan"]],
    ["Avia", ["Avia", "Picoty"]],
    ["Esso Express", ["Esso Express"]],
    ["Esso", ["Esso"]],
    ["ENI", ["ENI", "Agip"]],
  ];
  const found = commercialBrands.find(([, aliases]) => aliases.some((alias) => brandAliasMatches(normalized, alias)));
  if (found) {
    return found[0];
  }
  if (!raw || normalized.startsWith("STATION") || normalized.includes("INDEPENDANT")) {
    return "Station indépendante";
  }
  return titleCasePlace(raw.split(" - ")[0]).slice(0, 32);
}

function stationFullAddress(station) {
  return [station.address, station.cp, titleCasePlace(station.city || "")].filter(Boolean).join(" ");
}

function cleanStationBrand(value, city = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    return "Station indépendante";
  }
  const first = raw.split(" - ")[0].trim();
  const normalized = normalizeSearchText(first);
  const normalizedCity = normalizeSearchText(city);
  const brands = [
    ["Leclerc", ["leclerc", "e leclerc"]],
    ["Intermarché/Netto", ["intermarche", "inter marche", "netto"]],
    ["TotalEnergies", ["totalenergies", "total energies", "total access", "totalenergies access", "total"]],
    ["Carrefour", ["carrefour", "carrefour market", "carrefour contact"]],
    ["Coopérative U", ["systeme u", "super u", "hyper u", "u express", "cooperative u"]],
    ["Auchan", ["auchan"]],
    ["Esso", ["esso"]],
    ["Avia", ["avia", "picoty"]],
    ["Shell", ["shell"]],
    ["BP", ["bp"]],
    ["ENI", ["eni", "agip"]],
    ["Casino", ["casino", "geant casino"]],
    ["Cora", ["cora"]],
  ];
  const found = brands.find(([, aliases]) => aliases.some((alias) => brandAliasMatches(normalized, alias)));
  if (found) {
    return found[0];
  }
  if (normalized.startsWith("STATION") || (normalizedCity && normalized.includes(normalizedCity))) {
    return "Station indépendante";
  }
  return first.length <= 24 ? titleCasePlace(first) : "Station-service";
}

function titleCasePlace(value) {
  return String(value || "")
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'-])([\p{L}])/gu, (match, separator, letter) => `${separator}${letter.toLocaleUpperCase("fr-FR")}`);
}

function fuelLabel(fuel) {
  return fuel === "SP95" ? "SP95 / E10" : fuel;
}

function withTimeout(promise, timeoutMs, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

async function routeToStation(origin, station) {
  const key = `${origin.lat.toFixed(4)},${origin.lon.toFixed(4)}:${station.id}`;
  if (state.routeCache.has(key)) {
    return state.routeCache.get(key);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${station.lon},${station.lat}?overview=false&alternatives=true&steps=false`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`OSRM ${response.status}`);
    }
    const data = await response.json();
    const route = selectPreferredRoute(data.routes || []);
    if (!route) {
      throw new Error("No route");
    }
    const result = {
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
    state.routeCache.set(key, result);
    return result;
  } catch (error) {
    state.routeCache.set(key, null);
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

function selectPreferredRoute(routes) {
  if (!routes.length) {
    return null;
  }
  const byDistance = [...routes].sort((a, b) => a.distance - b.distance)[0];
  const byDuration = [...routes].sort((a, b) => a.duration - b.duration)[0];
  const extraDurationMin = (byDistance.duration - byDuration.duration) / 60;
  const extraDurationRatio = byDistance.duration / Math.max(byDuration.duration, 1);
  if (extraDurationRatio > 1.3 && extraDurationMin > 5) {
    return byDuration;
  }
  return byDistance;
}

async function processPool(items, limit, worker) {
  let index = 0;
  async function next() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(workers);
}

function setupDateControls() {
  setupGraphDates();
  setupDistributionDates();
  const latest = latestKnownDate();
  const start = latest;
  ["map", "dashboard", "brand"].forEach((prefix) => {
    setDateLimits(prefix, start, latest);
    byId(`${prefix}Start`).value = start;
    byId(`${prefix}End`).value = latest;
  });
}

function setupGraphDates(preserve = false) {
  const fuel = byId("graphFuel").value;
  const dates = datesForFuel(fuel);
  const previousStart = byId("graphStart").value;
  const previousEnd = byId("graphEnd").value;

  if (dates.length) {
    byId("graphStart").min = dates[0];
    byId("graphStart").max = dates[dates.length - 1];
    byId("graphEnd").min = dates[0];
    byId("graphEnd").max = dates[dates.length - 1];
    const latest = dates[dates.length - 1];
    const defaultStart = shiftDate(latest, -92) < dates[0] ? dates[0] : shiftDate(latest, -92);
    byId("graphStart").value = preserve && previousStart ? previousStart : defaultStart;
    byId("graphEnd").value = preserve && previousEnd ? previousEnd : latest;
  }

}

function setupDistributionDates(preserve = false) {
  const fuel = byId("distributionFuel").value;
  const dates = datesForFuel(fuel);
  const selected = preserve ? byId("distributionDate").value : "";
  const input = byId("distributionDate");
  input.min = dates[0] || "";
  input.max = dates[dates.length - 1] || "";
  input.value = dates.includes(selected) ? selected : dates[dates.length - 1] || "";
}

function applyGraphPeriod(period) {
  if (period === "today") {
    return;
  }
  applyPeriodToControls("graph", period);
}

function applyPeriodToControls(prefix, period) {
  const fuel = byId(`${prefix}Fuel`)?.value || byId("graphFuel").value;
  const dates = datesForFuel(fuel);
  if (!dates.length) {
    return;
  }
  const end = dates[dates.length - 1];
  let start = dates[0];
  if (period === "today") {
    start = end;
  } else if (period === "3m") {
    start = shiftDate(end, -92);
  } else if (period === "6m") {
    start = shiftDate(end, -183);
  } else if (period === "1y") {
    start = shiftDate(end, -365);
  } else if (period === "ytd") {
    start = `${end.slice(0, 4)}-01-01`;
  }
  byId(`${prefix}Start`).value = start < dates[0] ? dates[0] : start;
  byId(`${prefix}End`).value = end;

  if (prefix === "map") {
    void renderFranceMap();
  } else if (prefix === "dashboard") {
    state.dashboardPage = 1;
    void renderDashboard();
  } else if (prefix === "brand") {
    void renderBrands();
  } else {
    renderPriceChart();
  }
}

function setDateLimits(prefix, start, end) {
  [`${prefix}Start`, `${prefix}End`].forEach((id) => {
    byId(id).min = firstKnownDate();
    byId(id).max = end;
  });
  byId(`${prefix}Start`).value = start;
  byId(`${prefix}End`).value = end;
}

function datesForFuel(fuel) {
  const dates = new Set(state.history.filter((row) => row.fuel === fuel).map((row) => row.date));
  const current = currentDataDate(fuel);
  if (current) {
    dates.add(current);
  }
  return [...dates].sort();
}

function firstKnownDate() {
  const dates = state.history.map((row) => row.date).sort();
  return dates[0] || new Date().toISOString().slice(0, 10);
}

function latestKnownDate() {
  const dates = [...state.history.map((row) => row.date), currentDataDate()].filter(Boolean).sort();
  return dates[dates.length - 1] || new Date().toISOString().slice(0, 10);
}

function currentDataDate(fuel = null) {
  const dates = [];
  state.stations.forEach((station) => {
    FUELS.forEach((currentFuel) => {
      if (fuel && currentFuel !== fuel) {
        return;
      }
      const updatedAt = station.fuels?.[currentFuel]?.updatedAt;
      if (updatedAt) {
        dates.push(String(updatedAt).slice(0, 10));
      }
    });
  });
  dates.sort();
  return dates[dates.length - 1] || "";
}

async function loadScoreData(fuel) {
  if (state.scoreDataByFuel.has(fuel)) {
    return state.scoreDataByFuel.get(fuel);
  }
  const slug = fuel.toLowerCase();
  const payload = await fetchJson(`data/daily_scores_${slug}.json`);
  const data = {
    fuel,
    dates: payload.dates || [],
    stations: (payload.stations || []).map((row) => ({
      id: row[0],
      name: row[1],
      address: row[2],
      city: row[3],
      cp: row[4],
      department: normalizeDepartmentCode(row[5], row[4]),
      lat: row[6],
      lon: row[7],
      brand: row[8] || "",
    })),
    rows: payload.rows || [],
    chunks: payload.chunks || [],
    loadedChunks: new Set(),
    dateIndex: new Map((payload.dates || []).map((date, index) => [date, index])),
  };
  state.scoreDataByFuel.set(fuel, data);
  return data;
}

async function metricsForControls(prefix) {
  const fuel = byId(`${prefix}Fuel`).value;
  const dateRange = normalizeDateRange(byId(`${prefix}Start`).value, byId(`${prefix}End`).value);
  const metrics = (await getStationMetrics(fuel, dateRange[0], dateRange[1])).filter(passesStationRatingFilter);
  return { fuel, start: dateRange[0], end: dateRange[1], metrics };
}

async function getStationMetrics(fuel, startDate, endDate) {
  if (startDate === endDate && startDate === currentDataDate(fuel)) {
    return currentStationMetrics(fuel);
  }
  try {
    const data = await loadScoreData(fuel);
    const startIndex = data.dateIndex.get(startDate);
    const endIndex = data.dateIndex.get(endDate);
    if (startIndex === undefined || endIndex === undefined) {
      return currentStationMetrics(fuel);
    }

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    await ensureScoreRows(data, minIndex, maxIndex);
    const aggregates = new Map();

    for (const row of data.rows) {
      const dateIndex = row[0];
      if (dateIndex < minIndex || dateIndex > maxIndex) {
        continue;
      }
      const stationIndex = row[1];
      const price = row[2];
      const score = row[3];
      let aggregate = aggregates.get(stationIndex);
      if (!aggregate) {
        aggregate = { price: 0, score: 0, count: 0, lastDateIndex: dateIndex };
        aggregates.set(stationIndex, aggregate);
      }
      aggregate.price += price;
      aggregate.score += score;
      aggregate.count += 1;
      aggregate.lastDateIndex = Math.max(aggregate.lastDateIndex, dateIndex);
    }

    return [...aggregates.entries()].map(([stationIndex, aggregate]) => {
      const station = data.stations[stationIndex];
      const avgScore = aggregate.score / aggregate.count;
      return {
        ...station,
        fuel,
        price: aggregate.price / aggregate.count,
        score: avgScore,
        scoreDisplay: Math.round(avgScore),
        days: aggregate.count,
        updatedAt: data.dates[aggregate.lastDateIndex],
      };
    });
  } catch (error) {
    console.error(error);
    return currentStationMetrics(fuel);
  }
}

async function ensureScoreRows(data, startIndex, endIndex) {
  if (!data.chunks?.length) {
    return;
  }
  const neededYears = new Set(
    data.dates
      .slice(startIndex, endIndex + 1)
      .map((date) => date.slice(0, 4))
  );
  const chunks = data.chunks.filter(
    (chunk) => neededYears.has(String(chunk.year)) && !data.loadedChunks.has(String(chunk.year))
  );
  if (!chunks.length) {
    return;
  }
  const loaded = await Promise.all(
    chunks.map(async (chunk) => {
      const payload = await fetchJson(`data/${chunk.file}`);
      return { year: String(chunk.year), rows: payload.rows || [] };
    })
  );
  loaded.forEach(({ year, rows }) => {
    for (let index = 0; index < rows.length; index += 50000) {
      data.rows.push(...rows.slice(index, index + 50000));
    }
    data.loadedChunks.add(year);
  });
}

function currentStationMetrics(fuel) {
  return availableStations(fuel).map((station) => {
    const info = station.fuels[fuel];
    return {
      ...station,
      fuel,
      price: info.price,
      score: info.score,
      scoreDisplay: info.score,
      days: 1,
      updatedAt: info.updatedAt,
    };
  });
}

async function renderFranceMap() {
  const { fuel, start, end, metrics } = await metricsForControls("map");
  const ranked = [...metrics].filter((station) => Number.isFinite(station.price)).sort((a, b) => a.price - b.price);
  const topOneCount = Math.max(1, Math.ceil(ranked.length * 0.01));
  const topFiveCount = Math.max(topOneCount, Math.ceil(ranked.length * 0.05));
  const visibleStations = ranked.slice(0, topFiveCount).map((station, index) => ({
    ...station,
    mapTier: index < topOneCount ? "top1" : "top5",
  }));
  const cheapest = ranked.slice(0, 3).map((station) => ({ ...station, mapTier: "top1" }));
  const cheapestIds = new Set(cheapest.map((station) => station.id));
  const selected = [
    ...visibleStations,
    ...cheapest.filter((station) => !visibleStations.some((visible) => visible.id === station.id)),
  ];
  renderStaticFranceMap(fuel, selected, cheapestIds, { start, end });
}

function renderTileFranceMap(fuel, stations, cheapestIds, period) {
  const mapNode = byId("franceMap");
  if (state.mapCleanup) {
    state.mapCleanup();
    state.mapCleanup = null;
  }
  const width = 1000;
  const height = 650;
  const zoomLevel = clampNumber(state.mapZoom ?? 0, 0, 4, 0);
  state.mapZoom = zoomLevel;
  const center = state.mapCenter || { lat: 46.2, lon: 2.2 };
  const base = { lonSpan: 15.4, latSpan: 10.4 };
  const factor = 1 / (1 + zoomLevel * 0.55);
  const bounds = {
    minLon: center.lon - (base.lonSpan * factor) / 2,
    maxLon: center.lon + (base.lonSpan * factor) / 2,
    minLat: center.lat - (base.latSpan * factor) / 2,
    maxLat: center.lat + (base.latSpan * factor) / 2,
  };
  const projection = makeMercatorProjection(bounds, width, height, MAP_TILE_ZOOM + zoomLevel);
  const project = projection.project;
  const tiles = projection.tiles
    .map(
      (tile) => `
        <img alt="" src="${tile.url}"
          style="left:${tile.left.toFixed(4)}%; top:${tile.top.toFixed(4)}%; width:${tile.width.toFixed(
        4
      )}%; height:${tile.height.toFixed(4)}%;" />
      `
    )
    .join("");

  const stationCircles = stations
    .filter((station) => station.lat >= bounds.minLat && station.lat <= bounds.maxLat && station.lon >= bounds.minLon && station.lon <= bounds.maxLon)
    .map((station) => {
      const [x, y] = project(station.lat, station.lon);
      const isCheapest = cheapestIds.has(station.id);
      const isTopOne = station.mapTier === "top1";
      const fill = isTopOne ? "#8ee6a2" : "#111111";
      const stroke = isCheapest ? "#f5b82e" : "#ffffff";
      const radius = isCheapest ? 7 : isTopOne ? 5.8 : 4.8;
      return `
        <circle class="map-point" tabindex="0" role="button"
          cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}"
          fill="${fill}" stroke="${stroke}" stroke-width="${isCheapest ? 3 : 1.4}"
          data-name="${escapeHtml(stationCommercialName(station))}"
          data-detail="${escapeHtml(stationFullAddress(station))}"
          data-price="${escapeHtml(formatEuro(station.price, 3))}"
          data-score="${escapeHtml(`${formatNumber(station.score, period.start === period.end ? 0 : 1)}/20`)}">
          <title>${escapeHtml(stationCommercialName(station))} - ${formatEuro(station.price, 3)}</title>
        </circle>
      `;
    })
    .join("");

  const stars = SPECIAL_PLACES.filter(
    (place) => place.lat >= bounds.minLat && place.lat <= bounds.maxLat && place.lon >= bounds.minLon && place.lon <= bounds.maxLon
  )
    .map((place) => {
      const [x, y] = project(place.lat, place.lon);
      return `
        <text class="map-star" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
          data-name="${escapeHtml(place.name)}" data-detail="" data-price="" data-score="">
          &#9733;
        </text>
      `;
    })
    .join("");

  mapNode.innerHTML = `
    <div class="map-tile-layer" aria-hidden="true">${tiles}</div>
    <svg class="svg-map map-overlay" viewBox="0 0 ${width} ${height}" aria-label="Carte France des stations">
      <g>${stationCircles}</g>
      <g>${stars}</g>
    </svg>
    <div class="map-controls">
      <button class="icon-button" type="button" data-map-zoom="in" aria-label="Zoomer">+</button>
      <button class="icon-button" type="button" data-map-zoom="out" aria-label="Dézoomer">-</button>
    </div>
    <div class="map-legend">
      <span><i class="legend-dot score-20"></i>Top 1%</span>
      <span><i class="legend-dot score-19"></i>Top 5%</span>
      <span><i class="legend-ring"></i>Top 3 prix</span>
      <span>${period.start === period.end ? formatDate(period.start) : `${formatDate(period.start)} - ${formatDate(period.end)}`}</span>
    </div>
    <div class="map-popup" id="mapPopup" hidden></div>
  `;

  const popup = byId("mapPopup");
  mapNode.querySelectorAll(".map-point, .map-star").forEach((point) => {
    point.addEventListener("click", (event) => showMapPopup(event, popup));
    point.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        showMapPopup(event, popup);
      }
    });
  });
  mapNode.querySelectorAll("[data-map-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const delta = button.dataset.mapZoom === "in" ? 1 : -1;
      state.mapZoom = clampNumber((state.mapZoom ?? 0) + delta, 0, 4, 0);
      renderTileFranceMap(fuel, stations, cheapestIds, period);
    });
  });
  const handleWheel = (event) => {
    event.preventDefault();
    state.mapZoom = clampNumber((state.mapZoom ?? 0) + (event.deltaY < 0 ? 1 : -1), 0, 4, 0);
    scheduleMapRender(fuel, stations, cheapestIds, period);
  };
  const handleMapClick = (event) => {
    if (!event.target.classList.contains("map-point") && !event.target.classList.contains("map-star")) {
      popup.hidden = true;
    }
  };
  const cleanupDrag = bindMapDrag(fuel, stations, cheapestIds, period, bounds);
  mapNode.addEventListener("wheel", handleWheel, { passive: false });
  mapNode.addEventListener("click", handleMapClick);
  state.mapCleanup = () => {
    mapNode.removeEventListener("wheel", handleWheel);
    mapNode.removeEventListener("click", handleMapClick);
    cleanupDrag?.();
  };
}

function scheduleMapRender(fuel, stations, cheapestIds, period) {
  if (state.mapRenderFrame) {
    window.cancelAnimationFrame(state.mapRenderFrame);
  }
  state.mapRenderFrame = window.requestAnimationFrame(() => {
    state.mapRenderFrame = null;
    renderTileFranceMap(fuel, stations, cheapestIds, period);
  });
}

function bindMapDrag(fuel, stations, cheapestIds, period, bounds) {
  const mapNode = byId("franceMap");
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let totalX = 0;
  let totalY = 0;

  const handlePointerDown = (event) => {
    if (event.target.closest(".map-controls, .map-popup, .map-point, .map-star")) {
      return;
    }
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    totalX = 0;
    totalY = 0;
    mapNode.classList.add("is-dragging");
    mapNode.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragging) {
      return;
    }
    totalX = event.clientX - startX;
    totalY = event.clientY - startY;
    mapNode.querySelectorAll(".map-tile-layer, .map-overlay").forEach((layer) => {
      layer.style.transform = `translate(${totalX}px, ${totalY}px)`;
    });
  };

  const stopDrag = (event) => {
    if (!dragging) {
      return;
    }
    dragging = false;
    mapNode.classList.remove("is-dragging");
    if (mapNode.hasPointerCapture?.(event.pointerId)) {
      mapNode.releasePointerCapture(event.pointerId);
    }
    const rect = mapNode.getBoundingClientRect();
    const lonDelta = -(totalX / rect.width) * (bounds.maxLon - bounds.minLon);
    const latDelta = (totalY / rect.height) * (bounds.maxLat - bounds.minLat);
    state.mapCenter = {
      lat: clampNumber((state.mapCenter?.lat ?? 46.2) + latDelta, 41.1, 51.6, 46.2),
      lon: clampNumber((state.mapCenter?.lon ?? 2.2) + lonDelta, -5.4, 9.7, 2.2),
    };
    renderTileFranceMap(fuel, stations, cheapestIds, period);
  };

  mapNode.addEventListener("pointerdown", handlePointerDown);
  mapNode.addEventListener("pointermove", handlePointerMove);
  mapNode.addEventListener("pointerup", stopDrag);
  mapNode.addEventListener("pointercancel", stopDrag);
  mapNode.addEventListener("pointerleave", stopDrag);

  return () => {
    mapNode.removeEventListener("pointerdown", handlePointerDown);
    mapNode.removeEventListener("pointermove", handlePointerMove);
    mapNode.removeEventListener("pointerup", stopDrag);
    mapNode.removeEventListener("pointercancel", stopDrag);
    mapNode.removeEventListener("pointerleave", stopDrag);
  };
}

function renderStaticFranceMap(fuel, stations, cheapestIds, period) {
  if (!window.L) {
    renderTileFranceMap(fuel, stations, cheapestIds, period);
    return;
  }

  const mapNode = byId("franceMap");
  if (state.mapCleanup) {
    state.mapCleanup();
    state.mapCleanup = null;
  }
  if (state.map) {
    state.map.remove();
    state.map = null;
  }
  mapNode.innerHTML = "";
  mapNode.classList.remove("is-dragging");

  const map = L.map(mapNode, {
    zoomControl: true,
    scrollWheelZoom: true,
    preferCanvas: true,
  }).setView([46.65, 2.45], 6);
  state.map = map;

  const baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  }).addTo(map);
  let fallbackTilesLoaded = false;
  baseLayer.on("tileerror", () => {
    if (fallbackTilesLoaded) {
      return;
    }
    fallbackTilesLoaded = true;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
  });

  stations.filter((station) => !cheapestIds.has(station.id)).forEach((station) => {
    addFranceStationMarker(map, station, false, period);
  });
  stations.filter((station) => cheapestIds.has(station.id)).forEach((station) => {
    addFranceStationMarker(map, station, true, period);
  });

  favoritePlaces().forEach((place) => {
    L.marker([place.lat, place.lon], {
      icon: L.divIcon({
        className: "favorite-place-marker",
        html: "★",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    })
      .bindPopup(escapeHtml(place.name))
      .addTo(map);
  });

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const node = L.DomUtil.create("div", "map-legend leaflet-map-legend");
    node.innerHTML = `
      <span><i class="legend-dot score-20"></i>Top 1%</span>
      <span><i class="legend-dot score-19"></i>Top 5%</span>
      <span><i class="legend-ring"></i>Top 3 prix</span>
      <span>${period.start === period.end ? formatDate(period.start) : `${formatDate(period.start)} - ${formatDate(period.end)}`}</span>
    `;
    return node;
  };
  legend.addTo(map);
  window.setTimeout(() => map.invalidateSize(), 0);
}

function addFranceStationMarker(map, station, isCheapest, period) {
  const topOne = station.mapTier === "top1";
  const marker = L.circleMarker([station.lat, station.lon], {
    radius: isCheapest ? 8.5 : topOne ? 6.8 : 5.8,
    color: isCheapest ? "#f5b82e" : "#ffffff",
    weight: isCheapest ? 3.2 : 2,
    fillColor: topOne ? "#8ee6a2" : "#111111",
    fillOpacity: 0.96,
  });
  marker.bindPopup(`
        <strong>${renderStationNameHtml(station)}</strong><br>
    ${escapeHtml(stationFullAddress(station))}<br>
    Prix moyen : <strong>${formatEuro(station.price, 3)}/L</strong><br>
    Score moyen : <strong>${formatNumber(station.score, period.start === period.end ? 0 : 1)}/20</strong>
  `);
  marker.addTo(map);
  if (isCheapest) {
    marker.bringToFront();
  }
}

function renderStaticFranceMapLeafletDisabled(fuel, stations, cheapestIds, period) {
  const width = 1000;
  const height = 650;
  const bounds = { minLon: -5.6, maxLon: 9.8, minLat: 41.0, maxLat: 51.4 };
  const projection = makeMercatorProjection(bounds, width, height, MAP_TILE_ZOOM);
  const project = projection.project;
  const tiles = projection.tiles
    .map(
      (tile) => `
        <img alt="" src="${tile.url}"
          style="left:${tile.left.toFixed(4)}%; top:${tile.top.toFixed(4)}%; width:${tile.width.toFixed(
        4
      )}%; height:${tile.height.toFixed(4)}%;" />
      `
    )
    .join("");

  const stationCircles = stations
    .map((station) => {
      const [x, y] = project(station.lat, station.lon);
      const isCheapest = cheapestIds.has(station.id);
      const fill = station.score >= 19.5 ? "#8ee6a2" : "#111111";
      const stroke = isCheapest ? "#f5b82e" : "#ffffff";
      const radius = isCheapest ? 7 : station.score >= 19.5 ? 5.8 : 4.8;
      const scoreLabel = station.score >= 19.5 ? "Top 1%" : "Top 5%";
      return `
        <circle class="map-point" tabindex="0" role="button"
          cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}"
          fill="${fill}" stroke="${stroke}" stroke-width="${isCheapest ? 3 : 1.4}"
          data-name="${escapeHtml(station.name)}"
          data-detail="${escapeHtml(`${station.address} ${station.cp} ${station.city}`)}"
          data-price="${escapeHtml(formatEuro(station.price, 3))}"
          data-score="${escapeHtml(scoreLabel)}">
          <title>${escapeHtml(station.name)} - ${formatEuro(station.price, 3)} - ${scoreLabel}</title>
        </circle>
      `;
    })
    .join("");

  const stars = SPECIAL_PLACES.map((place) => {
    const [x, y] = project(place.lat, place.lon);
    return `
      <text class="map-star" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
        data-name="${escapeHtml(place.name)}" data-detail="Lieu favori" data-price="" data-score="">
        &#9733;
      </text>
    `;
  }).join("");

  byId("franceMap").innerHTML = `
    <div class="map-tile-layer" aria-hidden="true">${tiles}</div>
    <svg class="svg-map map-overlay" viewBox="0 0 ${width} ${height}" aria-label="Carte France des stations">
      <g>${stationCircles}</g>
      <g>${stars}</g>
    </svg>
    <div class="map-legend">
      <span><i class="legend-dot score-20"></i>Top 1%</span>
      <span><i class="legend-dot score-19"></i>Top 5%</span>
      <span><i class="legend-ring"></i>Top 3 prix</span>
      <span>${period.scope === "period" ? `${formatDate(period.start)} - ${formatDate(period.end)}` : formatDate(period.start)}</span>
    </div>
    <div class="map-popup" id="mapPopup" hidden></div>
  `;

  const popup = byId("mapPopup");
  byId("franceMap").querySelectorAll(".map-point, .map-star").forEach((point) => {
    point.addEventListener("click", (event) => showMapPopup(event, popup));
    point.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        showMapPopup(event, popup);
      }
    });
  });
  byId("franceMap").addEventListener("click", (event) => {
    if (!event.target.classList.contains("map-point") && !event.target.classList.contains("map-star")) {
      popup.hidden = true;
    }
  });
}

function showMapPopup(event, popup) {
  const point = event.currentTarget;
  const rect = byId("franceMap").getBoundingClientRect();
  const detail = point.dataset.detail || "";
  popup.innerHTML = `
    <strong>${escapeHtml(point.dataset.name)}</strong><br>
    ${detail ? `${escapeHtml(detail)}<br>` : ""}
    ${point.dataset.price ? `Prix moyen : <strong>${escapeHtml(point.dataset.price)}/L</strong><br>` : ""}
    ${point.dataset.score ? `Score moyen : <strong>${escapeHtml(point.dataset.score)}</strong>` : ""}
  `;
  popup.style.left = `${Math.min(event.clientX - rect.left + 12, rect.width - 230)}px`;
  popup.style.top = `${Math.max(event.clientY - rect.top - 18, 12)}px`;
  popup.hidden = false;
  event.stopPropagation();
}

function makeMercatorProjection(bounds, width, height, zoom) {
  const topLeft = mercatorPixel(bounds.maxLat, bounds.minLon, zoom);
  const bottomRight = mercatorPixel(bounds.minLat, bounds.maxLon, zoom);
  const pixelWidth = bottomRight.x - topLeft.x;
  const pixelHeight = bottomRight.y - topLeft.y;
  const scale = Math.min(width / pixelWidth, height / pixelHeight);
  const offsetX = (width - pixelWidth * scale) / 2;
  const offsetY = (height - pixelHeight * scale) / 2;
  const minTileX = Math.floor(topLeft.x / 256);
  const maxTileX = Math.floor(bottomRight.x / 256);
  const minTileY = Math.floor(topLeft.y / 256);
  const maxTileY = Math.floor(bottomRight.y / 256);
  const maxTile = 2 ** zoom;
  const tiles = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
      const leftPx = offsetX + (tileX * 256 - topLeft.x) * scale;
      const topPx = offsetY + (tileY * 256 - topLeft.y) * scale;
      const sizePx = 256 * scale;
      tiles.push({
        left: (leftPx / width) * 100,
        top: (topPx / height) * 100,
        width: (sizePx / width) * 100,
        height: (sizePx / height) * 100,
        url: tileUrl(zoom, wrappedX, tileY),
      });
    }
  }

  return {
    tiles,
    project(lat, lon) {
      const point = mercatorPixel(lat, lon, zoom);
      return [
        offsetX + (point.x - topLeft.x) * scale,
        offsetY + (point.y - topLeft.y) * scale,
      ];
    },
  };
}

function mercatorPixel(lat, lon, zoom) {
  const sin = Math.sin(toRad(Math.max(Math.min(lat, 85.0511), -85.0511)));
  const scale = 256 * 2 ** zoom;
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function tileUrl(zoom, x, y) {
  const subdomains = ["a", "b", "c", "d"];
  const subdomain = subdomains[Math.abs(x + y) % subdomains.length];
  return `https://${subdomain}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
}

function renderStaticFranceMapLeafletDisabled2(fuel, stations, cheapestIds, period) {
  const mapNode = byId("franceMap");
  mapNode.innerHTML = "";

  if (!window.L) {
    mapNode.innerHTML = `<div class="map-fallback">Carte indisponible pour le moment.</div>`;
    return;
  }

  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  const map = L.map(mapNode, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([46.75, 2.35], 6);
  state.map = map;

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    maxZoom: 19,
  }).addTo(map);

  stations.forEach((station) => {
    const isTopOne = station.score >= 19.5;
    const isCheapest = cheapestIds.has(station.id);
    const marker = L.circleMarker([station.lat, station.lon], {
      radius: isCheapest ? 8 : isTopOne ? 6 : 5,
      color: isCheapest ? "#f5b82e" : "#ffffff",
      weight: isCheapest ? 3 : 1,
      fillColor: isTopOne ? "#8ee6a2" : "#111111",
      fillOpacity: 0.92,
    });
    marker.bindPopup(`
      <strong>${renderStationNameHtml(station)}</strong><br>
      ${escapeHtml(stationFullAddress(station))}<br>
      Prix moyen : <strong>${formatEuro(station.price, 3)}/L</strong><br>
      Score moyen : <strong>${formatNumber(station.score, period.start === period.end ? 0 : 1)}/20</strong>
    `);
    marker.addTo(map);
  });

  SPECIAL_PLACES.forEach((place) => {
    L.marker([place.lat, place.lon], {
      title: place.name,
      icon: L.divIcon({
        className: "favorite-place-marker",
        html: "★",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    })
      .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>Lieu favori`)
      .addTo(map);
  });

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const node = L.DomUtil.create("div", "map-legend leaflet-map-legend");
    node.innerHTML = `
      <span><i class="legend-dot score-20"></i>Top 1%</span>
      <span><i class="legend-dot score-19"></i>Top 5%</span>
      <span><i class="legend-ring"></i>Top 3 prix</span>
      <span>${period.start === period.end ? formatDate(period.start) : `${formatDate(period.start)} - ${formatDate(period.end)}`}</span>
    `;
    return node;
  };
  legend.addTo(map);

  window.setTimeout(() => map.invalidateSize(), 0);
}

function populateDepartmentSelects() {
  const departments = [...new Set(state.stations.map((station) => normalizeDepartmentCode(station.department, station.cp)).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "fr", { numeric: true })
  );
  [byId("dashboardDept"), byId("graphDept"), byId("brandDept")].forEach((picker) => {
    if (!picker) {
      return;
    }
    state.selectedDepartmentsByPicker[picker.id] = null;
    picker.innerHTML = departmentPickerHtml(departments);
    picker.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-dept-toggle]");
      if (toggle) {
        const panel = picker.querySelector(".dept-picker-panel");
        if (panel) {
          panel.hidden = !panel.hidden;
          toggle.classList.toggle("open", !panel.hidden);
        }
        return;
      }
      const button = event.target.closest("[data-dept-action], [data-dept], [data-region]");
      if (!button) {
        return;
      }
      handleDepartmentPickerClick(picker.id, button);
    });
    renderDepartmentPickerState(picker.id);
  });
}

function selectedDepartments(selectId) {
  return state.selectedDepartmentsByPicker[selectId];
}

function normalizeDepartmentSelection(selectId) {
  renderDepartmentPickerState(selectId);
}

function departmentPickerHtml(departments) {
  const departmentSet = new Set(departments);
  const regions = Object.entries(REGION_DEPARTMENTS)
    .map(([region, regionDepartments]) => [
      region,
      regionDepartments.filter((department) => departmentSet.has(department)),
    ])
    .filter(([, regionDepartments]) => regionDepartments.length);

  const regionsHtml = regions
    .map(
      ([region, regionDepartments]) => `
        <div class="department-region" data-region-block="${escapeHtml(region)}">
          <div class="department-region-header">
            <button class="region-name-button" type="button" data-region="${escapeHtml(region)}">${escapeHtml(region)}</button>
          </div>
          <div class="department-grid">
            ${regionDepartments
              .map(
                (department) => `
                  <button class="dept-chip" type="button" data-dept="${escapeHtml(department)}" title="${escapeHtml(
                  DEPARTMENT_NAMES[department] || "Département"
                )}">${escapeHtml(department)}</button>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");

  return `
    <button class="dept-picker-toggle" type="button" data-dept-toggle>
      <span class="dept-picker-label">France entière</span>
      <span class="dept-picker-chevron" aria-hidden="true">▾</span>
    </button>
    <div class="dept-picker-panel" hidden>
      <div class="dept-picker-inner">
        ${regionsHtml}
        <div class="department-region department-france-block">
          <button class="dept-chip france-toggle active" type="button" data-dept-action="all">France entière</button>
        </div>
      </div>
    </div>
  `;
}

function handleDepartmentPickerClick(pickerId, button) {
  if (button.dataset.deptAction === "all") {
    state.selectedDepartmentsByPicker[pickerId] = null;
  } else if (button.dataset.region) {
    const regionDepartments = REGION_DEPARTMENTS[button.dataset.region] || [];
    const current = new Set(state.selectedDepartmentsByPicker[pickerId] || []);
    const allSelected = regionDepartments.length && regionDepartments.every((department) => current.has(department));
    if (allSelected) {
      regionDepartments.forEach((department) => current.delete(department));
      state.selectedDepartmentsByPicker[pickerId] = current.size ? [...current].sort() : null;
    } else {
      regionDepartments.forEach((department) => current.add(department));
      state.selectedDepartmentsByPicker[pickerId] = [...current].sort();
    }
  } else if (button.dataset.dept) {
    const current = new Set(state.selectedDepartmentsByPicker[pickerId] || []);
    if (current.has(button.dataset.dept)) {
      current.delete(button.dataset.dept);
    } else {
      current.add(button.dataset.dept);
    }
    state.selectedDepartmentsByPicker[pickerId] = current.size ? [...current].sort() : null;
  }
  renderDepartmentPickerState(pickerId);
  if (pickerId === "dashboardDept") {
    state.dashboardPage = 1;
    void renderDashboard();
  } else if (pickerId === "graphDept") {
    void renderDistributionChart();
  } else if (pickerId === "brandDept") {
    void renderBrands();
  }
}

function renderDepartmentPickerState(pickerId) {
  const picker = byId(pickerId);
  if (!picker) {
    return;
  }
  const selected = state.selectedDepartmentsByPicker[pickerId];
  const selectedSet = new Set(selected || []);
  picker.querySelectorAll("[data-dept]").forEach((button) => {
    button.classList.toggle("active", selectedSet.has(button.dataset.dept));
  });
  picker.querySelectorAll("[data-dept-action='all']").forEach((button) => {
    button.classList.toggle("active", !selected);
  });
  picker.querySelectorAll("[data-region]").forEach((button) => {
    const regionDepartments = REGION_DEPARTMENTS[button.dataset.region] || [];
    button.classList.toggle(
      "active",
      Boolean(selected) && regionDepartments.every((department) => selectedSet.has(department))
    );
  });
  // Mettre à jour le label du toggle
  const label = picker.querySelector(".dept-picker-label");
  if (label) {
    label.textContent = selected ? departmentLabel(selected) : "France entière";
  }
}

function matchesDepartments(station, departments) {
  return !departments || departments.includes(station.department);
}

function departmentLabel(departments) {
  if (!departments || !departments.length) {
    return "tous départements";
  }
  return departments.length === 1
    ? `${departments[0]} - ${DEPARTMENT_NAMES[departments[0]] || "Département"}`
    : `${departments.length} départements`;
}

function brandRankingScores() {
  const totals = new Map();
  const counts = new Map();
  FUELS.forEach((fuel) => {
    currentStationMetrics(fuel).forEach((station) => {
      const brand = brandGroupName(station);
      totals.set(brand, (totals.get(brand) || 0) + (station.score || 0));
      counts.set(brand, (counts.get(brand) || 0) + 1);
    });
  });
  const result = new Map();
  totals.forEach((total, brand) => result.set(brand, total / (counts.get(brand) || 1)));
  return result;
}

const BRAND_DISPLAY_ORDER = [
  "E.Leclerc", "Coopérative U", "Mousquetaires", "Auchan",
  "Carrefour", "TotalEnergies", "Station indépendante",
];

function populateDashboardBrandPicker() {
  const picker = byId("dashboardBrandPicker");
  if (!picker) return;
  const eligible = eligibleBrandSet();
  const ordered = BRAND_DISPLAY_ORDER.filter((b) => eligible.has(b));
  const rest = [...eligible].filter((b) => !BRAND_DISPLAY_ORDER.includes(b)).sort((a, b) => a.localeCompare(b, "fr"));
  const brands = [...ordered, ...rest];
  picker.innerHTML = brands.map((brand) => {
    const src = BRAND_LOGOS[brand];
    const img = src
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(brand)}" />`
      : `<span class="brand-chip-label">${escapeHtml(brandInitials(brand))}</span>`;
    return `<button class="brand-logo-chip active" type="button" data-brand-filter="${escapeHtml(brand)}" title="${escapeHtml(brand)}">${img}</button>`;
  }).join("");

  picker.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-brand-filter]");
    if (!btn) return;
    const brand = btn.dataset.brandFilter;
    const allBrands = new Set([...picker.querySelectorAll("[data-brand-filter]")].map((b) => b.dataset.brandFilter));
    if (!state.selectedDashboardBrands) {
      state.selectedDashboardBrands = new Set([brand]);
    } else {
      const next = new Set(state.selectedDashboardBrands);
      if (next.has(brand)) {
        next.delete(brand);
        state.selectedDashboardBrands = next.size === 0 ? null : next;
      } else {
        next.add(brand);
        state.selectedDashboardBrands = next.size === allBrands.size ? null : next;
      }
    }
    renderDashboardBrandPicker();
    state.dashboardPage = 1;
    void renderDashboard();
  });
}

function renderDashboardBrandPicker() {
  const picker = byId("dashboardBrandPicker");
  if (!picker) return;
  picker.querySelectorAll("[data-brand-filter]").forEach((btn) => {
    const active = !state.selectedDashboardBrands || state.selectedDashboardBrands.has(btn.dataset.brandFilter);
    btn.classList.toggle("active", active);
  });
}

function normalizeDepartmentCode(department, cp = "") {
  const code = String(department || "").trim().toUpperCase();
  const postal = String(cp || "").trim();
  if (code === "20" || (postal.length >= 5 && postal.startsWith("20"))) {
    const postalNumber = Number(postal.slice(0, 5));
    return Number.isFinite(postalNumber) && postalNumber >= 20200 ? "2B" : "2A";
  }
  return code;
}


async function renderDashboard() {
  const { fuel, start, end, metrics } = await metricsForControls("dashboard");
  const departments = selectedDepartments("dashboardDept");
  const searchValue = byId("dashboardCitySearch").value.trim();
  const cityNeedle = normalizeSearchText(searchValue);
  const cpNeedle = (searchValue.match(/^\d{5}/) || [""])[0];
  const rows = metrics
    .filter((station) => matchesDepartments(station, departments))
    .filter((station) => !state.selectedDashboardBrands || state.selectedDashboardBrands.has(brandGroupName(station)))
    .filter((station) => {
      if (cpNeedle) {
        return String(station.cp || "").startsWith(cpNeedle);
      }
      return !cityNeedle || normalizeSearchText(station.city).includes(cityNeedle);
    })
    .sort((a, b) => b.score - a.score || a.price - b.price);
  state.dashboardRows = rows;
  const prices = rows.map((station) => station.price);
  const medianScore = rows.length ? median(rows.map((station) => station.score)) : null;
  const pageCount = Math.max(1, Math.ceil(rows.length / DASHBOARD_PAGE_SIZE));
  state.dashboardPage = Math.min(Math.max(state.dashboardPage, 1), pageCount);
  const pageStart = (state.dashboardPage - 1) * DASHBOARD_PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + DASHBOARD_PAGE_SIZE);

  byId("dashboardKpis").innerHTML = `
    <div class="kpi"><span>Nombre de stations</span><strong>${rows.length.toLocaleString("fr-FR")}</strong></div>
    <div class="kpi"><span>Prix médian</span><strong>${prices.length ? formatEuro(median(prices), 3) : "-"}</strong></div>
    <div class="kpi"><span>Score médian</span><strong>${medianScore !== null ? `${formatNumber(medianScore, 1)}/20` : "-"}</strong></div>
  `;

  byId("dashboardTable").innerHTML = pageRows.length
    ? pageRows
        .map((station, index) => {
          const scoreClass = scoreClassForScore(station.score);
          return `
            <tr>
              <td>${pageStart + index + 1}</td>
              <td>${stationIdentityHtml(station)}</td>
              <td>${formatEuro(station.price, 3)}</td>
              <td><span class="score-badge${scoreClass}">${formatNumber(station.score, start === end ? 0 : 1)}/20</span></td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="4" class="empty-cell">Aucune station disponible.</td></tr>`;

  renderDashboardPagination(pageCount);
}

function scoreClassForScore(score) {
  if (score >= 19) {
    return " score-top";
  }
  if (score >= 15) {
    return " score-green";
  }
  if (score >= 10) {
    return " score-mid";
  }
  if (score >= 7) {
    return " score-orange";
  }
  return " score-red";
}

function renderDashboardPagination(pageCount) {
  const pagination = byId("dashboardPagination");
  if (pageCount <= 1) {
    pagination.innerHTML = "";
    return;
  }
  pagination.innerHTML = `
    <button class="button secondary small" type="button" data-dashboard-page="prev">Précédent</button>
    <span>Page ${state.dashboardPage.toLocaleString("fr-FR")} / ${pageCount.toLocaleString("fr-FR")}</span>
    <button class="button secondary small" type="button" data-dashboard-page="next">Suivant</button>
  `;
  pagination.querySelectorAll("[data-dashboard-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.dashboardPage += button.dataset.dashboardPage === "next" ? 1 : -1;
      state.dashboardPage = Math.min(Math.max(state.dashboardPage, 1), pageCount);
      void renderDashboard();
    });
  });
}

async function renderCharts() {
  renderPriceChart();
  await renderDistributionChart();
}

async function renderBrands() {
  const { metrics } = await metricsForControls("brand");
  const departments = selectedDepartments("brandDept");
  const eligible = eligibleBrandSet();
  syncBrandFilterOptions(eligible);
  const selectedBrand = byId("brandGroupFilter")?.value || "all";
  const scopedMetrics = metrics.filter((station) => matchesDepartments(station, departments));
  const brandScopedMetrics =
    selectedBrand === "all"
      ? scopedMetrics
      : scopedMetrics.filter((station) => {
          const brand = brandGroupName(station);
          const group = eligible.has(brand) ? brand : "Station indépendante";
          return group === selectedBrand;
        });
  const rows = aggregateBrands(brandScopedMetrics, eligible).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "fr"));
  byId("brandPodium").innerHTML = "";

  byId("brandList").innerHTML = rows.length
    ? rows
        .map((brand) => `
          <div class="brand-row">
            ${brandLogoHtml(brand.name)}
            <strong>${escapeHtml(brand.name)}</strong>
            <span>${brand.count.toLocaleString("fr-FR")} stations</span>
            <em>${formatNumber(brand.score, 1)}/20</em>
          </div>
        `)
        .join("")
    : `<p class="empty-cell">Aucune enseigne disponible avec ces filtres.</p>`;

}

function syncBrandFilterOptions(eligible) {
  const select = byId("brandGroupFilter");
  if (!select) {
    return;
  }
  const current = select.value || "all";
  const brands = [...eligible].sort((a, b) => a.localeCompare(b, "fr"));
  select.innerHTML = [`<option value="all">Toutes</option>`]
    .concat(brands.map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`))
    .join("");
  select.value = current === "all" || brands.includes(current) ? current : "all";
}

function eligibleBrandSet() {
  const counts = new Map();
  state.stations.forEach((station) => {
    const brand = brandGroupName(station);
    counts.set(brand, (counts.get(brand) || 0) + 1);
  });
  return new Set(
    [...counts.entries()]
      .filter(([brand, count]) => count >= 100 && (BRAND_GROUPS.has(brand) || brand === "Station indépendante"))
      .map(([brand]) => brand)
  );
}

function aggregateBrands(metrics, eligible) {
  const aggregates = new Map();
  metrics.forEach((station) => {
    const brand = brandGroupName(station);
    const group = eligible.has(brand) ? brand : "Station indépendante";
    let aggregate = aggregates.get(group);
    if (!aggregate) {
      aggregate = { name: group, count: 0, scoreSum: 0 };
      aggregates.set(group, aggregate);
    }
    aggregate.count += 1;
    aggregate.scoreSum += Number(station.score) || 0;
  });
  return [...aggregates.values()].map((aggregate) => ({
    name: aggregate.name,
    count: aggregate.count,
    score: aggregate.count ? aggregate.scoreSum / aggregate.count : 0,
  }));
}

function brandGroupName(station) {
  const brand = commercialStationBrand(station);
  const normalized = normalizeSearchText(brand);
  const has = (...aliases) => aliases.some((alias) => brandAliasMatches(normalized, alias));
  if (!brand || has("indépendante", "station indépendante") || normalized.startsWith("STATION")) return "Station indépendante";
  if (has("Système U", "Super U", "Hyper U", "U Express", "Coopérative U")) return "Coopérative U";
  if (has("Leclerc", "E.Leclerc")) return "E.Leclerc";
  if (has("Intermarché", "Netto", "Intermarché Contact")) return "Mousquetaires";
  if (has("Total", "TotalEnergies", "TotalEnergies Access", "Total Access")) return "TotalEnergies";
  if (has("Carrefour", "Carrefour Market", "Carrefour Contact")) return "Carrefour";
  if (has("Auchan")) return "Auchan";
  if (has("Esso", "Esso Express")) return "Esso";
  if (has("Avia")) return "Avia";
  if (has("Shell")) return "Shell";
  if (has("BP")) return "BP";
  if (has("ENI", "Agip")) return "ENI";
  if (has("Casino", "Géant Casino")) return "Casino";
  if (has("Station service", "Station-service")) return "Station indépendante";
  return "Station indépendante";
}

function renderBrandAdminMap(metrics, eligible) {
  const buckets = new Map();
  metrics.forEach((station) => {
    const key = state.brandMapView === "france" ? "France" : state.brandMapView === "region" ? departmentRegionName(station.department) : station.department;
    if (!key) return;
    const brand = eligible.has(brandGroupName(station)) ? brandGroupName(station) : "Station indépendante";
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    bucket.push({ ...station, brand });
  });
  const entries = [...buckets.entries()].map(([zone, rows]) => {
    const best = aggregateBrands(rows, eligible).sort((a, b) => b.score - a.score)[0];
    return { zone, best };
  });
  setText("brandMapMeta", state.brandMapView === "france" ? "Vue nationale" : state.brandMapView === "region" ? "Vue régionale" : "Vue départementale");
  byId("brandAdminMap").innerHTML = entries
    .sort((a, b) => a.zone.localeCompare(b.zone, "fr", { numeric: true }))
    .map(({ zone, best }) => `
      <div class="brand-zone brand-map-cell" style="--brand-color:${brandColor(best?.name || "Station indépendante")}">
        <strong>${escapeHtml(zone)}</strong>
        <span>${brandLogoHtml(best?.name || "Station indépendante")}${escapeHtml(best?.name || "-")}</span>
      </div>
    `)
    .join("");
}

function brandLogoHtml(name) {
  const src = BRAND_LOGOS[name];
  if (src) {
    return `<span class="brand-logo-slot"><img class="brand-logo-img" src="${escapeHtml(src)}" alt="${escapeHtml(name)}" /></span>`;
  }
  return `<span class="brand-logo-pill small" style="--brand-color:${brandColor(name)}">${escapeHtml(brandInitials(name))}</span>`;
}

function departmentRegionName(department) {
  return Object.entries(REGION_DEPARTMENTS).find(([, departments]) => departments.includes(department))?.[0] || "";
}

function brandInitials(name) {
  return String(name || "")
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function brandColor(name) {
  const palette = ["#0f766e", "#f5b82e", "#2563eb", "#dc2626", "#7c3aed", "#0f172a", "#16a34a", "#ea580c"];
  let hash = 0;
  String(name || "").split("").forEach((char, index) => {
    hash = (hash + char.charCodeAt(0) * (index + 1)) % palette.length;
  });
  return palette[hash];
}


function renderPriceChart() {
  const fuel = byId("graphFuel").value;
  const start = byId("graphStart").value;
  const end = byId("graphEnd").value;
  const rows = state.history
    .filter((row) => row.fuel === fuel)
    .filter((row) => (!start || row.date >= start) && (!end || row.date <= end))
    .sort((a, b) => a.date.localeCompare(b.date));
  drawPriceAndOutageChart(byId("priceChart"), rows, fuel);
  setText("priceChartInfo", rows.length ? "" : "Aucune donnée.");
}

function drawPriceAndOutageChart(container, rows, fuel) {
  const labels = rows.map((row) => row.date);
  const values = rows.map((row) => row.median);
  if (!values.length) {
    container.innerHTML = `<div class="chart-empty">Aucune donnée.</div>`;
    return;
  }
  const outageStats = rows.map((row) => ruptureStatsForHistoryRow(row, fuel));
  const knownOutages = outageStats.filter((item) => item.known);
  const width = 720;
  const height = 390;
  const pad = { left: 76, right: 78, top: 30, bottom: 48 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yMin = Math.floor((min - 0.03) * 20) / 20;
  const yMax = Math.ceil((max + 0.03) * 20) / 20;
  const outageMax = Math.max(10, Math.ceil(Math.max(...knownOutages.map((item) => item.count), 1) / 100) * 100);
  const x = (index) => pad.left + (index / Math.max(values.length - 1, 1)) * (width - pad.left - pad.right);
  const yPrice = (value) => pad.top + ((yMax - value) / Math.max(yMax - yMin, 0.001)) * (height - pad.top - pad.bottom);
  const yOutage = (value) => pad.top + ((outageMax - value) / outageMax) * (height - pad.top - pad.bottom);
  const pricePoints = values.map((value, index) => `${x(index).toFixed(1)},${yPrice(value).toFixed(1)}`).join(" ");
  const outagePoints = outageStats
    .map((item, index) => (item.known ? `${x(index).toFixed(1)},${yOutage(item.count).toFixed(1)}` : ""))
    .filter(Boolean)
    .join(" ");
  const yTicks = makeTicks(yMin, yMax, 6);
  const outageTicks = knownOutages.length ? makeCountTicks(outageMax, Math.max(10, Math.ceil(outageMax / 4 / 10) * 10)) : [];
  const dateGuides = chartDateGuides(labels, x, pad, width, height, Math.max(1, Math.ceil(labels.length / 7)));
  const pointNodes = values
    .map((value, index) => {
      const outage = outageStats[index];
      const percent = outage.total ? (outage.count / outage.total) * 100 : 0;
      return `
        <circle class="chart-point price-point" data-chart-type="price" data-label="${escapeHtml(labels[index])}" data-value="${value}" data-outage="${outage.count}" data-outage-percent="${percent}" data-outage-known="${outage.known ? "1" : "0"}"
          cx="${x(index).toFixed(1)}" cy="${yPrice(value).toFixed(1)}" r="3"></circle>
        <circle class="chart-hotspot price-hotspot" data-chart-type="price" data-label="${escapeHtml(labels[index])}" data-value="${value}" data-outage="${outage.count}" data-outage-percent="${percent}" data-outage-known="${outage.known ? "1" : "0"}"
          cx="${x(index).toFixed(1)}" cy="${yPrice(value).toFixed(1)}" r="9"></circle>
      `;
    })
    .join("");
  const outagePointNodes = outageStats
    .map((outage, index) => {
      if (!outage.known) {
        return "";
      }
      const percent = outage.total ? (outage.count / outage.total) * 100 : 0;
      return `
        <circle class="chart-point outage-point" data-chart-type="outage" data-label="${escapeHtml(labels[index])}" data-value="${values[index]}" data-outage="${outage.count}" data-outage-percent="${percent}" data-outage-known="1"
          cx="${x(index).toFixed(1)}" cy="${yOutage(outage.count).toFixed(1)}" r="3"></circle>
        <circle class="chart-hotspot outage-hotspot" data-chart-type="outage" data-label="${escapeHtml(labels[index])}" data-value="${values[index]}" data-outage="${outage.count}" data-outage-percent="${percent}" data-outage-known="1"
          cx="${x(index).toFixed(1)}" cy="${yOutage(outage.count).toFixed(1)}" r="9"></circle>
      `;
    })
    .join("");

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Prix médian et ruptures">
      ${dateGuides.background}
      ${yTicks
        .map(
          (tick) => `
            <line x1="${pad.left}" x2="${width - pad.right}" y1="${yPrice(tick)}" y2="${yPrice(tick)}" class="chart-grid"></line>
            <text x="${pad.left - 10}" y="${yPrice(tick) + 4}" class="chart-axis-label" text-anchor="end">${formatEuro(tick, 2)}</text>
          `
        )
        .join("")}
      ${outageTicks
        .map(
          (tick) => `
            <text x="${width - pad.right + 10}" y="${yOutage(tick) + 4}" class="chart-axis-label chart-axis-right" text-anchor="start">${formatNumber(tick, 0)}</text>
          `
        )
        .join("")}
      ${dateGuides.lines}
      <text x="18" y="${height / 2}" class="chart-axis-title" transform="rotate(-90 18 ${height / 2})">Prix médian (€)</text>
      ${knownOutages.length ? `<text x="${width - 18}" y="${height / 2}" class="chart-axis-title chart-axis-right" transform="rotate(90 ${width - 18} ${height / 2})">Stations en rupture</text>` : ""}
      <polyline points="${pricePoints}" class="chart-line"></polyline>
      ${knownOutages.length >= 2 ? `<polyline points="${outagePoints}" class="chart-line outage-line"></polyline>` : ""}
      ${pointNodes}
      ${outagePointNodes}
      <g class="chart-tooltip" id="lineChartTooltip" hidden>
        <rect x="-104" y="-56" width="208" height="50" rx="6"></rect>
        <text x="0" y="-39" text-anchor="middle" class="chart-tooltip-text tooltip-price"></text>
        <text x="0" y="-21" text-anchor="middle" class="chart-tooltip-extra tooltip-outage"></text>
      </g>
      ${dateGuides.labels}
    </svg>
  `;
  container.querySelectorAll(".chart-point, .chart-hotspot").forEach((node) => {
    node.addEventListener("click", () => {
      const tooltip = container.querySelector("#lineChartTooltip");
      const text = tooltip?.querySelector(".chart-tooltip-text");
      const extra = tooltip?.querySelector(".chart-tooltip-extra");
      if (!tooltip || !text || !extra) return;
      const cx = Number(node.getAttribute("cx"));
      const cy = Number(node.getAttribute("cy"));
      text.textContent = `${formatDate(node.dataset.label)} - ${formatEuro(Number(node.dataset.value), 3)}`;
      extra.textContent =
        node.dataset.outageKnown === "1"
          ? `${formatNumber(Number(node.dataset.outage), 0)} ruptures (${formatNumber(Number(node.dataset.outagePercent), 1)}%)`
          : "Ruptures non disponibles pour cette date";
      tooltip.setAttribute("transform", `translate(${cx} ${Math.max(52, cy - 8)})`);
      tooltip.removeAttribute("hidden");
    });
  });
}

function ruptureStatsForHistoryRow(row, fuel) {
  if (Number.isFinite(Number(row.ruptureCount))) {
    const count = Number(row.ruptureCount);
    return {
      known: true,
      count,
      total: Number(row.totalStations) || (Number(row.count) || 0) + count,
    };
  }
  if (row.date === currentDataDate(fuel)) {
    const fuelStations = state.stations.filter((station) => station.fuels?.[fuel]);
    const count = fuelStations.filter((station) => station.fuels[fuel]?.available === false && station.fuels[fuel]?.reason === "rupture").length;
    return {
      known: true,
      count,
      total: fuelStations.length || (Number(row.count) || 0) + count,
    };
  }
  return { known: false, count: 0, total: 0 };
}

function currentHistoryRow(fuel) {
  const date = currentDataDate(fuel);
  if (!date) {
    return null;
  }
  const fuelStations = state.stations.filter((station) => station.fuels?.[fuel]);
  const prices = fuelStations
    .map((station) => Number(station.fuels[fuel]?.price))
    .filter((price) => Number.isFinite(price));
  if (!prices.length) {
    return null;
  }
  const ruptureCount = fuelStations.filter((station) => station.fuels[fuel]?.available === false && station.fuels[fuel]?.reason === "rupture").length;
  return {
    fuel,
    date,
    median: median(prices),
    count: prices.length,
    ruptureCount,
    totalStations: prices.length + ruptureCount,
  };
}

async function renderDistributionChart() {
  const fuel = byId("distributionFuel").value;
  const departments = selectedDepartments("graphDept");
  const date = byId("distributionDate").value || latestKnownDate();
  const prices = [];

  if (date === currentDataDate(fuel)) {
    currentStationMetrics(fuel)
      .filter((station) => matchesDepartments(station, departments))
      .forEach((station) => prices.push(station.price));
  } else {
    const data = await loadScoreData(fuel);
    const resolvedDate = data.dateIndex.has(date)
      ? date
      : [...data.dates].reverse().find((currentDate) => currentDate <= date) || data.dates[data.dates.length - 1];
    const dateIndex = data.dateIndex.get(resolvedDate);
    if (dateIndex !== undefined) {
      await ensureScoreRows(data, dateIndex, dateIndex);
    for (const row of data.rows) {
      if (row[0] !== dateIndex) {
        continue;
      }
      const station = data.stations[row[1]];
      if (matchesDepartments(station, departments) && passesStationRatingFilter(station)) {
        prices.push(row[2]);
      }
    }
  }

  }

  const bins = makeExtremeBins(prices, 0.05, 200);
  setText(
    "distributionMeta",
    `Données du ${formatDate(date)} - ${fuel} - ${departmentLabel(departments)} - ${prices.length.toLocaleString(
      "fr-FR"
    )} stations`
  );
  drawBarChart(
    byId("distributionChart"),
    bins.map((bin) => bin.label),
    bins.map((bin) => bin.count),
    "Stations"
  );
}

function drawLineChart(container, labels, values, yTitle) {
  if (!values.length) {
    container.innerHTML = `<div class="chart-empty">Aucune donnée.</div>`;
    return;
  }
  const width = 720;
  const height = 390;
  const pad = { left: 58, right: 18, top: 20, bottom: 42 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yMin = Math.floor((min - 0.03) * 20) / 20;
  const yMax = Math.ceil((max + 0.03) * 20) / 20;
  const x = (index) =>
    pad.left + (index / Math.max(values.length - 1, 1)) * (width - pad.left - pad.right);
  const y = (value) =>
    pad.top + ((yMax - value) / Math.max(yMax - yMin, 0.001)) * (height - pad.top - pad.bottom);
  const points = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const area = `${pad.left},${height - pad.bottom} ${points} ${width - pad.right},${height - pad.bottom}`;
  const yTicks = makeTicks(yMin, yMax, 6);
  const xStep = Math.max(1, Math.ceil(labels.length / 7));
  const dateGuides = chartDateGuides(labels, x, pad, width, height, xStep);
  const pointNodes = values
    .map(
      (value, index) => `
        <circle class="chart-point" data-label="${escapeHtml(labels[index])}" data-value="${value}"
          cx="${x(index).toFixed(1)}" cy="${y(value).toFixed(1)}" r="3">
          <title>${formatDate(labels[index])} - ${formatEuro(value, 3)}</title>
        </circle>
        <circle class="chart-hotspot" data-label="${escapeHtml(labels[index])}" data-value="${value}"
          cx="${x(index).toFixed(1)}" cy="${y(value).toFixed(1)}" r="9">
          <title>${formatDate(labels[index])} - ${formatEuro(value, 3)}</title>
        </circle>
      `
    )
    .join("");

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(yTitle)}">
      ${dateGuides.background}
      ${yTicks
        .map(
          (tick) => `
            <line x1="${pad.left}" x2="${width - pad.right}" y1="${y(tick)}" y2="${y(tick)}" class="chart-grid"></line>
            <text x="${pad.left - 10}" y="${y(tick) + 4}" class="chart-axis-label" text-anchor="end">${formatNumber(
              tick,
              2
            )}</text>
          `
        )
        .join("")}
      ${dateGuides.lines}
      <text x="18" y="${height / 2}" class="chart-axis-title" transform="rotate(-90 18 ${height / 2})">${escapeHtml(
        yTitle
      )}</text>
      <polygon points="${area}" class="chart-area"></polygon>
      <polyline points="${points}" class="chart-line"></polyline>
      ${pointNodes}
      <g class="chart-tooltip" id="lineChartTooltip" hidden>
        <rect x="-64" y="-38" width="128" height="30" rx="6"></rect>
        <text x="0" y="-25" text-anchor="middle" class="chart-tooltip-text"></text>
      </g>
      ${dateGuides.labels}
    </svg>
  `;
  container.querySelectorAll(".chart-point, .chart-hotspot").forEach((node) => {
    node.addEventListener("click", () => {
      const tooltip = container.querySelector("#lineChartTooltip");
      const text = tooltip?.querySelector("text");
      if (!tooltip || !text) {
        return;
      }
      const cx = Number(node.getAttribute("cx"));
      const cy = Number(node.getAttribute("cy"));
      text.textContent = `${formatDate(node.dataset.label)} - ${formatEuro(Number(node.dataset.value), 3)}`;
      tooltip.setAttribute("transform", `translate(${cx} ${Math.max(42, cy - 8)})`);
      tooltip.removeAttribute("hidden");
    });
  });
}

function chartDateGuides(labels, x, pad, width, height, fallbackStep) {
  const chartBottom = height - pad.bottom;
  const months = [];
  const monthIndexes = new Map();
  labels.forEach((label, index) => {
    const key = String(label).slice(0, 7);
    if (!monthIndexes.has(key)) {
      monthIndexes.set(key, { key, first: index, last: index });
      months.push(monthIndexes.get(key));
    } else {
      monthIndexes.get(key).last = index;
    }
  });
  const years = [];
  const yearIndexes = new Map();
  labels.forEach((label, index) => {
    const key = String(label).slice(0, 4);
    if (!yearIndexes.has(key)) {
      yearIndexes.set(key, { key, first: index, last: index });
      years.push(yearIndexes.get(key));
    } else {
      yearIndexes.get(key).last = index;
    }
  });

  const background =
    years.length > 1
      ? years
          .map((year, index) => {
            const x1 = Math.max(pad.left, x(year.first) - 6);
            const x2 = Math.min(width - pad.right, x(year.last) + 6);
            const fill = index % 2 === 0 ? "rgba(15,118,110,0.055)" : "rgba(245,184,46,0.075)";
            return `<rect x="${x1.toFixed(1)}" y="${pad.top}" width="${Math.max(0, x2 - x1).toFixed(
              1
            )}" height="${(chartBottom - pad.top).toFixed(1)}" fill="${fill}"></rect>`;
          })
          .join("")
      : "";

  let lines = "";
  if (months.length > 3) {
    months.forEach((month) => {
      const monthNumber = month.key.slice(5, 7);
      if (months.length <= 12 || monthNumber === "01") {
        lines += `<line x1="${x(month.first).toFixed(1)}" x2="${x(month.first).toFixed(
          1
        )}" y1="${pad.top}" y2="${chartBottom}" class="chart-period-line"></line>`;
      }
    });
  }
  if (years.length > 1) {
    years.slice(1).forEach((year) => {
      lines += `<line x1="${x(year.first).toFixed(1)}" x2="${x(year.first).toFixed(
        1
      )}" y1="${pad.top}" y2="${height - 9}" class="chart-year-line"></line>`;
    });
  }

  let axisLabels = "";
  if (months.length > 1) {
    months.forEach((month) => {
      axisLabels += `<text x="${x(month.first).toFixed(1)}" y="${height - 24}" class="chart-axis-label" text-anchor="middle">${month.key.slice(
        5,
        7
      )}</text>`;
    });
    years.forEach((year) => {
      const center = (x(year.first) + x(year.last)) / 2;
      axisLabels += `<text x="${center.toFixed(1)}" y="${height - 8}" class="chart-axis-label chart-year-label" text-anchor="middle">${escapeHtml(
        year.key
      )}</text>`;
    });
  } else {
    axisLabels = labels
      .map((label, index) =>
        index === 0 || index === labels.length - 1 || index % fallbackStep === 0
          ? `<text x="${x(index)}" y="${height - 15}" class="chart-axis-label" text-anchor="middle">${formatDate(
              label
            )}</text>`
          : ""
      )
      .join("");
  }

  return { background, lines, labels: axisLabels };
}

function chartDateTickLabel(labels, label, index, fallbackStep) {
  if (labels.length <= 45) {
    return index === 0 || index === labels.length - 1 || index % fallbackStep === 0 ? formatDate(label) : "";
  }
  const monthKey = String(label).slice(0, 7);
  const firstOfMonth = String(label).slice(8, 10) === "01";
  if (!firstOfMonth) {
    return "";
  }
  const months = [...new Set(labels.map((item) => String(item).slice(0, 7)))];
  const monthIndex = months.indexOf(monthKey);
  const monthStep = labels.length > 400 ? 2 : 1;
  if (monthIndex % monthStep !== 0) {
    return "";
  }
  return `01/${monthKey.slice(5, 7)}/${monthKey.slice(0, 4)}`;
}

function drawBarChart(container, labels, values, yTitle) {
  if (!values.length) {
    container.innerHTML = `<div class="chart-empty">Aucune donnée.</div>`;
    return;
  }
  const width = 720;
  const height = 390;
  const pad = { left: 64, right: 18, top: 30, bottom: 64 };
  const max = Math.max(...values, 1);
  const yMax = Math.max(500, Math.ceil(max / 500) * 500);
  const innerWidth = width - pad.left - pad.right;
  const barGap = 3;
  const barWidth = Math.max(5, innerWidth / values.length - barGap);
  const y = (value) => pad.top + ((yMax - value) / yMax) * (height - pad.top - pad.bottom);
  const yTicks = makeCountTicks(yMax, 500);

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(yTitle)}">
      ${yTicks
        .map(
          (tick) => `
            <line x1="${pad.left}" x2="${width - pad.right}" y1="${y(tick)}" y2="${y(tick)}" class="chart-grid"></line>
            <text x="${pad.left - 10}" y="${y(tick) + 4}" class="chart-axis-label" text-anchor="end">${formatNumber(
              tick,
              0
            )}</text>
          `
        )
        .join("")}
      <text x="18" y="${height / 2}" class="chart-axis-title" transform="rotate(-90 18 ${height / 2})">${escapeHtml(
        yTitle
      )}</text>
      ${values
        .map((value, index) => {
          const x = pad.left + index * (barWidth + barGap);
          const barY = y(value);
          const barH = height - pad.bottom - barY;
          const labelX = x + barWidth / 2;
          return `
            <rect x="${x.toFixed(1)}" y="${barY.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barH.toFixed(
            1
          )}" class="chart-bar"><title>${escapeHtml(labels[index])} : ${value}</title></rect>
            <text x="${labelX.toFixed(1)}" y="${Math.max(14, barY - 6).toFixed(1)}" class="chart-bar-count" text-anchor="middle">${value.toLocaleString(
            "fr-FR"
          )}</text>
            <text x="${labelX.toFixed(1)}" y="${height - 28}" class="chart-axis-label" text-anchor="middle">${escapeHtml(
            distributionAxisLabel(labels[index])
          )}</text>
          `;
        })
        .join("")}
      <text x="${pad.left + innerWidth / 2}" y="${height - 8}" class="chart-axis-title horizontal-axis-title" text-anchor="middle">Prix au litre (€)</text>
    </svg>
  `;
}

function distributionAxisLabel(label) {
  const text = String(label || "");
  return /€/.test(text) ? text : `${text} €`;
}

function makeCountTicks(max, step) {
  const ticks = [];
  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }
  return ticks;
}

function availableStations(fuel) {
  return state.stations.filter((station) => {
    const fuelInfo = station.fuels?.[fuel];
    return fuelInfo?.available && Number.isFinite(Number(fuelInfo.price)) && passesStationRatingFilter(station);
  });
}

function byId(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const node = byId(id);
  if (node) {
    node.textContent = text;
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(Math.max(number, min), max);
}

function normalizeDateRange(start, end) {
  return start <= end ? [start, end] : [end, start];
}

function shiftDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function makeRoundBins(values, step = 0.05) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) {
    return [];
  }
  const low = Math.floor(Math.min(...usable) / step) * step;
  const high = Math.floor(Math.max(...usable) / step) * step;
  const bins = [];
  for (let current = low; current <= high + 1e-9; current += step) {
    bins.push({ min: roundTo(current, 2), max: roundTo(current + step - 0.001, 3), count: 0 });
  }
  usable.forEach((value) => {
    const index = Math.min(Math.floor((value - low) / step), bins.length - 1);
    bins[Math.max(index, 0)].count += 1;
  });
  return bins;
}

function makeExtremeBins(values, step = 0.05, maxExtremeCount = 200) {
  const usable = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!usable.length) {
    return [];
  }
  const roundBins = makeRoundBins(usable, step);
  if (usable.length <= maxExtremeCount * 2 + 10 || roundBins.length <= 3) {
    return roundBins.map((bin) => ({
      ...bin,
      label: formatNumber(bin.min, 2),
    }));
  }

  let lowCount = 0;
  let lowBinIndex = -1;
  for (let index = 0; index < roundBins.length - 2; index += 1) {
    if (lowCount + roundBins[index].count > maxExtremeCount) {
      break;
    }
    lowCount += roundBins[index].count;
    lowBinIndex = index;
  }
  if (lowCount === 0) {
    lowCount = Math.min(maxExtremeCount, roundBins[0].count);
    lowBinIndex = 0;
  }

  let highCount = 0;
  let highBinIndex = roundBins.length;
  for (let index = roundBins.length - 1; index > lowBinIndex + 1; index -= 1) {
    if (highCount + roundBins[index].count > maxExtremeCount) {
      break;
    }
    highCount += roundBins[index].count;
    highBinIndex = index;
  }
  if (highCount === 0) {
    highCount = Math.min(maxExtremeCount, roundBins[roundBins.length - 1].count);
    highBinIndex = roundBins.length - 1;
  }

  const middleValues = usable.slice(lowCount, usable.length - highCount);
  const bins = [];
  const lowThreshold = roundBins[lowBinIndex + 1]?.min ?? usable[lowCount] ?? usable[0];
  bins.push({
    label: `< ${formatNumber(lowThreshold, 2)}€`,
    count: lowCount,
  });
  bins.push(
    ...makeRoundBins(middleValues, step).map((bin) => ({
      ...bin,
      label: formatNumber(bin.min, 2),
    }))
  );
  const highThreshold = roundBins[highBinIndex]?.min ?? usable[usable.length - highCount] ?? usable[usable.length - 1];
  bins.push({
    label: `> ${formatNumber(highThreshold, 2)}€`,
    count: highCount,
  });
  return bins;
}

function makeTicks(min, max, count) {
  if (min === max) {
    return [min];
  }
  const step = (max - min) / Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, index) => min + index * step);
}

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatEuro(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "-";
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "-";
  }
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

function formatMinutes(value) {
  if (!Number.isFinite(Number(value))) {
    return "-";
  }
  const minutes = Math.round(Number(value));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const text = String(value).slice(0, 10);
  const [year, month, day] = text.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return formatDate(value);
  }
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }
  return formatDate(value);
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
