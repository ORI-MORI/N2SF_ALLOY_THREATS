const { generateAlloyFile } = require('./src/alloyGenerator');
const fs = require('fs');

const testJson = {
    "locations": [
        { "id": "Safe_Zone", "grade": "Sensitive", "type": "Intranet" }
    ],
    "data": [
        { "id": "Secret_File", "grade": "Sensitive", "fileType": "Document" }
    ],
    "systems": [
        {
            "id": "Test_Mobile",
            "grade": "Sensitive",
            "location": "Safe_Zone",
            "type": "Mobile",        // Enum 변환 확인
            "isolation": "VDI",      // 신규 속성 확인
            "authType": "MFA",
            "isCDS": false,
            "isRegistered": true,
            "hasMDM": false,         // Boolean 'False' 변환 확인
            "isStorageEncrypted": false,
            "isManagement": true,
            "stores": []             // 빈 배열 -> 'none' 변환 확인
        }
    ],
    "connections": [
        {
            "id": "Test_Link",
            "from": "Test_Mobile",
            "to": "Test_Mobile",     // Self-loop (테스트용)
            "carries": ["Secret_File"],
            "protocol": "HTTP",      // 'ClearText' 매핑 확인
            "isEncrypted": false,
            "hasCDR": true,
            "hasDLP": false,
            "hasAntiVirus": true
        }
    ]
};

try {
    const outputPath = generateAlloyFile(testJson);
    const content = fs.readFileSync(outputPath, 'utf8');
    console.log(content);
} catch (err) {
    console.error(err);
}
