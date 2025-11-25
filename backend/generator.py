class AlloyGenerator:
    def __init__(self, template_path):
        self.template_path = template_path

    def generate(self, model):
        """
        Generates Alloy code by filling the template with data from the parsed model.
        """
        with open(self.template_path, 'r', encoding='utf-8') as f:
            template = f.read()
            
        # 1. Generate Assets Code
        assets_code = ""
        for asset in model["assets"]:
            assets_code += f"""
one sig {asset['id']} extends {asset['type']} {{}}
fact {{
    {asset['id']}.level = {asset['level']}
    {asset['id']}.zone = {asset['zone']}
    {asset['id']}.status = {asset['status']}
    {asset['id']}.is_registered = {asset['is_registered']}
    {asset['id']}.has_agent = {asset['has_agent']}
}}
"""
        
        # 2. Generate Data Code
        data_code = ""
        for data in model["data"]:
            data_code += f"""
one sig {data['id']} extends Data {{}}
fact {{
    {data['id']}.classification = {data['classification']}
    {data['id']}.content = {data['content']}
    {data['id']}.is_sanitized = {data['is_sanitized']}
}}
"""

        # 3. Generate Flows Code
        flows_code = ""
        for flow in model["flows"]:
            flows_code += f"""
one sig {flow['id']} extends Flow {{}}
fact {{
    {flow['id']}.from = {flow['from']}
    {flow['id']}.to = {flow['to']}
    {flow['id']}.data = {flow['data']}
    {flow['id']}.via = none // Default to none for now, unless parsed
    {flow['id']}.is_encrypted = {flow['is_encrypted']}
}}
"""

        # Replace markers
        alloy_code = template.replace("// ASSETS_HERE", assets_code)
        alloy_code = alloy_code.replace("// DATA_HERE", data_code)
        alloy_code = alloy_code.replace("// FLOWS_HERE", flows_code)
        
        # Replace Model Import
        alloy_code = alloy_code.replace("open N2SF_ModelX_Catalog", "open N2SF_Model2_Catalog")
        
        return alloy_code
