const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateAlloyFile } = require('./src/alloyGenerator');
const { executeAlloy } = require('./src/alloyExecutor');
const { validateCommonProperties } = require('./src/simpleValidator');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/analyze', async (req, res) => {
    try {
        const diagramData = req.body;
        console.log('Received analysis request');

        // Debug: Save payload
        try {
            fs.writeFileSync('last_request_payload.json', JSON.stringify(diagramData, null, 2));
            console.log('Saved payload to last_request_payload.json');
        } catch (e) {
            console.error('Failed to save payload:', e);
        }

        // 1. JS Validator (Fast Check) - Group B
        const jsValidation = validateCommonProperties(diagramData);
        console.log(`JS Validation found ${jsValidation.total_count} violations.`);

        // 2. Alloy Engine (Deep Check) - Group A
        const alloyFilePath = await generateAlloyFile(diagramData);
        console.log('Generated Alloy file at:', alloyFilePath);

        const executionResult = await executeAlloy(alloyFilePath);
        console.log('Alloy execution result:', executionResult);

        // 3. Merge Results (Hybrid Verification)
        if (executionResult.success) {
            const finalThreats = { ...executionResult.result.threats };
            let finalCount = executionResult.result.total_count;

            // Merge JS threats into Alloy threats
            Object.keys(jsValidation.threats).forEach(key => {
                if (jsValidation.threats[key] && jsValidation.threats[key].length > 0) {
                    if (!finalThreats[key]) finalThreats[key] = [];
                    finalThreats[key] = [...finalThreats[key], ...jsValidation.threats[key]];
                    finalCount += jsValidation.threats[key].length;
                }
            });

            const finalResult = {
                threats: finalThreats,
                total_count: finalCount
            };

            // Debug: Save merged result
            fs.writeFileSync('debug_response_hybrid.json', JSON.stringify(finalResult, null, 2));

            res.json({ success: true, result: finalResult });
        } else {
            res.status(500).json({ success: false, error: executionResult.error });
        }
    } catch (error) {
        console.error('Error during analysis:', error);
        fs.writeFileSync('last_error.txt', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        res.status(500).json({ success: false, error: error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    console.error('Server failed to start:', error);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});
