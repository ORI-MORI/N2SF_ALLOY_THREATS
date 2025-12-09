const fs = require('fs');
const path = require('path');
const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');

async function runDebug() {
    try {
        console.log("Reading payload...");
        const payloadPath = path.join(__dirname, 'last_request_payload.json');
        const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

        console.log("Generating Alloy file...");
        const alloyPath = generateAlloyFile(payload);

        console.log(`Alloy file generated at: ${alloyPath}`);

        // Read and print the generated ALS file content
        if (fs.existsSync(alloyPath)) {
            const alsContent = fs.readFileSync(alloyPath, 'utf8');
            console.log("----- GENERATED ALS CONTENT START -----");
            console.log(alsContent);
            console.log("----- GENERATED ALS CONTENT END -----");
        } else {
            console.error("Generated Alloy file not found!");
            return;
        }

        console.log("Executing Alloy analysis...");
        const result = await executeAlloy(alloyPath);

        console.log("Analysis Result:", JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("Debug execution failed:", error);
    }
}

runDebug();
