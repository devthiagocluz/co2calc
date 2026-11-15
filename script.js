"use strict";

import { APP_CONFIG } from "./config.js";

const form = document.querySelector("#travel-form");
const originInput = document.querySelector("#origin");
const destinationInput = document.querySelector("#destination");
const citiesList = document.querySelector("#cities-list");
const transportSelect = document.querySelector("#transport");
const calculateButton = document.querySelector("#calculate-btn");
const result = document.querySelector("#result");
const coordinatesCache = new Map();

let lastGeocodingRequestAt = 0;
let comparisonChart = null;

// Popula as sugestões de cidades definidas na configuração.
function findAllCities() {
  citiesList.replaceChildren();
  APP_CONFIG.cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city.name;
    citiesList.append(option);
  });
}

// Popula o seletor com os transportes definidos na configuração.
function findAllTransports() {
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione um meio de transporte";
  placeholder.disabled = true;
  placeholder.selected = true;
  transportSelect.append(placeholder);

  Object.entries(APP_CONFIG.transports).forEach(([id, transport]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = transport.label;
    transportSelect.append(option);
  });
}

function findCityByName(name) {
  const normalizedName = normalizeCityName(name);
  return APP_CONFIG.cities.find(
    (city) => normalizeCityName(city.name) === normalizedName,
  );
}

function normalizeCityName(name) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

// Busca primeiro na configuração local e consulta o Nominatim apenas para cidades desconhecidas.
async function getCoordinates(cityName) {
  const localCity = findCityByName(cityName);
  if (localCity) {
    return { lat: localCity.lat, lng: localCity.lng };
  }

  const cacheKey = normalizeCityName(cityName);
  if (coordinatesCache.has(cacheKey)) {
    return coordinatesCache.get(cacheKey);
  }

  const delay = Math.max(0, 1000 - (Date.now() - lastGeocodingRequestAt));
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastGeocodingRequestAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", cityName.trim());

  let response;
  try {
    response = await fetch(url, {
      headers: { "Accept-Language": "pt-BR" },
    });
  } catch {
    throw new Error("Não foi possível consultar o serviço de cidades. Verifique sua conexão e tente novamente.");
  }

  if (!response.ok) {
    throw new Error("O serviço de busca de cidades está indisponível. Tente novamente mais tarde.");
  }

  let places;
  try {
    places = await response.json();
  } catch {
    throw new Error("A resposta do serviço de cidades não pôde ser lida. Tente novamente mais tarde.");
  }

  const place = Array.isArray(places) ? places[0] : null;
  const lat = Number(place?.lat);
  const lng = Number(place?.lon);
  const coordinates =
    Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  coordinatesCache.set(cacheKey, coordinates);
  return coordinates;
}

