const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function saveGameDataToJson() {
    try {
        const { data } = await axios.get('https://denverpioneers.com');
        const $ = cheerio.load(data);

        const targetSection = $('section[aria-labelledby="h2_scoreboard"]');
        if (!targetSection.length) {
            console.log(' Target <section> not found.');
            return;
        }

        const scriptContent = targetSection.find('script').html();
        if (!scriptContent) {
            console.log('No <script> found inside section.');
            return;
        }

        const objStart = scriptContent.indexOf('var obj =');
        if (objStart === -1) {
            console.log('"var obj" not found.');
            return;
        }

        let objContent = scriptContent.substring(objStart + 9);
        const objEnd = objContent.indexOf(';');
        objContent = objContent.substring(0, objEnd).trim();

        if (!objContent.startsWith('{') || !objContent.endsWith('}')) {
            console.log(" Extracted 'obj' is not valid JSON.");
            return;
        }

        const extractedData = JSON.parse(objContent);

        // **IMPORTANT: Change from `events` to `data`**
        if (!extractedData.data || !Array.isArray(extractedData.data)) {
            console.log("No game data found in extracted 'data'.");
            return;
        }

        // Extract only the required fields
        const formattedEvents = extractedData.data.map(event => ({
            sportTitle: event.sport?.title || "Unknown Du Team",
            opponent: event.opponent?.name || "Unknown Opponent",
            date: event.date || "Unknown Date"
        }));

        const outputDir = path.join(__dirname, 'results');
        const outputPath = path.join(outputDir, 'scoreboard.json');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify({ events: formattedEvents }, null, 4));

        console.log(`Saved ${formattedEvents.length} events to ${outputPath}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

saveGameDataToJson();

