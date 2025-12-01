const fs = require('fs');
const path = require('path');

async function generateAlloyFile(data) {
    // Output to the main alloy directory where n2sf_rules.als resides
    // __dirname is BACKEND/src
    // ../../alloy is c:/OTD-Alloy/alloy
    const outputPath = path.resolve(__dirname, '../../alloy/user_instance.als');

    let content = 'module user_instance\n\n';
    content += 'open n2sf_rules\n\n';

    // Helper to format sets
    const formatSet = (ids, prefix) => {
        if (!ids || ids.length === 0) return 'none';
        return ids.map(id => `${prefix}${id}`).join(' + ');
    };

    // 1. Locations
    if (data.locations) {
        data.locations.forEach(loc => {
            content += `one sig Location${loc.id} extends Location {}\n`;
            content += `fact {\n`;
            content += `    Location${loc.id}.id = ${loc.id}\n`;
            content += `    Location${loc.id}.type = ${loc.type}\n`;
            content += `    Location${loc.id}.grade = ${loc.grade}\n`;
            content += `}\n\n`;
        });
    }

    // 2. Data
    if (data.data) {
        data.data.forEach(d => {
            content += `one sig Data${d.id} extends Data {}\n`;
            content += `fact {\n`;
            content += `    Data${d.id}.id = ${d.id}\n`;
            content += `    Data${d.id}.grade = ${d.grade}\n`;
            content += `}\n\n`;
        });
    }

    // 3. Systems
    if (data.systems) {
        data.systems.forEach(sys => {
            content += `one sig System${sys.id} extends System {}\n`;
            content += `fact {\n`;
            content += `    System${sys.id}.id = ${sys.id}\n`;
            content += `    System${sys.id}.location = Location${sys.location}\n`;
            content += `    System${sys.id}.grade = ${sys.grade}\n`;
            content += `    System${sys.id}.type = ${sys.type}\n`;
            content += `    System${sys.id}.authType = ${sys.authType}\n`;
            content += `    System${sys.id}.stores = ${formatSet(sys.stores, 'Data')}\n`;
            content += `}\n\n`;
        });
    }

    // 4. Connections
    const connectionNames = [];
    if (data.connections) {
        data.connections.forEach((conn, index) => {
            const connName = `Connection${index + 1}`;
            connectionNames.push(connName);
            content += `one sig ${connName} extends Connection {}\n`;
            content += `fact {\n`;
            content += `    ${connName}.from = System${conn.from}\n`;
            content += `    ${connName}.to = System${conn.to}\n`;
            content += `    ${connName}.carries = ${formatSet(conn.carries, 'Data')}\n`;
            content += `    ${connName}.protocol = ${conn.protocol}\n`;
            content += `    ${connName}.isEncrypted = ${conn.isEncrypted ? 'True' : 'False'}\n`;
            content += `    ${connName}.hasCDR = ${conn.hasCDR ? 'True' : 'False'}\n`;
            content += `}\n\n`;
        });
    }

    // Explicitly close the sets to prevent unwanted atoms
    const locationNames = data.locations ? data.locations.map(l => `Location${l.id}`) : [];
    const dataNames = data.data ? data.data.map(d => `Data${d.id}`) : [];
    const systemNames = data.systems ? data.systems.map(s => `System${s.id}`) : [];

    content += `fact {\n`;
    content += `    Location = ${locationNames.length > 0 ? locationNames.join(' + ') : 'none'}\n`;
    content += `    Data = ${dataNames.length > 0 ? dataNames.join(' + ') : 'none'}\n`;
    content += `    System = ${systemNames.length > 0 ? systemNames.join(' + ') : 'none'}\n`;
    content += `    Connection = ${connectionNames.length > 0 ? connectionNames.join(' + ') : 'none'}\n`;
    content += `}\n\n`;

    // Append Check Commands
    content += 'check NoStorageViolation\n';
    content += 'check NoTransmissionViolation\n';
    content += 'check NoLocationInappropriateness\n';
    content += 'check NoBypassConnection\n';
    content += 'check NoUnencryptedTransmission\n';
    content += 'check NoAuthIntegrityMissing\n';
    content += 'check NoContentControlMissing\n';

    fs.writeFileSync(outputPath, content);
    return outputPath;
}

module.exports = { generateAlloyFile };
