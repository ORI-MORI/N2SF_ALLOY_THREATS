from result_parser import ResultParser
import os

def test_parser():
    xml_path = "output.xml"
    if not os.path.exists(xml_path):
        print("Error: output.xml not found")
        return

    with open(xml_path, 'r', encoding='utf-8') as f:
        xml_content = f.read()

    parser = ResultParser()
    violations = parser.parse(xml_content)
    
    print(f"Found {len(violations)} violations:")
    for v in violations:
        print(v)

if __name__ == "__main__":
    test_parser()
