const { generateAlloyFile } = require('./src/alloyGenerator');
const fs = require('fs');
const path = require('path');

const testPayload = JSON.parse(fs.readFileSync('test_n2sf_schema.json', 'utf8'));

try {
    const outputPath = generateAlloyFile(testPayload);
    console.log('Generation successful:', outputPath);
    const content = fs.readFileSync(outputPath, 'utf8');
    console.log('Generated Content Preview:');
    console.log(content);
} catch (error) {
    console.error('Generation failed:', error);
}
