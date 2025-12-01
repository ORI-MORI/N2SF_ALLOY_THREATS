const fs = require('fs');
const path = require('path');
const { generateAlloyFile } = require('./src/alloyGenerator');

const exampleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'n2sf_schema_example.json'), 'utf8'));

generateAlloyFile(exampleData).then(outputPath => {
    console.log('Generated file at:', outputPath);
    console.log('Content preview:');
    console.log(fs.readFileSync(outputPath, 'utf8'));
}).catch(err => console.error(err));
