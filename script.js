const map = L.map('map').setView([22.3072, 73.1812], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

setTimeout(() => { map.invalidateSize(); }, 300);

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});

document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if (city) fetchCoordinates(city);
});

// Laptop View Navigation Fixing Event Binding
document.addEventListener('DOMContentLoaded', () => {
    const forecastRow = document.getElementById('forecast-container');
    const leftBtn = document.getElementById('scroll-left');
    const rightBtn = document.getElementById('scroll-right');

    if (leftBtn && forecastRow) {
        leftBtn.addEventListener('click', () => {
            forecastRow.scrollBy({ left: -220, behavior: 'smooth' });
        });
    }

    if (rightBtn && forecastRow) {
        rightBtn.addEventListener('click', () => {
            forecastRow.scrollBy({ left: 220, behavior: 'smooth' });
        });
    }
});

async function fetchCoordinates(cityName) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country_code } = data.results[0];
            document.getElementById('city-name').innerText = `${name}, ${country_code}`;
            map.setView([latitude, longitude], 10);
            setTimeout(() => { map.invalidateSize(); }, 200);
            fetchWeatherData(latitude, longitude);
        }
    } catch (err) {
        console.error("Geocoding failed:", err);
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        updateCurrentWeather(data);
        updateForecast(data.daily);
    } catch (err) {
        console.error("Weather fetch failed:", err);
    }
}

function updateCurrentWeather(data) {
    const current = data.current;
    const daily = data.daily;
    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;
    const cityName = document.getElementById('city-name').innerText;

    document.getElementById('main-temp').innerText = `${temp}°`;
    document.getElementById('feels-like').innerText = `Feels like ${Math.round(current.apparent_temperature)}°`;
    document.getElementById('high-low').innerText = `H: ${Math.round(daily.temperature_2m_max[0])}°  •  L: ${Math.round(daily.temperature_2m_min[0])}°`;

    document.getElementById('wind-val').innerText = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('humidity-val').innerText = `${Math.round(current.relative_humidity_2m)}%`;
    document.getElementById('uv-val').innerText = `UV ${Math.round(daily.uv_index_max[0])}`;
    document.getElementById('pressure-val').innerText = `${Math.round(current.surface_pressure)} hPa`;

    document.getElementById('weather-condition').innerText = getWeatherDescription(code);

    const alertBanner = document.getElementById('alert-banner');
    const alertTitle = document.getElementById('alert-title');
    const alertDesc = document.getElementById('alert-desc');
    const alertIcon = document.getElementById('alert-icon');

    alertBanner.className = 'alert-banner';

    if (code >= 80 || code === 95 || code === 96 || code === 99) {
        alertBanner.classList.add('alert-storm');
        alertIcon.innerText = '⚡';
        alertTitle.innerText = 'STORM & SEVERE WEATHER WARNING';
        alertDesc.innerText = `Thunderstorm or severe rain advisory in effect for ${cityName}.`;
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        alertBanner.classList.add('alert-storm');
        alertIcon.innerText = '🌧️';
        alertTitle.innerText = 'RAIN & SHOWER ADVISORY';
        alertDesc.innerText = `Precipitation and wet conditions active in ${cityName}.`;
    } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        alertBanner.classList.add('alert-cold');
        alertIcon.innerText = '❄️';
        alertTitle.innerText = 'SNOW & FREEZING ALERT';
        alertDesc.innerText = `Snowfall and freezing condition warning active for ${cityName}.`;
    } else if (temp >= 35) {
        alertBanner.classList.add('alert-heat');
        alertIcon.innerText = '🔥';
        alertTitle.innerText = 'EXTREME HEAT ADVISORY';
        alertDesc.innerText = `High temperature alert active for ${cityName} (${temp}°C). Stay hydrated.`;
    } else if (temp <= 5) {
        alertBanner.classList.add('alert-cold');
        alertIcon.innerText = '🥶';
        alertTitle.innerText = 'COLD WAVE ADVISORY';
        alertDesc.innerText = `Low temperature advisory active for ${cityName} (${temp}°C).`;
    } else {
        alertBanner.classList.add('alert-heat');
        alertIcon.innerText = '☀️';
        alertTitle.innerText = 'WEATHER ADVISORY';
        alertDesc.innerText = `Normal weather conditions currently recorded for ${cityName}.`;
    }
}

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

function getWeatherDescription(code) {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 65) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code >= 80) return 'Thunderstorm / Shower';
    return 'Overcast';
}

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 65) return '🌧️';
    if (code <= 77) return '❄️';
    if (code >= 80) return '⚡';
    return '☁️';
}

fetchCoordinates('Vadodara');
