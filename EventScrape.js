const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function extractEvents() {
    let events = [];
    try {
        const { data } = await axios.get('https://www.du.edu/calendar?search=&start_date=2025-01-01&end_date=2025-12-31#events-listing-date-filter-anchor');
        const $ = cheerio.load(data);

        

        // Loop through all elements that contain "events-listing__item" in their class name
        $('[class*="events-listing__item"] a.event-card').each((index, element) => {
            const title = $(element).find('h3').text().trim();
            const date = $(element).find('p').first().text().trim();
            const time = $(element).find('p:has(.icon-du-clock)').text().replace(/\s+/g, ' ').trim() || null;
            const location = $(element).find('p:has(.icon-du-location)').text().replace(/\s+/g, ' ').trim() || null;
            const eventURL = $(element).attr('href');

            events.push({
                title,
                date,
                ...(time ? { time } : {}),
                ...(location ? { location } : {}),
                url: eventURL ? eventURL : null,
                description: ""
            });
        });

        console.log(`✅ Found ${events.length} events.`);
        console.log(events);

    } catch (error) {
        console.error('❌ Error scraping data:', error);
    }

    for (let event of events) {
        if (event.url) {
            try {
                const { data: eventPage } = await axios.get(event.url);
                const $event = cheerio.load(eventPage);
    
                console.log(`🔎 Debugging ${event.title}:`);
                console.log("🔹 Full description div content:");
                console.log($event('div[itemprop="description"]').html()); // Debug raw HTML
    
                let description = "";

                // ✅ Extract main description inside div[itemprop="description"]
                let mainDescription = $event('div[itemprop="description"]').text().trim();

                // ✅ Extract additional text inside .fieldBody (nested event details)
                let extraDetails = $event('.fieldBody').text().trim();

                // ✅ Extract extra content inside .fieldContainer (some descriptions are inside this)
                let moreDetails = $event('.fieldContainer').text().trim();

                // ✅ Combine descriptions (removing empty ones)
                description = [mainDescription, extraDetails, moreDetails]
                    .filter(text => text && text.length > 0) // Remove empty text blocks
                    .join("\n\n"); // Keep paragraphs separated

                // ✅ Handle missing descriptions
                if (!description.trim()) {
                    description = "No description available.";
                }

                event.description = description;

                console.log(`🔍 Extracted Description for ${event.title}:`);
                console.log(description);
    
            } catch (err) {
                console.warn(`⚠️ Could not fetch description for: ${event.title}, Error: ${err.message}`);
            }
        }
    }
    
    // Save results to JSON
    const outputDir = path.join(__dirname, 'results');
    const outputPath = path.join(outputDir, 'calendar_events.json');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify({ events }, null, 4));

    console.log(`🎉 Successfully saved ${events.length} events with descriptions to ${outputPath}`);
}

extractEvents();