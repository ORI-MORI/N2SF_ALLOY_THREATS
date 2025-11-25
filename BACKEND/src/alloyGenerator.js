const fs = require('fs');
const path = require('path');

async function generateAlloyFile(diagramData) {
    const templatePath = path.join(__dirname, '../alloy/Org_Instance_Template.als');
    const outputPath = path.join(__dirname, '../alloy/Org_Instance.als');

    let template = fs.readFileSync(templatePath, 'utf8');

    // Fix Catalog Import if needed
    template = template.replace('open N2SF_ModelX_Catalog', 'open N2SF_Model2_Catalog');

    let assets = '';
    let data = '';
    let flows = '';

    const nodes = [];
    const edges = [];

    if (diagramData.cells) {
        diagramData.cells.forEach(cell => {
            if (cell.shape === 'process' || cell.shape === 'store' || cell.shape === 'actor') {
                nodes.push(cell);
            } else if (cell.shape === 'flow') {
                edges.push(cell);
            }
        });
    }

    // Generate Assets
    nodes.forEach(node => {
        const name = cleanName(node.attrs && node.attrs.text && node.attrs.text.text ? node.attrs.text.text : (node.label || node.id));
        const props = node.data || {};

        // Map properties
        const level = props.privilegeLevel ? mapLevel(props.privilegeLevel) : 'Open';
        const zone = 'Internal'; // Default
        const status = 'Secure'; // Default
        const isRegistered = 'True'; // Default
        const hasAgent = 'True'; // Default

        assets += `// Asset: ${name}\n`;
        assets += `one sig ${name} extends Asset {}\n`;
        assets += `fact {\n`;
        assets += `    ${name}.level = ${level}\n`;
        assets += `    ${name}.zone = ${zone}\n`;
        assets += `    ${name}.status = ${status}\n`;
        assets += `    ${name}.is_registered = ${isRegistered}\n`;
        assets += `    ${name}.has_agent = ${hasAgent}\n`;
        assets += `}\n\n`;
    });

    // Generate Flows and Data
    edges.forEach((edge, index) => {
        const sourceId = edge.source.cell;
        const targetId = edge.target.cell;
        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);

        if (sourceNode && targetNode) {
            const sourceName = cleanName(sourceNode.attrs && sourceNode.attrs.text && sourceNode.attrs.text.text ? sourceNode.attrs.text.text : (sourceNode.label || sourceNode.id));
            const targetName = cleanName(targetNode.attrs && targetNode.attrs.text && targetNode.attrs.text.text ? targetNode.attrs.text.text : (targetNode.label || targetNode.id));
            const flowName = `Flow_${index}`;
            const dataName = `Data_${index}`;
            const props = edge.data || {};

            // Data Generation
            const classification = 'Open'; // Default
            const content = 'Clean'; // Default
            const isSanitized = 'True'; // Default

            data += `// Data for Flow_${index}\n`;
            data += `one sig ${dataName} extends Data {}\n`;
            data += `fact {\n`;
            data += `    ${dataName}.classification = ${classification}\n`;
            data += `    ${dataName}.content = ${content}\n`;
            data += `    ${dataName}.is_sanitized = ${isSanitized}\n`;
            data += `}\n\n`;

            // Flow Generation
            const isEncrypted = props.isEncrypted ? 'True' : 'False';

            flows += `// Flow from ${sourceName} to ${targetName}\n`;
            flows += `one sig ${flowName} extends Flow {}\n`;
            flows += `fact {\n`;
            flows += `    ${flowName}.from = ${sourceName}\n`;
            flows += `    ${flowName}.to = ${targetName}\n`;
            flows += `    ${flowName}.data = ${dataName}\n`;
            flows += `    ${flowName}.via = none\n`;
            flows += `    ${flowName}.is_encrypted = ${isEncrypted}\n`;
            flows += `}\n\n`;
        }
    });

    // Replace placeholders
    let content = template.replace('// ASSETS_HERE', assets)
        .replace('// DATA_HERE', data)
        .replace('// FLOWS_HERE', flows);

    fs.writeFileSync(outputPath, content);
    return outputPath;
}

function cleanName(name) {
    if (!name) return 'Unknown';
    let cleaned = name.replace(/[^a-zA-Z0-9]/g, '_');
    if (!/^[a-zA-Z]/.test(cleaned)) {
        cleaned = 'N' + cleaned;
    }
    return cleaned;
}

function mapLevel(level) {
    // Simple mapping logic
    const l = level.toLowerCase();
    if (l.includes('high') || l.includes('confidential') || l.includes('secret')) return 'Classified';
    if (l.includes('medium') || l.includes('sensitive')) return 'Sensitive';
    return 'Open';
}

module.exports = { generateAlloyFile };
