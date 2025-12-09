const { validateCommonProperties } = require('./src/simpleValidator');

const mockData = {
    locations: [
        { id: 'default_internet', type: 'Internet' }
    ],
    systems: [
        {
            id: '1',
            loc: 'default_internet',
            patchStatus: 'Vulnerable',
            grade: 'Open'
        },
        {
            id: '2',
            loc: 'default_internet',
            patchStatus: 'UpToDate',
            grade: 'Open'
        }
    ]
};

console.log('Running Validator Test...');
const result = validateCommonProperties(mockData);
console.log('Result:', JSON.stringify(result, null, 2));

if (result.threats.FindUnpatchedExposure.length === 1 && result.threats.FindUnpatchedExposure[0].system === 'System1') {
    console.log('SUCCESS: Detected Vulnerable System');
} else {
    console.log('FAILURE: Did not detect Vulnerable System correctly');
}
