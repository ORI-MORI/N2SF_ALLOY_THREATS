const fs = require('fs');
const path = require('path');
const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');

async function run() {
    try {
        const exampleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'n2sf_schema_violation.json'), 'utf8'));

        console.log('1. Generating Alloy file...');
        const alloyFilePath = await generateAlloyFile(exampleData);
        console.log('Generated at:', alloyFilePath);

        console.log('2. Executing Alloy...');
        const violations = await executeAlloy(alloyFilePath);

        console.log('3. Analysis Result:');
        if (violations.length === 0) {
            console.log('No violations found (Unexpected!).');
        } else {
            console.log(`Found ${violations.length} violations:`);
            violations.forEach((v, i) => {
                console.log(`\n--- Violation ${i + 1}: ${v.rule} ---`);
                if (v.rule === 'NoTransmissionViolation') {
                    console.log(v.details);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
