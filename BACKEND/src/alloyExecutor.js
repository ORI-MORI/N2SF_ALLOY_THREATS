const { exec } = require('child_process');
const path = require('path');

function executeAlloy(filePath) {
    return new Promise((resolve, reject) => {
        const alloyJarPath = path.join(__dirname, '../alloy/alloy4.2_2015-02-22.jar');
        const runnerPath = path.join(__dirname, 'AlloyRunner.java');
        const srcDir = __dirname;

        // Compile
        const compileCmd = `javac -cp "${alloyJarPath}" "${runnerPath}"`;

        exec(compileCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Compilation error: ${error}`);
                return reject(error);
            }

            // Run
            const runCmd = `java -cp "${srcDir};${alloyJarPath}" AlloyRunner "${filePath}"`;
            exec(runCmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Execution error: ${error}`);
                    return reject(error);
                }

                const violations = parseOutput(stdout);
                resolve(violations);
            });
        });
    });
}

function parseOutput(output) {
    const violations = [];
    const lines = output.split('\n');
    let currentViolation = null;
    let capturing = false;

    lines.forEach(line => {
        if (line.includes('### VIOLATION FOUND ###')) {
            currentViolation = { rule: '', details: '' };
        } else if (line.includes('Command: ')) {
            if (currentViolation) currentViolation.rule = line.split('Command: ')[1].trim();
        } else if (line.includes('--- Counterexample ---')) {
            capturing = true;
        } else if (line.includes('### END VIOLATION ###')) {
            capturing = false;
            if (currentViolation) violations.push(currentViolation);
            currentViolation = null;
        } else if (capturing && currentViolation) {
            currentViolation.details += line + '\n';
        }
    });

    return violations;
}

module.exports = { executeAlloy };
