const express = require('express');
const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const PORT = process.env.PORT || 8080;

app.post('/start', async (req, res) => {
  const { email, password, skillUrl } = req.body;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.ixl.com/signin');
    await page.type('#username', email);
    await page.type('#password', password);
    await Promise.all([
      page.click('[type=submit]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    await page.goto(skillUrl, { waitUntil: 'networkidle0' });

    let solved = 0;
    while (solved < 5) {
      const questionArea = await page.$('.question-container, .question');

      const buffer = await questionArea.screenshot();

      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      const questionText = text.replace(/\s+/g, '');

      console.log('🧠 OCR detected question:', questionText);

      let answer = null;

      try {
        // Example slope parsing (change as needed)
        if (questionText.includes("slope")) {
          // custom slope parser here if needed
          answer = '1'; // just default, you can add real parsing logic
        } else {
          answer = eval(questionText);
        }
      } catch {
        answer = null;
      }

      if (!answer) break;

      const inputSelector = 'input[type="text"]';
      await page.waitForSelector(inputSelector);
      await page.type(inputSelector, answer.toString());

      await Promise.all([
        page.click('.submit-button'),
        page.waitForTimeout(1500),
      ]);

      solved++;
    }

    await browser.close();
    res.send("✅ OCR IXL bot finished solving questions.");
  } catch (err) {
    console.error(err);
    await browser.close();
    res.send("❌ Error during solving.");
  }
});

app.get('/', (_, res) => res.sendFile(path.join(__dirname, '/public/indsex.html')));
app.listen(PORT, () => console.log("🚀 IXL OCR bot running on port 3000"));
