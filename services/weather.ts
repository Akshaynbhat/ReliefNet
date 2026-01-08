
interface WeatherData {
  temperature: number;
  windSpeed: number;
  conditionCode: number;
  conditionText: string;
}

// WMO Weather interpretation codes (0-99)
const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear sky';
  if (code >= 1 && code <= 3) return 'Partly cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Overcast';
};

export const fetchWeather = async (city: string): Promise<WeatherData | null> => {
  try {
    // 1. Geocoding: Get Lat/Lng from City Name
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found');
    }

    const { latitude, longitude } = geoData.results[0];

    // 2. Weather: Get current weather using Lat/Lng
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();
    
    const current = weatherData.current_weather;

    return {
      temperature: current.temperature,
      windSpeed: current.windspeed,
      conditionCode: current.weathercode,
      conditionText: getWeatherCondition(current.weathercode)
    };
  } catch (error) {
    console.error("Weather Fetch Error:", error);
    return null;
  }
};
