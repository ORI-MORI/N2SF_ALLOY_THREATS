const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');
const fs = require('fs');

// 1. Test Payload (Admin Access Violation Scenario)
const testPayload = {
    "locations": [
        { "id": "Internet_Zone", "grade": "Open", "type": "Internet" },
        { "id": "Internal_Zone", "grade": "Sensitive", "type": "Intranet" }
    ],
    "data": [
        { "id": "Sensitive_Data", "grade": "Sensitive", "fileType": "Document" }
    ],
    "systems": [
        {
            "id": "Hacker_Mobile",
            "grade": "Open",
            "location": "Internet_Zone",
            "type": "Mobile",
            "isManagement": false,    // [Condition 1] Normal device (Not Management)
            "hasMDM": false,          // [Condition 2] No MDM
            "authType": "Single",
            "isCDS": false,
            "isRegistered": true,
            "isStorageEncrypted": true,
            "stores": []
        },
        {
            "id": "Admin_Server",
            "grade": "Sensitive",
            "location": "Internal_Zone",
            "type": "Server",
            "isManagement": true,     // [Destination] Management Server
            "authType": "MFA",
            "isCDS": false,
            "isRegistered": true,
            "isStorageEncrypted": true,
            "stores": ["Sensitive_Data"]
        }
    ],
    "connections": [
        {
            "id": "Attack_Conn",
            "from": "Hacker_Mobile",
            "to": "Admin_Server",
            "carries": ["Sensitive_Data"],
            "protocol": "HTTPS",
            "isEncrypted": true,
            "hasCDR": true,
            "hasDLP": false,          // [Condition 3] Sensitive data without DLP
            "hasAntiVirus": true
        }
    ]
};

console.log('Starting Acceptance Test...');

try {
    // 2. Generate Alloy Code
    const alloyFilePath = generateAlloyFile(testPayload);
    console.log(`Alloy file generated at: ${alloyFilePath}`);

    // 3. Execute Alloy Analysis
    executeAlloy(alloyFilePath).then(result => {
        console.log('Analysis completed.');

        // Write result to file for verification
        fs.writeFileSync('acceptance_result.json', JSON.stringify(result, null, 2));
        console.log('Result written to acceptance_result.json');

    }).catch(err => {
        console.error('Execution Failed:', err);
    });

} catch (err) {
    console.error('Test Failed:', err);
}
