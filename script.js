// Initialize Map
const map = L.map('map').setView([22.3072, 73.1812], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Theme Toggle Handler
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

// Search Handler
document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if (city) fetchCoordinates(city);
});

// Fetch City Coordinates
async function fetchCoordinates(cityName) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country_code } = data.results[0];
            document.getElementById('city-name').innerText = `${name}, ${country_code}`;
            map.setView([latitude, longitude], 10);
            fetchWeatherData(latitude, longitude);
        }
    } catch (err) {
        console.error("Failed to geocode city:", err);
    }
}

// Fetch Full Weather Data
async function fetchWeatherData(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        updateCurrentWeather(data);
        updateForecast(data.daily);
    } catch (err) {
        console.error("Failed to fetch weather:", err);
    }
}

// Update Current Metrics
function updateCurrentWeather(data) {
    const current = data.current;
    const daily = data.daily;

    // Core Values
    document.getElementById('main-temp').innerText = `${Math.round(current.temperature_2m)}°`;
    document.getElementById('feels-like').innerText = `Feels like ${Math.round(current.apparent_temperature)}°`;
    document.getElementById('high-low').innerText = `H: ${Math.round(daily.temperature_2m_max[0])}°  •  L: ${Math.round(daily.temperature_2m_min[0])}°`;

    // Restored Quick Stats
    document.getElementById('wind-val').innerText = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('humidity-val').innerText = `${Math.round(current.relative_humidity_2m)}%`;
    document.getElementById('uv-val').innerText = `UV ${Math.round(daily.uv_index_max[0])}`;
    document.getElementById('pressure-val').innerText = `${Math.round(current.surface_pressure)} hPa`;

    // Weather condition and disaster alert check
    const code = current.weather_code;
    const conditionText = getWeatherDescription(code);
    document.getElementById('weather-condition').innerText = conditionText;

    // Check for severe weather disaster conditions (thunderstorms, heavy snow, severe rain)
    const alertBanner = document.getElementById('alert-banner');
    const alertPill = document.getElementById('alert-pill');

    if (code >= 95 || current.wind_speed_10m > 40) { // Weather code >= 95 is thunderstorm
        alertBanner.classList.remove('hidden');
        alertPill.classList.remove('hidden');
        document.getElementById('alert-title').innerText = "Severe Weather Warning";
        document.getElementById('alert-desc').innerText = `Active weather advisory in effect (${conditionText}) with wind speeds up to ${Math.round(current.wind_speed_10m)} km/h.`;
    } else {
        alertBanner.classList.add('hidden');
        alertPill.classList.add('hidden');
    }
}

// Populate Forecast
function updateForecast(daily) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Today' : days[date.getDay()];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const uv = Math.round(daily.uv_index_max[i]);
        const uvClass = uv <= 2 ? 'uv-low' : (uv <= 5 ? 'uv-mod' : 'uv-high');

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <span class="forecast-icon">${getWeatherIcon(daily.weather_code[i])}</span>
            <span class="forecast-temp">${maxTemp}°</span>
            <span class="forecast-uv ${uvClass}">UV ${uv}</span>
        `;
        container.appendChild(card);
    }
}

// Helpers
function getWeatherDescription(code) {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 65) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code >= 95) return 'Thunderstorm';
    return 'Overcast';
}

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 65) return '🌧️';
    if (code <= 77) return '❄️';
    if (code >= 95) return '🌩️';
    return '☁️';
}

// Initial Load
fetchCoordinates('Vadodara');
