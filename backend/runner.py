import subprocess
import os

class AlloyRunner:
    def __init__(self, jar_path):
        self.jar_path = jar_path
        # Assuming AlloyWrapper is compiled and in the same directory as this script (backend)
        self.wrapper_class_path = os.path.dirname(os.path.abspath(__file__))

    def run(self, alloy_file_path):
        """
        Runs the Alloy Analyzer via the Java wrapper and returns the XML output.
        """
        # Command: java -cp .;../alloy/alloy.jar AlloyWrapper <file>
        # Note: On Windows use ';' for classpath separator, on Linux ':'
        classpath = f"{self.wrapper_class_path};{self.jar_path}"
        
        cmd = ["java", "-cp", classpath, "AlloyWrapper", alloy_file_path]
        
        try:
            # Run the command
            process = subprocess.run(cmd, capture_output=True, text=True, cwd=self.wrapper_class_path)
            
            if process.returncode != 0:
                raise Exception(f"Alloy execution failed: {process.stderr}")
            
            stdout = process.stdout
            print("Alloy Output:", stdout) # Debugging
            
            # Check if XML was generated
            # The wrapper writes to 'output.xml' in the CWD (backend)
            output_xml_path = os.path.join(self.wrapper_class_path, "output.xml")
            
            if os.path.exists(output_xml_path):
                with open(output_xml_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                return f"<error>No XML output generated. Stdout: {stdout}</error>"

        except Exception as e:
            return f"<error>{str(e)}</error>"
