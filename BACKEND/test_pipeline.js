const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');
const fs = require('fs');
const path = require('path');

// 1. Mock JSON (Simulating Frontend Output)
const mockJson = {
    locations: [
        { id: 1, type: 'Intranet', grade: 'Sensitive' },
        { id: 2, type: 'DMZ', grade: 'Sensitive' }
    ],
    systems: [
        {
            id: 101, // Test_Mobile
            loc: 1,
            type: 'Mobile',
            grade: 'Sensitive',
            authType: 'MFA',
            isCDS: false,
            isRegistered: true,
            hasMDM: true,
            isStorageEncrypted: false, // Threat: Unencrypted Storage
            isManagement: true,
            isolation: 'None',
            stores: ['Data1']
        },
        {
            id: 102, // Server_A
            loc: 2,
            type: 'Server',
            grade: 'Sensitive',
            authType: 'MFA',
            isCDS: false,
            isRegistered: true,
            hasMDM: false,
            isStorageEncrypted: true,
            isManagement: false,
            isolation: 'None',
            stores: []
        }
    ],
    data: [
        { id: 'Data1', grade: 'Sensitive', fileType: 'Document' }
    ],
    connections: [
        {
            id: 201, // Test_Conn
            from: 101,
            to: 102,
            carries: ['Data1'],
            protocol: 'HTTPS',
            isEncrypted: true,
            hasCDR: true,
            hasDLP: false, // Threat: Content Control Failure (No DLP)
            hasAntiVirus: true
        }
    ]
};

console.log('============================================================');
console.log('[Step 1] Frontend Mock JSON Generated');
console.log('============================================================');
console.log(JSON.stringify(mockJson, null, 2));

// 2. Generate Alloy Code
console.log('\n============================================================');
console.log('[Step 2] Generating Alloy Code (alloyGenerator.js)');
console.log('============================================================');
try {
    const alloyFilePath = generateAlloyFile(mockJson);
    const alloyContent = fs.readFileSync(alloyFilePath, 'utf8');

    // Extract relevant parts for verification
    const mobileSig = alloyContent.match(/one sig System101[\s\S]*?}/)[0];
    const connSig = alloyContent.match(/one sig Connection201[\s\S]*?}/)[0];

    console.log('--- Generated System101 (Test_Mobile) ---');
    console.log(mobileSig);
    console.log('\n--- Generated Connection201 (Test_Conn) ---');
    console.log(connSig);

    // 3. Execute Alloy
    console.log('\n============================================================');
    console.log('[Step 3] Executing Alloy Analysis (alloyExecutor.js)');
    console.log('============================================================');

    executeAlloy(alloyFilePath).then(result => {
        console.log('DEBUG: executeAlloy result:', JSON.stringify(result, null, 2));
        fs.writeFileSync('test_result.json', JSON.stringify(result, null, 2));

        if (!result.success) {
            console.error('Execution Failed (Logic):', result.error);
            return;
        }

        console.log('\n[Analysis Result Summary]');
        console.log(`Total Violations: ${result.total_count}`);

        console.log('\n[Detailed Threats]');
        Object.keys(result.threats).forEach(key => {
            if (result.threats[key].length > 0) {
                console.log(`\n>>> ${key} DETECTED <<<`);
                result.threats[key].forEach(item => {
                    console.log(JSON.stringify(item, null, 2));
                });
            }
        });

    }).catch(err => {
        console.error('Execution Failed:', err);
    });

} catch (err) {
    console.error('Test Failed:', err);
}
