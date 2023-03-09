const express = require('express');
const app = express();
const port = 3000;
const puppeteer = require('puppeteer');
const address = process.env.ADDRESS;


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/start', async (req, res) => {
    const allowed_domains = [
        'quizlet.com',
    ];
    if (req.query.url.includes(allowed_domains)) {
        const browser = await puppeteer.launch({
            userDataDir: dataPath
        });
        const page = await browser.newPage();
        await page.goto(req.query.url);
        const list = await page.$$eval('.TermText', terms => terms.map(term => term.textContent));

        let term = [];
        let def = [];
        for (let i = 0; i < list.length; i += 2) {
            term.push(list[i]);
            def.push(list[i + 1]);
        }
        await browser.close();
        res.json({term, def});
    } else {
        res.status(400).send('Error: URL not allowed');
    }
});

app.listen(port, () => {
    console.log(`Server listening on ${address}`);
});