// Calcula a distância em linha reta entre duas cidades usando a fórmula de Haversine.
async function getTheDistance(originCityName, destinationCityName) {
  const originCity = await getCoordinates(originCityName);
  if (!originCity) {
    return null;
  }

  const destinationCity = await getCoordinates(destinationCityName);
  if (!destinationCity) {
    return null;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(destinationCity.lat - originCity.lat);
  const longitudeDifference = toRadians(destinationCity.lng - originCity.lng);
  const originLatitude = toRadians(originCity.lat);
  const destinationLatitude = toRadians(destinationCity.lat);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return 6371 * centralAngle;
}

function createMetricCard(icon, label, value) {
  const card = document.createElement("article");
  card.className = "metric-card";

  const heading = document.createElement("div");
  heading.className = "metric-card__heading";

  const iconElement = document.createElement("span");
  iconElement.className = "metric-card__icon";
  iconElement.setAttribute("aria-hidden", "true");
  iconElement.textContent = icon;

  const title = document.createElement("h3");
  title.textContent = label;
  heading.append(iconElement, title);

  const valueElement = document.createElement("p");
  valueElement.className = "metric-card__value";
  valueElement.textContent = value;
  card.append(heading, valueElement);

  return card;
}

function showResultCards({ origin, destination, transport, distance, emissions, credits, cost }) {
  const summary = document.createElement("p");
  summary.className = "result-summary";
  summary.textContent = `${origin} → ${destination} · ${transport}`;

  const metrics = document.createElement("div");
  metrics.className = "metrics-grid";
  metrics.append(
    createMetricCard("📍", "Distância", `${distance} km`),
    createMetricCard("☁️", "Emissão Total", `${emissions} kg de CO₂`),
    createMetricCard("🌱", "Créditos de Carbono", `${credits} créditos`),
    createMetricCard("💰", "Investimento de Compensação", cost),
  );

  const chartHeading = document.createElement("h3");
  chartHeading.className = "chart-heading";
  chartHeading.textContent = "Comparação entre meios de transporte";

  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";

  const canvas = document.createElement("canvas");
  canvas.id = "comparisonChart";
  canvas.setAttribute(
    "aria-label",
    "Gráfico comparando emissões de CO₂ por meio de transporte para esta distância",
  );
  canvas.setAttribute("role", "img");
  chartContainer.append(canvas);

  const chartNote = document.createElement("p");
  chartNote.className = "chart-note";
  chartNote.textContent = "A barra verde-escura representa o meio de transporte escolhido.";

  result.replaceChildren(summary, metrics, chartHeading, chartContainer, chartNote);
}

function renderComparisonChart(distance) {
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }

  const canvas = result.querySelector("#comparisonChart");
  if (!globalThis.Chart) {
    const message = document.createElement("p");
    message.className = "chart-unavailable";
    message.textContent = "O gráfico não foi carregado. Verifique sua conexão e atualize a página.";
    canvas.replaceWith(message);
    return;
  }

  const transports = Object.entries(APP_CONFIG.transports);
  comparisonChart = new globalThis.Chart(canvas, {
    type: "bar",
    data: {
      labels: transports.map(([, transport]) => transport.label),
      datasets: [
        {
          label: "Emissão estimada (kg de CO₂)",
          data: transports.map(([, transport]) => distance * transport.emissionPerKm),
          backgroundColor: transports.map(([id]) =>
            id === transportSelect.value ? "#1b4332" : "#74c69d",
          ),
          borderColor: transports.map(([id]) =>
            id === transportSelect.value ? "#1b4332" : "#40916c",
          ),
          borderWidth: 1,
          minBarLength: 4,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Emissões para a mesma distância",
          color: "#1b4332",
        },
      },
      scales: {
        x: {
          ticks: { color: "#315b48" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "kg de CO₂", color: "#315b48" },
          ticks: { color: "#315b48" },
          grid: { color: "#e1ece5" },
        },
      },
    },
  });
}

// Valida os campos, calcula as emissões e apresenta o resultado.
async function calculateEmissions(event) {
  event.preventDefault();
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }
  result.replaceChildren();

  const originName = originInput.value.trim();
  const destinationName = destinationInput.value.trim();
  if (normalizeCityName(originName) === normalizeCityName(destinationName)) {
    result.textContent = "Escolha cidades diferentes para a origem e o destino.";
    return;
  }

  const transport = APP_CONFIG.transports[transportSelect.value];
  if (!transport) {
    result.textContent = "Selecione um meio de transporte válido.";
    return;
  }

  calculateButton.disabled = true;
  let distance;
  try {
    distance = await getTheDistance(originName, destinationName);
  } catch (error) {
    result.textContent =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro ao buscar as coordenadas. Tente novamente.";
    return;
  } finally {
    calculateButton.disabled = false;
  }

  if (distance === null) {
    result.textContent =
      "Uma das cidades não foi encontrada. Confira o nome digitado e tente novamente.";
    return;
  }

  const emissions = distance * transport.emissionPerKm;
  const credits = emissions / APP_CONFIG.business.KG_PER_CREDIT;
  const compensationCost = credits * APP_CONFIG.business.PRICE_PER_CREDIT_BRL;
  const formatNumber = (value, fractionDigits) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  showResultCards({
    origin: originName,
    destination: destinationName,
    transport: transportSelect.selectedOptions[0].textContent,
    distance: formatNumber(distance, 1),
    emissions: formatNumber(emissions, 2),
    credits: formatNumber(credits, 3),
    cost: formatCurrency(compensationCost),
  });
  renderComparisonChart(distance);
}

findAllCities();
findAllTransports();
form.addEventListener("submit", calculateEmissions);
