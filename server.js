const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json({ limit: '50mb' })); // Чтобы принимать тяжелые картинки

let puterPage;

// 1. Запуск невидимого браузера при старте сервера
async function initPuter() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    puterPage = await browser.newPage();
    
    // Загружаем пустую страницу с Puter.js
    await puterPage.setContent(`
        <script src="https://js.puter.com/v2/"></script>
        <script>console.log('Puter Loaded');</script>
    `);
    
    console.log("🚀 Путь к ИИ через Puter проложен");
}

// 2. Универсальный эндпоинт для работы с ИИ
app.post('/v1/chat', async (req, res) => {
    const { message, image, model } = req.body;

    if (!message) return res.status(400).json({ error: "No message provided" });

    try {
        // Выполняем код прямо внутри "браузера" Puter
        const aiResponse = await puterPage.evaluate(async (msg, img, mdl) => {
            try {
                // Если есть картинка, передаем её вторым аргументом
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