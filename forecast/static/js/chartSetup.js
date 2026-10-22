
document.addEventListener('DOMContentLoaded', () => {
    const root = document.body;
    const chartCanvas = document.getElementById('chart');
    const unitToggle = document.getElementById('unitToggle');
    const themeToggle = document.getElementById('themeToggle');
    const refreshButton = document.getElementById('refreshButton');
    const searchForm = document.getElementById('weatherSearchForm');

    let chartInstance = null;
    let isFahrenheit = false;

    // Restore saved theme
    try {
        if (localStorage.getItem('weatherly-theme') === 'light') {
            root.classList.add('light-theme');
        }
    } catch (error) {
        console.warn('Theme preference could not be restored.');
    }

    updateThemeButton();

    function updateThemeButton() {
        if (!themeToggle) return;

        const isLight = root.classList.contains('light-theme');

        themeToggle.innerHTML = isLight
            ? '<i class="bi bi-moon-stars"></i>'
            : '<i class="bi bi-sun"></i>';

        themeToggle.setAttribute(
            'aria-label',
            isLight ? 'Switch to dark theme' : 'Switch to light theme'
        );

        themeToggle.title = isLight
            ? 'Switch to dark theme'
            : 'Switch to light theme';
    }

    // Dark / Light theme
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            root.classList.toggle('light-theme');

            try {
                localStorage.setItem(
                    'weatherly-theme',
                    root.classList.contains('light-theme') ? 'light' : 'dark'
                );
            } catch (error) {
                console.warn('Theme preference could not be saved.');
            }

            updateThemeButton();
            updateChartTheme();
        });
    }

    // Read original Celsius values from data attributes
    function getCelsius(element) {
    if (!element) return null;

    const raw = element.dataset.celsius;
    const value = Number.parseFloat(raw);

    return Number.isFinite(value) ? value : null;
    }

    function convertTemperature(celsius) {
        return isFahrenheit
            ? (celsius * 9 / 5) + 32
            : celsius;
    }

    function formatNumber(value) {
        return Math.round(value * 10) / 10;
    }

    // Read forecast data from HTML
    function readForecast() {
        const labels = [];
        const temps = [];
        const humidity = [];

        document.querySelectorAll('.forecast-item').forEach(item => {
            const timeElement = item.querySelector('.forecast-time');
            const tempElement = item.querySelector('.forecast-temperatureValue');

            // Supports the classes in the supplied HTML
            const humidityElement = item.querySelector(
                '.forecast-humidity span, .forecast-humidityValue'
            );

            const time = timeElement?.textContent.trim();
            const temperature = getCelsius(tempElement);

            const humidityValue = Number.parseFloat(
                (humidityElement?.textContent || '').replace(/[^\d.+-]/g, '')
            );

            if (time && temperature !== null) {
                labels.push(time);
                temps.push(temperature);

                humidity.push(
                    Number.isFinite(humidityValue) ? humidityValue : null
                );
            }
        });

        return { labels, temps, humidity };
    }

    // Temperature unit toggle: Celsius / Fahrenheit
    function updateTemperatureUnits() {
        document.querySelectorAll('.forecast-temperatureValue').forEach(element => {
            const celsius = getCelsius(element);

            if (celsius !== null) {
                element.textContent = formatNumber(
                    convertTemperature(celsius)
                );
            }
        });

        document.querySelectorAll('.forecast-unit').forEach(element => {
            element.textContent = isFahrenheit ? '°F' : '°C';
        });

        document.querySelectorAll('.js-temp').forEach(element => {
            const celsius = getCelsius(element);

            if (celsius !== null) {
                element.textContent = formatNumber(
                    convertTemperature(celsius)
                );
            }
        });

        document.querySelectorAll('.degree-unit').forEach(element => {
            element.textContent = isFahrenheit ? '°F' : '°C';
        });

        document.querySelectorAll('.unit-label').forEach(element => {
            element.textContent = isFahrenheit ? 'F' : 'C';
        });

        // Update the feels-like value without losing original Celsius
        const feelsLike = document.querySelector('.feels-like strong');

        if (feelsLike) {
            const celsius = getCelsius(feelsLike);

            if (celsius !== null) {
                feelsLike.textContent =
                    `${formatNumber(convertTemperature(celsius))}°${isFahrenheit ? 'F' : 'C'}`;
            }
        }

        if (unitToggle) {
            unitToggle.innerHTML = isFahrenheit
                ? '°F <span>/ °C</span>'
                : '°C <span>/ °F</span>';

            unitToggle.setAttribute('aria-pressed', String(isFahrenheit));
        }

        if (chartInstance) {
            const forecast = readForecast();

            chartInstance.data.datasets[0].data =
                forecast.temps.map(convertTemperature);

            chartInstance.data.datasets[0].label =
                `Temperature (°${isFahrenheit ? 'F' : 'C'})`;

            chartInstance.options.scales.y.title.text =
                isFahrenheit ? '°F' : '°C';

            chartInstance.update();
        }
    }

    if (unitToggle) {
        unitToggle.addEventListener('click', () => {
            isFahrenheit = !isFahrenheit;
            updateTemperatureUnits();
        });
    }

    // Refresh current page
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            refreshButton.disabled = true;

            const icon = refreshButton.querySelector('i');

            if (icon) {
                icon.classList.add('spin-icon');
            }

            refreshButton.style.opacity = '0.65';
            window.location.reload();
        });
    }

    // Search button loading effect
    if (searchForm) {
        searchForm.addEventListener('submit', () => {
            const button = searchForm.querySelector('.search-button');

            if (button) {
                button.classList.add('is-loading');

                const icon = button.querySelector('i');

                if (icon) {
                    icon.className = 'bi bi-arrow-repeat';
                }

                button.setAttribute('aria-label', 'Searching weather');
            }
        });
    }

    // Chart colors for both themes
    function getChartColors() {
        const isLight = root.classList.contains('light-theme');

        return {
            text: isLight ? '#687991' : '#9eacc4',
            grid: isLight
                ? 'rgba(45,70,110,.09)'
                : 'rgba(220,232,255,.075)',
            line: isLight ? '#477fe0' : '#9fc2ff',
            fillTop: isLight
                ? 'rgba(71,127,224,.25)'
                : 'rgba(126,174,255,.24)',
            fillBottom: isLight
                ? 'rgba(71,127,224,.015)'
                : 'rgba(126,174,255,.01)'
        };
    }

    function updateChartTheme() {
        if (!chartInstance || !chartCanvas) return;

        const colors = getChartColors();

        chartInstance.options.scales.x.ticks.color = colors.text;
        chartInstance.options.scales.y.ticks.color = colors.text;
        chartInstance.options.scales.x.grid.color = colors.grid;
        chartInstance.options.scales.y.grid.color = colors.grid;

        chartInstance.data.datasets[0].borderColor = colors.line;
        chartInstance.data.datasets[0].pointBackgroundColor = colors.line;

        const context = chartCanvas.getContext('2d');

        const gradient = context.createLinearGradient(
            0, 0, 0, chartCanvas.clientHeight || 200
        );

        gradient.addColorStop(0, colors.fillTop);
        gradient.addColorStop(1, colors.fillBottom);

        chartInstance.data.datasets[0].backgroundColor = gradient;
        chartInstance.update('none');
    }

    // Create interactive temperature chart
    function buildChart() {
        if (!chartCanvas) return;

        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded.');
            return;
        }

        const forecast = readForecast();

        if (!forecast.labels.length) {
            console.warn('No forecast temperature data was found.');
            return;
        }

        const colors = getChartColors();
        const context = chartCanvas.getContext('2d');

        const gradient = context.createLinearGradient(0, 0, 0, 220);

        gradient.addColorStop(0, colors.fillTop);
        gradient.addColorStop(1, colors.fillBottom);

        chartInstance = new Chart(context, {
            type: 'line',

            data: {
                labels: forecast.labels,

                datasets: [{
                    label: 'Temperature (°C)',
                    data: forecast.temps,

                    borderColor: colors.line,
                    backgroundColor: gradient,

                    fill: true,
                    borderWidth: 3,
                    tension: 0.38,

                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBorderWidth: 2,

                    pointBorderColor: root.classList.contains('light-theme')
                        ? '#ffffff'
                        : '#15243b',

                    pointBackgroundColor: colors.line
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: 'index'
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        displayColors: false,

                        backgroundColor: root.classList.contains('light-theme')
                            ? '#172842'
                            : '#080f1d',

                        titleColor: '#ffffff',
                        bodyColor: '#d7e5ff',

                        padding: 12,
                        cornerRadius: 10,

                        callbacks: {
                            label: context => {
                                const value = formatNumber(context.parsed.y);

                                return ` Temperature: ${value}°${isFahrenheit ? 'F' : 'C'}`;
                            }
                        }
                    }
                },

                scales: {
                    x: {
                        ticks: {
                            color: colors.text,
                            font: {
                                family: 'Inter',
                                size: 10
                            },
                            maxRotation: 0
                        },

                        grid: {
                            display: false
                        },

                        border: {
                            display: false
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text: '°C',
                            color: colors.text,

                            font: {
                                family: 'Inter',
                                size: 10
                            }
                        },

                        ticks: {
                            color: colors.text,

                            font: {
                                family: 'Inter',
                                size: 10
                            },

                            maxTicksLimit: 5
                        },

                        grid: {
                            color: colors.grid
                        },

                        border: {
                            display: false
                        }
                    }
                },

                animation: {
                    duration: 650,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Clicking a forecast card highlights its chart point
    document.querySelectorAll('.forecast-item').forEach((card, index) => {
        function selectCard() {
            document.querySelectorAll('.forecast-item').forEach(item => {
                item.classList.remove('is-selected');
            });

            card.classList.add('is-selected');

            if (chartInstance && index < chartInstance.data.labels.length) {
                chartInstance.setActiveElements([
                    { datasetIndex: 0, index }
                ]);

                chartInstance.tooltip.setActiveElements(
                    [{ datasetIndex: 0, index }],
                    { x: 0, y: 0 }
                );

                chartInstance.update();
            }
        }

        card.addEventListener('click', selectCard);

        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectCard();
            }
        });
    });

    // Initialize
    buildChart();

    if (unitToggle) {
        unitToggle.innerHTML = '°C <span>/ °F</span>';
    }
});
