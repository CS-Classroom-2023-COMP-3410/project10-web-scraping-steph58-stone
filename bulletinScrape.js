//to run: node bulletinScrape.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');


//example html for courseblock in bulletin
{/* <div class="courseblock">
<p class="courseblocktitle"><strong>COMP&nbsp;1101 Analytical Inquiry I  (4 Credits)</strong></p>
<p class="courseblocktitle">
Students explore the use of mathematics and computer programming in creating animations.  Students create animations on their laptop computers using animation software. This course counts toward the Analytical Inquiry: The Natural and Physical World requirement.<br>
</p>
</div> */}


//Scrape the [DU bulletin](https://bulletin.du.edu/) to find all **Computer Science (COMP)** courses 
// that are **upper-division (3000-level or higher)** and have **no prerequisites**. 
// Extract the **course code** and **course title**, 
// then save the data in a JSON file (`results/bulletin.json`)


//Need to: pull out the course number from the "courseblocktitle"
//Need to" test if the word "prerequisites" is included in "courseblockdesc"


const url = 'https://bulletin.du.edu/undergraduate/coursedescriptions/comp/';


async function scrapey(){
    try {
        const { data } = await axios.get('https://bulletin.du.edu/undergraduate/coursedescriptions/comp/');
        let courses = []; // Array to store course data

        const $ = cheerio.load(data);

        // Loop through all course divs
        $('.courseblock').each((index, element) => {
            const firstDivText = $(element).find('.courseblocktitle').text().trim();

            // Extract course number using regex (looks for 4-digit number)
            const courseNumberMatch = firstDivText.match(/\b(\d{4})\b/);
            const courseNumber = courseNumberMatch ? parseInt(courseNumberMatch[1], 10) : 0;

            // Only process courses that are 3000 level or higher
            if (courseNumber >= 3000) {
                const secondDivText = $(element).find('.courseblockdesc').text().trim();
                const hasPrerequisite = secondDivText.toLowerCase().includes('prerequisite');

                if (!hasPrerequisite) {
                    // Extracting course name without number
                    const courseCode = firstDivText.match(/COMP \d{4}/) ? firstDivText.match(/COMP \d{4}/)[0] : "Unknown";
                    const courseTitle = firstDivText.replace(/COMP \d{4} - /, '').trim(); 

                    // Add to courses array
                    courses.push({
                        "course": courseCode,
                        "title": courseTitle
                    });
                }
            }
        });

         // Define output directory and file path
         const outputDir = path.join(__dirname, 'results');
         const outputPath = path.join(outputDir, 'bulletin.json');
 
         // Create the directory if it doesn't exist
         if (!fs.existsSync(outputDir)) {
             fs.mkdirSync(outputDir, { recursive: true });
         }
 
         // Save JSON file
         fs.writeFileSync(outputPath, JSON.stringify({ "courses": courses }, null, 4));
 
         console.log(`Saved ${courses.length} courses to ${outputPath}`);
    } catch (error) {
        
    }
}

scrapey();
