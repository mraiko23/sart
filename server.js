const express = require('express');
const puppeteer = require('puppeteer');
const https = require('https');
const app = express();

app.use(express.json({ limit: '50mb' }));

let puterPage;
const MY_URL = 'https://sart-5386.onrender.com';

// Функция само-пинга для предотвращения "засыпания"
function startPinging() {
    setInterval(() => {
        console.log(`[Ping] Поддержание активности...`);
        https.get(MY_URL, (res) => {
            if (res.statusCode === 200) {
                console.log(`[Ping] Сервер бодрствует (200 OK)`);
            }
        }).on('error', (e) => console.error(`[Ping] Ошибка: ${e.message}`));
    }, 90000); // 1.5 минуты
}

async function initPuter() {
    console.log("🚀 Инициализация Puppeteer...");
    try {
        const browser = await puppeteer.launch({
            // Путь к Chrome внутри Docker-образа puppeteer
            executablePath: '/usr/bin/google-chrome', 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            headless: "new"
        });
        
        puterPage = await browser.newPage();
        
        // Загружаем окружение Puter.js
        await puterPage.setContent(`
            <html>
                <head>
                    <script src="https://js.puter.com/v2/"></script>
                </head>
                <body>
                    <h1>Puter API Bridge Active</h1>
                    <script>console.log('Puter.js Engine Ready');</script>
                </body>
            </html>
        `);
        
        console.log("✅ Puter.js успешно загружен в невидимом браузере");
        startPinging();
    } catch (err) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА инициализации:", err);
    }
}

// Корневой маршрут для проверки работы и пинга
app.get('/', (req, res) => {
    res.send("<h1>Puter API Bridge is Online</h1><p>Status: Ready to handle requests.</p>");
});

// Основной эндпоинт для твоего Python скрипта
app.post('/v1/chat', async (req, res) => {
    const { message, image, model } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        console.log(`[AI Request] Модель: ${model || 'default'}`);
        
        // Выполняем логику внутри браузера
        const aiResponse = await puterPage.evaluate(async (msg, img, mdl) => {
            try {
                // Обращаемся напрямую к Puter.js
                const response = await puter.ai.chat(msg, img || undefined, { model: mdl });
                return { success: true, result: response };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }, message, image, model);

        if (aiResponse.success) {
            console.log(`[AI Response] Успешно получено.`);
            res.json({ result: aiResponse.result });
        } else {
            console.error(`[AI Error] ${aiResponse.error}`);
            res.status(500).json({ error: aiResponse.error });
        }
    } catch (err) {
        console.error(`[Bridge Error] ${err.message}`);
        res.status(500).json({ error: "Internal Bridge Error: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`URL: ${MY_URL}`);
    console.log(`-----------------------------------------`);
    initPuter();
});
