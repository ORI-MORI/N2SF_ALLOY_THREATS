import re

class OTDParser:
    def parse(self, json_data):
        """
        Parses OTD JSON data into an intermediate representation for Alloy generation.
        """
        model = {
            "assets": [],
            "flows": [],
            "data": []
        }
        
        # We assume the first diagram is the one to process
        if not json_data.get("detail") or not json_data["detail"].get("diagrams"):
            return model
            
        diagram = json_data["detail"]["diagrams"][0]
        cells = diagram.get("diagramJson", {}).get("cells", [])
        
        # Helper to sanitize IDs for Alloy (remove hyphens, start with char)
        def sanitize_id(uuid):
            return "Obj_" + uuid.replace("-", "_")

        # Helper to parse tags from description
        # Tags format: [Key: Value]
        def parse_tags(text):
            tags = {}
            if not text:
                return tags
            matches = re.findall(r'\[(\w+):\s*(\w+)\]', text)
            for key, val in matches:
                tags[key.lower()] = val
            return tags

        # 1. First Pass: Identify Assets and Data
        asset_map = {} # uuid -> sanitized_id
        
        for cell in cells:
            c_type = cell.get("type")
            c_id = cell.get("id")
            sanitized_id = sanitize_id(c_id)
            
            # Assets
            if c_type in ["tm.Store", "tm.Process", "tm.Actor"]:
                asset_map[c_id] = sanitized_id
                
                # Extract properties
                desc = ""
                # OTD stores description in 'threats' sometimes or just 'attrs' text? 
                # Actually OTD 'props' are not easily accessible in standard JSON export unless in 'threats' or custom fields.
                # But for this demo, let's assume we look at the 'description' field if it exists at top level of cell (rare)
                # OR we look at the 'text' label.
                # Let's look at 'attrs.text.text' for the Name, and maybe we append tags there?
                # Or we can check if there's a 'description' field in the cell root (OTD 2.0 adds some).
                # Fallback: Look for tags in the 'name' (text.text).
                
                name_text = cell.get("attrs", {}).get("text", {}).get("text", "")
                tags = parse_tags(name_text)
                
                # Defaults
                level = tags.get("level", "Open") # Open, Sensitive, Classified
                zone = tags.get("zone", "Internal") # Internal, External, DMZ
                status = tags.get("status", "Secure") # Secure, Compromised
                is_reg = tags.get("reg", "True")
                has_agent = tags.get("agent", "True")
                asset_type = tags.get("type", "Asset") # Asset, Relay, SecurityGW
                
                asset = {
                    "id": sanitized_id,
                    "name": name_text.split('[')[0].strip().replace("\n", "_").replace(" ", "_"),
                    "type": asset_type,
                    "level": level,
                    "zone": zone,
                    "status": status,
                    "is_registered": is_reg,
                    "has_agent": has_agent
                }
                model["assets"].append(asset)

        # 2. Second Pass: Identify Flows and Data
        for cell in cells:
            c_type = cell.get("type")
            
            if c_type == "tm.Flow":
                source_id = cell.get("source", {}).get("id")
                target_id = cell.get("target", {}).get("id")
                
                if source_id in asset_map and target_id in asset_map:
                    flow_id = sanitize_id(cell.get("id"))
                    
                    # Data extraction from labels
                    labels = cell.get("labels", [])
                    label_text = ""
                    if labels:
                        label_text = labels[0].get("attrs", {}).get("text", {}).get("text", "UnknownData")
                    
                    tags = parse_tags(label_text)
                    
                    # Data Object
                    data_name = label_text.split('[')[0].strip().replace("\n", "_").replace(" ", "_") + "_Data"
                    data_id = "Data_" + flow_id # Unique data per flow for simplicity, or dedup based on name
                    
                    data_class = tags.get("class", "Open")
                    data_content = tags.get("content", "Clean")
                    is_sanitized = tags.get("sanitized", "True")
                    
                    data_obj = {
                        "id": data_id,
                        "name": data_name,
                        "classification": data_class,
                        "content": data_content,
                        "is_sanitized": is_sanitized
                    }
                    model["data"].append(data_obj)
                    
                    # Flow Object
                    is_encrypted = cell.get("isEncrypted", False)
                    # Override with tag if present
                    if "enc" in tags:
                        is_encrypted = (tags["enc"].lower() == "true")
                        
                    flow = {
                        "id": flow_id,
                        "from": asset_map[source_id],
                        "to": asset_map[target_id],
                        "data": data_id,
                        "is_encrypted": "True" if is_encrypted else "False"
                    }
                    model["flows"].append(flow)
        
        return model
