// Converts WMO weather code to text and emoji
function getWeatherDescription(code) {
  if (code === 0) return { text: 'Clear sky', icon: '☀️' };
  if ([1, 2, 3].includes(code)) return { text: 'Partly cloudy', icon: '⛅' };
  if ([45, 48].includes(code)) return { text: 'Foggy', icon: '🌫️' };
  if ([51, 53, 55].includes(code)) return { text: 'Drizzle', icon: '🌦️' };
  if ([61, 63, 65].includes(code)) return { text: 'Rain', icon: '🌧️' };
  if ([71, 73, 75].includes(code)) return { text: 'Snow', icon: '❄️' };
  if ([80, 81, 82].includes(code)) return { text: 'Rain showers', icon: '🌦️' };
  if (code === 95) return { text: 'Thunderstorm', icon: '⛈️' };
  return { text: 'Unknown', icon: '🌡️' };
}




// Fetches lat/lon for a given city name
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('City not found');
  }

  const { name, country, latitude, longitude } = data.results[0];
  return { name, country, latitude, longitude };
}





// Fetches current weather and 5-day forecast using coordinates
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
  const response = await fetch(url);
  return await response.json();
}





// Updates the DOM with current weather data
function displayCurrentWeather(data, cityName, country) {
  const { temperature_2m, relative_humidity_2m, wind_speed_10m, weather_code } = data.current;
  const weather = getWeatherDescription(weather_code);

  document.getElementById('weather-icon').textContent = weather.icon;
  document.getElementById('city-name').textContent = `${cityName}, ${country}`;
  document.getElementById('temperature').textContent = `${Math.round(temperature_2m)}°C`;
  document.getElementById('description').textContent = weather.text;
  document.getElementById('humidity').textContent = `${relative_humidity_2m}%`;
  document.getElementById('wind').textContent = `${wind_speed_10m} km/h`;

  // UV isn't in Open-Meteo basic forecast, so display N/A
  document.getElementById('uv-index').textContent = 'N/A';

  // Show hidden sections
  document.getElementById('weather-hero').classList.remove('hidden');
  document.getElementById('stats-row').classList.remove('hidden');
}





// Renders the 5-day forecast rows
function displayForecast(daily) {
  const container = document.getElementById('forecast-container');
  container.innerHTML = '';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 5; i++) {
    const date = new Date(daily.time[i]);
    const dayName = i === 0 ? 'Today' : days[date.getDay()];
    const weather = getWeatherDescription(daily.weather_code[i]);

    const row = document.createElement('div');
    row.classList.add('forecast-row');
    row.innerHTML = `
      <span>${dayName}</span>
      <span>${weather.icon}</span>
      <div>
        <strong>${Math.round(daily.temperature_2m_max[i])}°</strong>
        <span style="color:#999"> ${Math.round(daily.temperature_2m_min[i])}°</span>
      </div>
    `;
    container.appendChild(row);
  }

  document.getElementById('forecast-section').classList.remove('hidden');
}






// Shows an error message and hides weather sections
function showError(message) {
  const err = document.getElementById('error-message');
  err.textContent = message;
  err.classList.remove('hidden');
}




// Triggered when Search is clicked — orchestrates everything
async function handleSearch() {
  const city = document.getElementById('city-input').value.trim();
  if (!city) return;

  // Reset state
  document.getElementById('error-message').classList.add('hidden');
  document.getElementById('weather-hero').classList.add('hidden');
  document.getElementById('stats-row').classList.add('hidden');
  document.getElementById('forecast-section').classList.add('hidden');

  const loading = document.getElementById('loading');
  loading.classList.remove('hidden');

  try {
    const { name, country, latitude, longitude } = await getCoordinates(city);
    const weatherData = await getWeather(latitude, longitude);

    displayCurrentWeather(weatherData, name, country);
    displayForecast(weatherData.daily);
  } catch (error) {
    showError(error.message || 'Something went wrong. Try again.');
  } finally {
    loading.classList.add('hidden');
  }
}

// Attach event listener
document.getElementById('search-btn').addEventListener('click', handleSearch);

// Allow pressing Enter to search
document.getElementById('city-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});