import os
import json
from parser import OTDParser
from generator import AlloyGenerator
from runner import AlloyRunner
from result_parser import ResultParser

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ALLOY_DIR = os.path.abspath(os.path.join(BASE_DIR, "../alloy"))
ALLOY_JAR = os.path.join(ALLOY_DIR, "alloy4.2_2015-02-22.jar")
TEMPLATE_FILE = os.path.join(ALLOY_DIR, "Org_Instance_Template.als")
OUTPUT_FILE = os.path.join(ALLOY_DIR, "Org_Instance.als")
JSON_FILE = os.path.abspath(os.path.join(BASE_DIR, "../threat-dragon-alloy-main/ThreatDragonModels/demo-threat-model.json"))

def test_pipeline():
    print("1. Reading JSON...")
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("2. Parsing OTD JSON...")
    parser = OTDParser()
    model = parser.parse(data)
    print(f"   Found {len(model['assets'])} assets, {len(model['flows'])} flows.")

    print("3. Generating Alloy Code...")
    generator = AlloyGenerator(TEMPLATE_FILE)
    alloy_code = generator.generate(model)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(alloy_code)
    print(f"   Wrote to {OUTPUT_FILE}")

    print("4. Running Alloy Analyzer...")
    runner = AlloyRunner(ALLOY_JAR)
    xml_output = runner.run(OUTPUT_FILE)
    
    if "<error>" in xml_output:
        print("   Alloy Execution Error:")
        print(xml_output)
        return

    print("5. Parsing Results...")
    result_parser = ResultParser()
    violations = result_parser.parse(xml_output)
    
    print("\n=== Analysis Results ===")
    for v in violations:
        print(v)

if __name__ == "__main__":
    test_pipeline()
