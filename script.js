// Weather icon & description configurations
const weatherConfig = {
    0: { text: "Clear Sky", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>` },
    1: { text: "Mainly Clear", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19.07A7 7 0 1 0 5 10.5a7 7 0 0 0 12.5 8.57z"/></svg>` },
    2: { text: "Partly Cloudy", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>` },
    3: { text: "Overcast", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>` },
    45: { text: "Foggy", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9h14M3 12h18M5 15h14"/></svg>` },
    61: { text: "Rain", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>` },
    71: { text: "Snow", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M16 16h.01M16 20h.01"/></svg>` },
    95: { text: "Thunderstorm", icon: `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>` }
};

document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchCity();
});

// Theme Switch Logic
function toggleTheme() {
    const body = document.body;
    body.classList.toggle("light-mode");
    const isLight = body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
}

// Load Saved Theme Preference
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
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
        fetchDashboardData(latitude, longitude, `${name}, ${country || ''}`);

    } catch (err) {
        alert("Failed to fetch location information.");
    }
}

async function fetchDashboardData(lat, lon, locationLabel) {
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;

    try {
        const response = await fetch(weatherURL);
        const data = await response.json();

        // 1. Populate Left Spotlight Card
        document.getElementById("cityName").innerText = locationLabel;
        document.getElementById("temp").innerText = `${Math.round(data.current.temperature_2m)}°`;
        document.getElementById("humidity").innerText = data.current.relative_humidity_2m;
        document.getElementById("wind").innerText = data.current.wind_speed_10m;

        const code = data.current.weather_code;
        const weatherDetails = weatherConfig[code] || { text: "Clear", icon: weatherConfig[0].icon };
        document.getElementById("conditionBadge").innerText = weatherDetails.text;
        document.getElementById("mainWeatherIcon").innerHTML = weatherDetails.icon;

        const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
        const minTemp = Math.round(data.daily.temperature_2m_min[0]);
        document.getElementById("minMaxTemp").innerText = `H: ${maxTemp}° | L: ${minTemp}°`;

        const now = new Date();
        document.getElementById("localTime").innerText = now.toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // 2. Populate Metrics Grid
        document.getElementById("feelsLike").innerText = `${Math.round(data.current.apparent_temperature)}°`;
        document.getElementById("precipitation").innerText = data.current.precipitation;
        document.getElementById("pressure").innerText = Math.round(data.current.surface_pressure);
        
        const uv = data.daily.uv_index_max[0];
        document.getElementById("uvIndex").innerText = uv;
        document.getElementById("uvLevel").innerText = uv >= 6 ? "High Risk" : (uv >= 3 ? "Moderate Risk" : "Low Risk");

        // 3. Render 7-Day Forecast Row with UV Ratings
        render7DayForecast(data.daily);

    } catch (err) {
        alert("Error retrieving detailed weather metrics.");
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
        
        // UV Index styling calculation
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

// Automatic Geolocation Detection on startup
window.addEventListener("load", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchDashboardData(pos.coords.latitude, pos.coords.longitude, "Local Weather"),
            () => searchCity("New York")
        );
    } else {
        searchCity("New York");
    }
});
