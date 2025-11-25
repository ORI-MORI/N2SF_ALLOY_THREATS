from flask import Flask, request, jsonify
import os
from parser import OTDParser
from generator import AlloyGenerator
from runner import AlloyRunner
from result_parser import ResultParser

app = Flask(__name__)

# Configuration
ALLOY_DIR = os.path.abspath("../alloy")
ALLOY_JAR = os.path.join(ALLOY_DIR, "alloy4.2_2015-02-22.jar")
TEMPLATE_FILE = os.path.join(ALLOY_DIR, "Org_Instance_Template.als")
OUTPUT_FILE = os.path.join(ALLOY_DIR, "Org_Instance.als")

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # 1. Parse OTD JSON
        parser = OTDParser()
        parsed_model = parser.parse(data)

        # 2. Generate Alloy Code
        generator = AlloyGenerator(TEMPLATE_FILE)
        alloy_code = generator.generate(parsed_model)
        
        # Write to file
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(alloy_code)

        # 3. Run Alloy Analyzer
        runner = AlloyRunner(ALLOY_JAR)
        xml_output = runner.run(OUTPUT_FILE)

        # 4. Parse Results
        result_parser = ResultParser()
        violations = result_parser.parse(xml_output)

        return jsonify({
            "status": "success",
            "violations": violations,
            "alloy_code": alloy_code # For debugging
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
