const express = require('express');
const puppeteer = require('puppeteer');
const https = require('https');
const app = express();

app.use(express.json({ limit: '50mb' }));

let puterPage;
const MY_URL = 'https://sart-5386.onrender.com';

// Функция само-пинга, чтобы сервер не засыпал
function startPinging() {
    setInterval(() => {
        console.log(`[Ping] Поддержание активности...`);
        https.get(MY_URL, (res) => {
            console.log(`[Ping] OK: ${res.statusCode}`);
        }).on('error', (e) => console.error(`[Ping] Fail: ${e.message}`));
    }, 90000); // 1.5 минуты
}

async function initPuter() {
    console.log("Запуск браузера...");
    try {
        const browser = await puppeteer.launch({
            // Важные флаги для работы на Render
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            headless: "new"
        });
        
        puterPage = await browser.newPage();
        
        // Загружаем Puter.js
        await puterPage.setContent(`
            <html>
                <head>
                    <script src="https://js.puter.com/v2/"></script>
                </head>
                <body>Puter Bridge Active</body>
            </html>
        `);
        
        console.log("🚀 Puter.js загружен в невидимом браузере");
        startPinging();
    } catch (err) {
        console.error("❌ Ошибка при запуске Puppeteer:", err);
    }
}

// Корневой эндпоинт
app.get('/', (req, res) => {
    res.send("API Bridge is Online");
});

// Основной эндпоинт для запросов к ИИ
app.post('/v1/chat', async (req, res) => {
    const { message, image, model } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // Выполняем запрос внутри страницы с Puter.js
        const aiResponse = await puterPage.evaluate(async (msg, img, mdl) => {
            try {
                // Прямой вызов Puter AI
                const response = await puter.ai.chat(msg, img || undefined, { model: mdl });
                return { success: true, result: response };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }, message, image, model);

        if (aiResponse.success) {
            res.json({ result: aiResponse.result });
        } else {
            res.status(500).json({ error: aiResponse.error });
        }
    } catch (err) {
        res.status(500).json({ error: "Internal Bridge Error: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    initPuter();
});
