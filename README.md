# Weather Forecast App

A web-based weather application built using **Python and Django** that fetches current weather information and displays forecast details for a selected city.

## Live Demo

**Live Application:** https://weather-forecast-app-offq.onrender.com

## Features

- Search weather information by city.
- View current weather conditions.
- Check the 5-day weather forecast.
- Switch between Celsius and Fahrenheit.
- Visualize weather information using charts.
- Simple, user-friendly web interface.

## Tech Stack

- **Backend:** Python, Django
- **Data Processing:** Pandas, NumPy
- **Machine Learning Library:** Scikit-learn
- **Weather API:** OpenWeatherMap
- **Frontend:** HTML, CSS, JavaScript
- **Deployment:** Render
- **Version Control:** Git and GitHub

## Getting Started

Follow these steps to run the project on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/ayush-bansal12/weather-forecast-app.git
```

### 2. Navigate to the Project Folder

```bash
cd weather-forecast-app
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

Activate it:

**Windows:**
```bash
venv\Scripts\activate
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure the API Key

Get an API key from [OpenWeatherMap](https://openweathermap.org/api).

Set the environment variable `OPENWEATHER_API_KEY` using your own API key.

**Windows — Command Prompt:**
```cmd
set OPENWEATHER_API_KEY=your_api_key_here
```

**Windows — PowerShell:**
```powershell
$env:OPENWEATHER_API_KEY="your_api_key_here"
```

**macOS / Linux:**
```bash
export OPENWEATHER_API_KEY="your_api_key_here"
```

Replace `your_api_key_here` with your own key. Never upload your actual API key to GitHub.

### 6. Apply Database Migrations

```bash
python manage.py migrate
```

### 7. Run the Application

```bash
python manage.py runserver
```

Open http://127.0.0.1:8000/ in your browser.

## Deployment

The application is deployed on Render.

For your own deployment, connect the GitHub repository to Render, configure the required environment variables, and use the appropriate Django build and start commands.

## Learning Outcomes

- Developing web applications with Django.
- Integrating an external weather API.
- Working with weather data using Python.
- Implementing temperature unit conversion.
- Using Git and GitHub for version control.
- Deploying a web application.

## Author

**Ayush Bansal**

GitHub: [ayush-bansal12](https://github.com/ayush-bansal12)

---

If you find this project useful, consider giving the repository a star!
