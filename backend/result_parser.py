import xml.etree.ElementTree as ET

class ResultParser:
    def parse(self, xml_output):
        """
        Parses the Alloy XML output to identify violations.
        Returns a list of violations (e.g., [{"flow": "Flow_1", "threat": "TH_M2_21"}]).
        """
        violations = []
        
        if not xml_output or "<error>" in xml_output:
            return [{"error": "Invalid XML output or execution error"}]

        try:
            root = ET.fromstring(xml_output)
            
            # We look for the 'has_threat' field
            # Structure: <field label="has_threat"> <tuple> <atom label="Flow_X"/> <atom label="Threat_Y"/> </tuple> </field>
            
            has_threat_field = None
            for field in root.findall(".//field"):
                if field.get("label") == "has_threat":
                    has_threat_field = field
                    break
            
            if has_threat_field is not None:
                for tuple_item in has_threat_field.findall("tuple"):
                    atoms = tuple_item.findall("atom")
                    if len(atoms) >= 2:
                        flow_label = atoms[0].get("label")
                        threat_label = atoms[1].get("label")
                        
                        # Clean up labels (remove $0 suffix if present)
                        flow_clean = flow_label.split('$')[0]
                        threat_clean = threat_label.split('$')[0]
                        
                        violations.append({
                            "flow": flow_clean,
                            "threat": threat_clean,
                            "description": f"Flow {flow_clean} has unmitigated threat {threat_clean}"
                        })
            
            # If no violations found in XML but XML exists, it might mean no threats detected
            # But if it was a 'check' command and we got XML, it usually means counterexample found.
            # If 'has_threat' is empty in the counterexample, then maybe something else failed?
            # But based on our logic, threats are the main cause.
            
        except ET.ParseError as e:
            return [{"error": f"XML Parse Error: {str(e)}"}]
            
        return violations
