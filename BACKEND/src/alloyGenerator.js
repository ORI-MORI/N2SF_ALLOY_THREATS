const fs = require('fs');
const path = require('path');

function generateAlloyFile(jsonData) {
    let alloyContent = `module user_instance
open n2sf_rules

`;

    // 1. Locations (Zones)
    if (jsonData.locations && jsonData.locations.length > 0) {
        alloyContent += `one sig ${jsonData.locations.map(l => 'Location' + l.id).join(', ')} extends Location {}\n`;

        // Location Facts
        jsonData.locations.forEach(loc => {
            // Map grade and type to Enums
            const grade = loc.grade || 'Open';
            const type = loc.type || 'Internet';
            alloyContent += `fact { Location${loc.id}.id = ${loc.id} and Location${loc.id}.grade = ${grade} and Location${loc.id}.type = ${type} }\n`;
        });
        // Close the set
        alloyContent += `fact { Location = ${jsonData.locations.map(l => 'Location' + l.id).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no Location }\n`;
    }
    alloyContent += '\n';

    // 2. Data
    if (jsonData.data && jsonData.data.length > 0) {
        alloyContent += `one sig ${jsonData.data.map(d => 'Data' + d.id).join(', ')} extends Data {}\n`;

        // Data Facts
        jsonData.data.forEach(d => {
            const grade = d.grade || 'Open';
            const fileType = d.fileType || 'Document';
            alloyContent += `fact { Data${d.id}.id = ${d.id} and Data${d.id}.grade = ${grade} and Data${d.id}.fileType = ${fileType} }\n`;
        });
        // Close the set
        alloyContent += `fact { Data = ${jsonData.data.map(d => 'Data' + d.id).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no Data }\n`;
    }
    alloyContent += '\n';

    // 3. Systems (Nodes)
    if (jsonData.systems && jsonData.systems.length > 0) {
        alloyContent += `one sig ${jsonData.systems.map(s => 'System' + s.id).join(', ')} extends System {}\n`;

        // System Facts
        jsonData.systems.forEach(sys => {
            const stores = sys.stores && sys.stores.length > 0 ? sys.stores.map(id => `Data${id}`).join(' + ') : 'none';
            const grade = sys.grade || 'Open';
            const type = sys.type || 'Terminal';
            const authType = sys.authType || 'Single';

            alloyContent += `fact { 
    System${sys.id}.id = ${sys.id} 
    System${sys.id}.location = Location${sys.location} 
    System${sys.id}.grade = ${grade} 
    System${sys.id}.type = ${type} 
    System${sys.id}.isCDS = ${sys.isCDS ? 'True' : 'False'} 
    System${sys.id}.isDeidentifier = ${sys.isDeidentifier ? 'True' : 'False'} 
    System${sys.id}.authType = ${authType} 
    System${sys.id}.isRegistered = ${sys.isRegistered ? 'True' : 'False'} 
    System${sys.id}.stores = ${stores} 
}\n`;
        });
        // Close the set
        alloyContent += `fact { System = ${jsonData.systems.map(s => 'System' + s.id).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no System }\n`;
    }
    alloyContent += '\n';

    // 4. Connections (Edges)
    if (jsonData.connections && jsonData.connections.length > 0) {
        alloyContent += `one sig ${jsonData.connections.map((c, i) => 'Connection' + (c.id || i)).join(', ')} extends Connection {}\n`;

        // Connection Facts
        jsonData.connections.forEach((conn, index) => {
            const connId = conn.id || index;
            const carries = conn.carries && conn.carries.length > 0 ? conn.carries.map(id => `Data${id}`).join(' + ') : 'none';
            const protocol = conn.protocol || 'ClearText';

            alloyContent += `fact { 
    Connection${connId}.from = System${conn.from} 
    Connection${connId}.to = System${conn.to} 
    Connection${connId}.carries = ${carries} 
    Connection${connId}.protocol = ${protocol} 
    Connection${connId}.hasCDR = ${conn.hasCDR ? 'True' : 'False'} 
    Connection${connId}.hasAntiVirus = ${conn.hasAntiVirus ? 'True' : 'False'} 
}\n`;
        });
        // Close the set
        alloyContent += `fact { Connection = ${jsonData.connections.map((c, i) => 'Connection' + (c.id || i)).join(' + ')} }\n`;
    } else {
        alloyContent += `fact { no Connection }\n`;
    }

    // Add AnalysisResult sig to capture violations (Already defined in n2sf_rules.als, but we need to run it)
    // We don't need to redefine AnalysisResult here as it is in n2sf_rules.als
    // We just need the run command.

    alloyContent += `
// Run the check defined in n2sf_rules
run CheckViolations
`;

    const alloyDir = path.join(process.cwd(), 'alloy');
    if (!fs.existsSync(alloyDir)) {
        fs.mkdirSync(alloyDir, { recursive: true });
    }

    const outputPath = path.join(alloyDir, 'user_instance.als');
    console.log(`Generating Alloy file at: ${outputPath} (CWD: ${process.cwd()})`);

    fs.writeFileSync(outputPath, alloyContent);
    console.log(`Alloy file generated successfully.`);
    return outputPath;
}

module.exports = { generateAlloyFile };
