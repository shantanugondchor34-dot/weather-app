// CONFIGURATION
const API_KEY = "d5130d3dfb7d445daf8132456260202"; 
const BASE_URL = "https://api.weatherapi.com/v1/forecast.json";

// DOM ELEMENTS
const heroSection = document.getElementById("hero-section");
const dashboardSection = document.getElementById("dashboard-section");
const heroInput = document.getElementById("hero-input");
const heroBtn = document.getElementById("hero-search-btn");
const loader = document.getElementById("loader");
const navHome = document.getElementById("nav-home");

let weatherChart = null;

// --- 1. NAVIGATION FUNCTIONS ---
function showDashboard() {
    // 1. Hide Hero
    heroSection.classList.add("hidden");
    // 2. Show Dashboard
    dashboardSection.classList.remove("hidden");
}

function showHero() {
    // 1. Hide Dashboard
    dashboardSection.classList.add("hidden");
    // 2. Show Hero
    heroSection.classList.remove("hidden");
    // 3. Clear Input
    heroInput.value = ""; 
}

// Make these available globally for HTML buttons
window.showHero = showHero; 
window.quickSearch = (city) => fetchWeather(city);

// --- 2. WEATHER FETCHING ---
async function fetchWeather(city) {
    // Basic Validation
    if(!city) {
        alert("Please enter a city name.");
        return;
    }

    // Show Loader
    loader.classList.remove("hidden");
    
    try {
        const url = `${BASE_URL}?key=${API_KEY}&q=${city}&days=3&aqi=yes&alerts=no`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("City not found");
        
        const data = await response.json();
        
        // Update UI with Data
        updateUI(data);
        
        // Switch Views
        showDashboard();

    } catch (error) {
        console.error(error);
        alert("Error: City not found. Please check spelling.");
    } finally {
        // Hide Loader
        loader.classList.add("hidden");
    }
}

// --- 3. UI UPDATER ---
function updateUI(data) {
    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday;

    // A. Main Header
    document.getElementById("temp").innerText = `${Math.round(current.temp_c)}°`;
    document.getElementById("city").innerText = `${location.name}, ${location.country}`;
    document.getElementById("condition").innerText = current.condition.text;
    document.getElementById("date-time").innerText = location.localtime;
    
    // Icon Fix (Handling Protocol)
    let iconUrl = current.condition.icon;
    if (iconUrl.startsWith("//")) {
        iconUrl = "https:" + iconUrl;
    }
    document.getElementById("weather-icon").src = iconUrl;

    // B. Stats Grid
    document.getElementById("humidity").innerText = `${current.humidity}%`;
    document.getElementById("wind").innerText = `${current.wind_kph} km/h`;
    document.getElementById("feels-like").innerText = `${Math.round(current.feelslike_c)}°`;
    document.getElementById("uv-index").innerText = current.uv;

    // C. AI Suggestion
    generateSuggestion(current.condition.text, current.temp_c);

    // D. Forecast List & Chart
    updateForecast(forecast);
}

function updateForecast(forecastData) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "<h3>3-Day Forecast</h3>"; 
    
    const labels = [];
    const temps = [];

    forecastData.forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
        
        let dayIcon = day.day.condition.icon;
        if (dayIcon.startsWith("//")) dayIcon = "https:" + dayIcon;
        
        const item = `
            <div class="forecast-item">
                <span>${date}</span>
                <img src="${dayIcon}" width="30">
                <span>${Math.round(day.day.maxtemp_c)}° / ${Math.round(day.day.mintemp_c)}°</span>
            </div>
        `;
        forecastContainer.innerHTML += item;
        
        labels.push(date);
        temps.push(day.day.avgtemp_c);
    });

    renderChart(labels, temps);
}

// --- 4. LOGIC HELPERS ---
function generateSuggestion(condition, temp) {
    let text = "";
    const lowerCond = condition.toLowerCase();
    
    if (lowerCond.includes("rain") || lowerCond.includes("drizzle")) {
        text = "Umbrella required! It's raining. ☔";
    } else if (lowerCond.includes("snow")) {
        text = "Bundle up! It's snowing. ❄️";
    } else if (temp > 30) {
        text = "It's hot outside. Stay hydrated! 🥤";
    } else if (temp < 10) {
        text = "Chilly weather. Wear a jacket! 🧥";
    } else {
        text = "Conditions are great for a walk! 🚶";
    }
    document.getElementById("suggestion-text").innerText = text;
}

function renderChart(labels, data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    // Destroy previous chart to prevent glitching
    if (weatherChart) weatherChart.destroy();
    
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Temp (°C)',
                data: data,
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#ccc' }, grid: { display: false } },
                y: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });
}

// --- 5. EVENT LISTENERS ---
heroBtn.addEventListener("click", () => {
    fetchWeather(heroInput.value);
});

heroInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter") fetchWeather(heroInput.value);
});

// Reset to Home when clicking "Home" in nav
if(navHome) {
    navHome.addEventListener("click", (e) => {
        e.preventDefault();
        showHero();
    });
}
// Register the PWA Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => console.log("App Registered!"))
            .catch((err) => console.log("App Failed:", err));
    });
}