const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware to parse POST data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // Serve static files from the "public" directory

// The route to handle login and start solving problems
app.post('/start', async (req, res) => {
  const { email, password, skillUrl } = req.body;

  try {
    // Launch Puppeteer with new headless mode
    const browser = await puppeteer.launch({
      headless: 'new',  // Opt into new headless mode
    });

    const page = await browser.newPage();

    // Go to IXL login page
    await page.goto('https://www.ixl.com', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the username input to be visible and type in the email
    await page.waitForSelector('#username', { timeout: 5000 });
    await page.type('#username', email);

    // Wait for the password input to be visible and type in the password
    await page.waitForSelector('#password', { timeout: 5000 });
    await page.type('#password', password);

    // Submit the form by clicking the login button (update the selector if necessary)
    await page.click('#login_button');

    // Wait for navigation (this assumes successful login leads to a new page)
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });

    // Navigate to the skill URL provided by the user
    await page.goto(skillUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the question to be visible (change the selector based on actual page structure)
    await page.waitForSelector('.question', { timeout: 5000 });

    // Extract the question text or image (if image, we might need OCR)
    const questionText = await page.evaluate(() => {
      const questionElement = document.querySelector('.question');
      return questionElement ? questionElement.innerText : 'No question found';
    });

    // Optionally, if OCR is needed on images:
    // You can use Tesseract.js to process images and extract text

    // Return the question text to the client
    res.send(`Question: ${questionText}`);

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while processing your request');
  }
});

// Start the server on port 3000
app.listen(process.env.PORT || 8080, () => {
  console.log('Server running on http://localhost:3000');
});
