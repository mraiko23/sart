const express = require('express');
const puppeteer = require('puppeteer');
const https = require('https'); // Добавляем модуль https для пинга
const app = express();

app.use(express.json({ limit: '50mb' }));

let puterPage;
const MY_URL = 'https://sart-5386.onrender.com'; // Твой адрес

// --- Функция авто-пинга ---
function startPinging() {
    setInterval(() => {
        console.log(`[Ping] Стучусь в систему для поддержания активности...`);
        https.get(MY_URL, (res) => {
            console.log(`[Ping] Статус ответа: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`[Ping] Ошибка: ${err.message}`);
        });
    }, 90000); // 90000 мс = 1.5 минуты
}

async function initPuter() {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        puterPage = await browser.newPage();
        
        await puterPage.setContent(`
            <script src="https://js.puter.com/v2/"></script>
            <script>console.log('Puter Engine Loaded');</script>
        `);
        
        console.log("🚀 Путь к ИИ через Puter проложен");
        
        // Запускаем пинг сразу после инициализации
        startPinging();
        
    } catch (e) {
        console.error("Ошибка при инициализации Puter:", e);
    }
}

// Эндпоинт для проверки (чтобы пинг видел, что сайт живой)
app.get('/', (req, res) => {
    res.send("API Bridge is Active and Running");
});

app.post('/v1/chat', async (req, res) => {
    const { message, image, model } = req.body;

    if (!message) return res.status(400).json({ error: "No message provided" });

    try {
        const aiResponse = await puterPage.evaluate(async (msg, img, mdl) => {
            try {
                const result = await puter.ai.chat(msg, img || undefined, { model: mdl });
                return { success: true, data: result };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }, message, image, model);

        if (aiResponse.success) {
            res.json({ result: aiResponse.data });
        } else {
            res.status(500).json({ error: aiResponse.error });
        }
    } catch (err) {
        res.status(500).json({ error: "Bridge Error: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Bridge online on port ${PORT}`);
    initPuter();
});
