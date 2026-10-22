
from django.shortcuts import render
import os
from datetime import datetime, timedelta

import requests
import pandas as pd
import numpy as np
import pytz

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor


API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5/"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "weather (1).csv")


def get_current_weather(city):
    url = f"{BASE_URL}weather"

    response = requests.get(
        url,
        params={
            "q": city,
            "appid": API_KEY,
            "units": "metric",
        },
        timeout=10,
    )

    print("Weather API status:", response.status_code)

    if not response.ok:
        print("Weather API response:", response.text)

    response.raise_for_status()
    data = response.json()

    return {
        "city": data["name"],
        "country": data["sys"]["country"],
        "current_temp": round(data["main"]["temp"]),
        "feels_like": round(data["main"]["feels_like"]),
        "temp_min": round(data["main"]["temp_min"]),
        "temp_max": round(data["main"]["temp_max"]),
        "humidity": data["main"]["humidity"],
        "description": data["weather"][0]["description"],
        "wind_gust_dir": data.get("wind", {}).get("deg", 0),
        "WindGustSpeed": data.get("wind", {}).get("speed", 0),
        "pressure": data["main"]["pressure"],
        "clouds": data.get("clouds", {}).get("all", 0),
        "visibility": data.get("visibility", 0),
    }


def read_historical_data(filename):
    if not os.path.isfile(filename):
        raise FileNotFoundError(f"CSV file not found: {filename}")

    df = pd.read_csv(filename)
    df = df.dropna().drop_duplicates().copy()

    return df


def prepare_data(data):
    required = [
        "MinTemp", "MaxTemp", "WindGustDir", "WindGustSpeed",
        "Humidity", "Pressure", "Temp", "RainTomorrow",
    ]

    missing = [col for col in required if col not in data.columns]
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")

    data = data[required].dropna().copy()

    wind_encoder = LabelEncoder()
    data["WindGustDir"] = wind_encoder.fit_transform(
        data["WindGustDir"].astype(str)
    )

    rain_encoder = LabelEncoder()
    data["RainTomorrow"] = rain_encoder.fit_transform(
        data["RainTomorrow"].astype(str)
    )

    X = data[
        [
            "MinTemp", "MaxTemp", "WindGustDir", "WindGustSpeed",
            "Humidity", "Pressure", "Temp",
        ]
    ]
    y = data["RainTomorrow"]

    return X, y, wind_encoder, rain_encoder


def train_rain_model(X, y):
    if len(X) < 5 or y.nunique() < 2:
        raise ValueError("Not enough varied data to train the rain model.")

    X_train, _, y_train, _ = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
    )
    model.fit(X_train, y_train)

    return model


def prepare_regression_data(data, feature):
    values = pd.to_numeric(
        data[feature], errors="coerce"
    ).dropna().to_numpy()

    if len(values) < 3:
        raise ValueError(f"Not enough data for {feature} prediction.")

    return values[:-1].reshape(-1, 1), values[1:]


def train_regression_model(X, y):
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
    )
    model.fit(X, y)
    return model


def predict_future(model, current_value, steps=5):
    predictions = []
    value = float(current_value)

    for _ in range(steps):
        value = float(model.predict(np.array([[value]]))[0])
        predictions.append(value)

    return predictions


def weather_view(request):
    context = {}

    if request.method != "POST":
        return render(request, "weather.html", context)

    city = (request.POST.get("city") or "").strip()

    if not city:
        context["error"] = "Please enter a city name."
        return render(request, "weather.html", context)

    if not API_KEY:
        context["error"] = "OpenWeather API key is not configured."
        return render(request, "weather.html", context)

    try:
        # Get current weather
        current = get_current_weather(city)

        # Read historical dataset
        historical = read_historical_data(CSV_PATH)

        # Train rain prediction model
        X, y, wind_encoder, rain_encoder = prepare_data(historical)
        rain_model = train_rain_model(X, y)

        # Convert wind degrees to compass direction
        directions = [
            "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
        ]

        wind_degrees = current["wind_gust_dir"] % 360
        direction_index = int((wind_degrees + 11.25) // 22.5) % 16
        direction = directions[direction_index]

        if direction not in wind_encoder.classes_:
            direction = wind_encoder.classes_[0]

        current_data = pd.DataFrame([{
            "MinTemp": current["temp_min"],
            "MaxTemp": current["temp_max"],
            "WindGustDir": int(wind_encoder.transform([direction])[0]),
            "WindGustSpeed": current["WindGustSpeed"],
            "Humidity": current["humidity"],
            "Pressure": current["pressure"],
            "Temp": current["current_temp"],
        }])

        rain_encoded = rain_model.predict(current_data)[0]
        rain_prediction = rain_encoder.inverse_transform([rain_encoded])[0]

        # Estimate upcoming temperature and humidity
        X_temp, y_temp = prepare_regression_data(historical, "Temp")
        X_hum, y_hum = prepare_regression_data(historical, "Humidity")

        temp_model = train_regression_model(X_temp, y_temp)
        hum_model = train_regression_model(X_hum, y_hum)

        future_temp = predict_future(
            temp_model, current["current_temp"]
        )
        future_humidity = predict_future(
            hum_model, current["humidity"]
        )

        timezone = pytz.timezone("Asia/Kolkata")
        now = datetime.now(timezone)
        next_hour = (now + timedelta(hours=1)).replace(
            minute=0, second=0, microsecond=0
        )

        context = {
            "location": city,
            "city": current["city"],
            "country": current["country"],
            "current_temp": current["current_temp"],
            "feels_like": current["feels_like"],
            "MinTemp": current["temp_min"],
            "MaxTemp": current["temp_max"],
            "humidity": current["humidity"],
            "clouds": current["clouds"],
            "description": current["description"],
            "time": now,
            "date": now.strftime("%B %d, %Y"),
            "wind": round(current["WindGustSpeed"] * 3.6, 1),
            "pressure": current["pressure"],
            "visibility": current["visibility"],
            "rain_prediction": rain_prediction,
        }

        for i in range(5):
            forecast_time = next_hour + timedelta(hours=i)
            context[f"time{i + 1}"] = forecast_time.strftime("%H:%M")
            context[f"temp{i + 1}"] = round(future_temp[i], 1)
            context[f"hum{i + 1}"] = round(
                max(0, min(100, future_humidity[i])), 1
            )

        return render(request, "weather.html", context)

    except requests.exceptions.HTTPError as exc:
        print("HTTP error:", exc)
        if exc.response is not None:
            print("API response:", exc.response.text)

            if exc.response.status_code == 401:
                context["error"] = "Invalid API key. Check your OpenWeather key."
            elif exc.response.status_code == 404:
                context["error"] = "City not found. Check the spelling."
            else:
                context["error"] = (
                    f"Weather API error: {exc.response.status_code}"
                )
        else:
            context["error"] = "Weather API request failed."

    except requests.exceptions.RequestException as exc:
        print("Request error:", repr(exc))
        context["error"] = "Could not connect to the weather service."

    except Exception as exc:
        print("Application error:", repr(exc))
        context["error"] = f"Could not process weather data: {exc}"

    return render(request, "weather.html", context)
