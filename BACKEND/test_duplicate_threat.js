const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');
const fs = require('fs');
const path = require('path');

const mockPayload = {
    locations: [{ id: 1, grade: 'Open', type: 'Internet' }],
    systems: [
        { id: 101, loc: 1, grade: 'Open', type: 'Server', stores: [], isCDS: false, isRegistered: false, isStorageEncrypted: false, isManagement: false, isolation: 'None', hasMDM: false },
        { id: 102, loc: 1, grade: 'Open', type: 'Terminal', stores: [], isCDS: false, isRegistered: false, isStorageEncrypted: false, isManagement: false, isolation: 'None', hasMDM: false }
    ],
    connections: [
        { id: 123, from: 101, to: 102, carries: [], protocol: 'HTTP', isEncrypted: false, hasCDR: false, hasDLP: false, hasAntiVirus: false }
    ]
};

async function run() {
    try {
        console.log("Generating Alloy file...");
        const outputPath = generateAlloyFile(mockPayload);
        console.log("Executing Alloy...");
        const result = await executeAlloy(outputPath);

        console.log("Execution Result:", JSON.stringify(result, null, 2));

        // Read XML content
        const xmlPath = outputPath.replace('.als', '.xml');
        if (fs.existsSync(xmlPath)) {
            const xmlContent = fs.readFileSync(xmlPath, 'utf8');
            console.log("\n--- XML Snippet for FindUnencryptedChannels ---");
            const snippet = xmlContent.match(/<field label="FindUnencryptedChannels"[\s\S]*?<\/field>/);
            if (snippet) {
                console.log(snippet[0]);
            } else {
                console.log("Field FindUnencryptedChannels not found in XML.");
            }
        }
    } catch (e) {
        console.error(e);
    }
}

run();
