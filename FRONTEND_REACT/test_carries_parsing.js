import { convertGraphToJSON } from './src/utils/graphConverter.js';

const nodes = [
    {
        id: 'node-1',
        type: 'system',
        position: { x: 0, y: 0 },
        data: {
            label: 'System 1',
            type: 'Server',
            storedData: [{ id: 1, grade: 'Sensitive', fileType: 'Document' }]
        }
    },
    {
        id: 'node-2',
        type: 'system',
        position: { x: 200, y: 0 },
        data: {
            label: 'System 2',
            type: 'Terminal'
        }
    }
];

const edges = [
    {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {
            carries: '1, 2, 99' // Test input
        }
    }
];

try {
    console.log("Testing convertGraphToJSON with carries='1, 2, 99'...");
    const result = convertGraphToJSON(nodes, edges);
    console.log("Result connections:", JSON.stringify(result.connections, null, 2));
    console.log("Result data:", JSON.stringify(result.data, null, 2));

    console.log("\nTesting with empty carries...");
    edges[0].data.carries = '';
    const resultEmpty = convertGraphToJSON(nodes, edges);
    console.log("Result empty:", resultEmpty.connections[0].carries);

    console.log("\nTesting with invalid carries...");
    edges[0].data.carries = '1, a, 3';
    const resultInvalid = convertGraphToJSON(nodes, edges);
    console.log("Result invalid:", resultInvalid.connections[0].carries);

} catch (error) {
    console.log("Error during conversion:", error.stack);
}
