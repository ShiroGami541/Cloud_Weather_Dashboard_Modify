// Weather icon & description configurations
const weatherConfig = {
    0: { text: "Clear Sky", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`, theme: "clear" },
    1: { text: "Mainly Clear", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19.07A7 7 0 1 0 5 10.5a7 7 0 0 0 12.5 8.57z"/></svg>`, theme: "clear" },
    2: { text: "Partly Cloudy", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`, theme: "clear" },
    3: { text: "Overcast", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`, theme: "clear" },
    45: { text: "Foggy", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9h14M3 12h18M5 15h14"/></svg>`, theme: "clear" },
    61: { text: "Rain", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`, theme: "rain" },
    63: { text: "Heavy Rain", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`, theme: "rain" },
    71: { text: "Snow", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M16 16h.01M16 20h.01"/></svg>`, theme: "snow" },
    95: { text: "Thunderstorm", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`, theme: "storm" }
};

let map;
let currentMarker;

document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchCity();
});

function toggleTheme() {
    const body = document.body;
    body.classList.toggle("light-mode");
    const isLight = body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
}

if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
}

function initMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function updateMapLocation(lat, lon, locationLabel) {
    if (!map) initMap();
    map.flyTo([lat, lon], 10, { duration: 1.5 });

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<b>${locationLabel}</b>`)
        .openPopup();
}

async function searchCity(cityNameQuery = null) {
    const city = cityNameQuery || document.getElementById("cityInput").value.trim();
    if (!city) return alert("Please enter a city name.");

    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    try {
        const response = await fetch(geoURL);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return alert("City not found.");
        }

        const { latitude, longitude, name, country } = data.results[0];
        const locationLabel = `${name}, ${country || ''}`;
        
        fetchDashboardData(latitude, longitude, locationLabel);
        updateMapLocation(latitude, longitude, locationLabel);

    } catch (err) {
        alert("Failed to fetch location information.");
    }
}

async function fetchDashboardData(lat, lon, locationLabel) {
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;

    try {
        const response = await fetch(weatherURL);
        const data = await response.json();

        const currentTemp = Math.round(data.current.temperature_2m);
        const windSpeed = data.current.wind_speed_10m;
        const humidity = data.current.relative_humidity_2m;
        const code = data.current.weather_code;
        const uv = data.daily.uv_index_max[0];
        const feelsLike = Math.round(data.current.apparent_temperature);

        // Populate Left Card Details
        document.getElementById("cityName").innerText = locationLabel;
        document.getElementById("temp").innerText = `${currentTemp}°`;
        document.getElementById("humidity").innerText = humidity;
        document.getElementById("wind").innerText = windSpeed;

        // Populate Compact Chips Inside Hero Box
        document.getElementById("heroWind").innerText = `${windSpeed} km/h`;
        document.getElementById("heroHumidity").innerText = `${humidity}%`;
        document.getElementById("heroUv").innerText = `UV ${uv}`;
        document.getElementById("feelsLikeHero").innerText = `Feels like ${feelsLike}°`;

        const weatherDetails = weatherConfig[code] || { text: "Clear", icon: weatherConfig[0].icon, theme: "clear" };
        document.getElementById("conditionBadge").innerText = weatherDetails.text;
        document.getElementById("mainWeatherIcon").innerHTML = weatherDetails.icon;

        // Dynamic Weather Themes & Extreme Temp overrides
        let activeTheme = weatherDetails.theme;
        if (currentTemp > 35) activeTheme = "hot";
        if (currentTemp <= 0) activeTheme = "snow";
        
        document.body.className = document.body.className.replace(/\bweather-\S+/g, '');
        document.body.classList.add(`weather-${activeTheme}`);

        // Handle Weather Alerts (Storm, High Winds, Extreme Heat)
        checkForAlerts(code, windSpeed, currentTemp);

        const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
        const minTemp = Math.round(data.daily.temperature_2m_min[0]);
        document.getElementById("minMaxTemp").innerText = `H: ${maxTemp}° | L: ${minTemp}°`;

        const now = new Date();
        document.getElementById("localTime").innerText = now.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Metrics Grid
        document.getElementById("feelsLike").innerText = `${feelsLike}°`;
        document.getElementById("precipitation").innerText = data.current.precipitation;
        document.getElementById("pressure").innerText = Math.round(data.current.surface_pressure);
        document.getElementById("uvIndex").innerText = uv;
        document.getElementById("uvLevel").innerText = uv >= 6 ? "High Risk" : (uv >= 3 ? "Moderate Risk" : "Low Risk");

        render7DayForecast(data.daily);

    } catch (err) {
        alert("Error retrieving detailed weather metrics.");
    }
}

function checkForAlerts(code, windSpeed, temp) {
    const alertBanner = document.getElementById("alertBanner");
    const alertTag = document.getElementById("alertTag");
    const alertTitle = document.getElementById("alertTitle");
    const alertDesc = document.getElementById("alertDesc");
    const alertIcon = document.getElementById("alertIcon");

    let isAlert = false;
    let title = "";
    let desc = "";
    let icon = "⚠️";

    if (code === 95) {
        isAlert = true;
        title = "Severe Storm Warning";
        desc = "Thunderstorms and hazardous weather conditions detected nearby.";
        icon = "🌩️";
    } else if (windSpeed > 35) {
        isAlert = true;
        title = "High Wind Advisory";
        desc = `Strong winds up to ${windSpeed} km/h detected. Take precautions outdoors.`;
        icon = "💨";
    } else if (temp > 38) {
        isAlert = true;
        title = "Extreme Heat Warning";
        desc = "Extremely high temperatures. Stay hydrated and avoid long sun exposure.";
        icon = "🔥";
    }

    if (isAlert) {
        alertTitle.innerText = title;
        alertDesc.innerText = desc;
        alertIcon.innerText = icon;
        alertBanner.classList.remove("hidden");
        alertTag.classList.remove("hidden");
        alertTag.innerText = title.split(' ')[0] + " Alert";
    } else {
        alertBanner.classList.add("hidden");
        alertTag.classList.add("hidden");
    }
}

function render7DayForecast(dailyData) {
    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(dailyData.time[i]);
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const max = Math.round(dailyData.temperature_2m_max[i]);
        const code = dailyData.weather_code[i];
        const icon = (weatherConfig[code] || weatherConfig[0]).icon;
        
        const uv = dailyData.uv_index_max[i];
        let uvClass = "uv-low";
        if (uv >= 6) uvClass = "uv-high";
        else if (uv >= 3) uvClass = "uv-mod";

        container.innerHTML += `
            <div class="forecast-card">
                <span class="forecast-day">${dayName}</span>
                ${icon}
                <span class="forecast-temp">${max}°</span>
                <span class="forecast-uv ${uvClass}">UV ${uv}</span>
            </div>
        `;
    }
}

window.addEventListener("load", () => {
    initMap();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                fetchDashboardData(lat, lon, "Local Weather");
                updateMapLocation(lat, lon, "Your Location");
            },
            () => { searchCity("New York"); }
        );
    } else {
        searchCity("New York");
    }
});
