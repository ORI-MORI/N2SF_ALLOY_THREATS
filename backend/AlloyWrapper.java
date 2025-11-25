import edu.mit.csail.sdg.alloy4.A4Reporter;
import edu.mit.csail.sdg.alloy4compiler.ast.Command;
import edu.mit.csail.sdg.alloy4compiler.ast.Module;
import edu.mit.csail.sdg.alloy4compiler.parser.CompUtil;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Options;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Solution;
import edu.mit.csail.sdg.alloy4compiler.translator.TranslateAlloyToKodkod;

public class AlloyWrapper {
    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.out.println("Usage: java AlloyWrapper <filename>");
            System.exit(1);
        }
        String filename = args[0];
        A4Reporter rep = new A4Reporter();

        try {
            Module world = CompUtil.parseEverything_fromFile(rep, null, filename);
            A4Options options = new A4Options();
            options.solver = A4Options.SatSolver.SAT4J;

            for (Command command : world.getAllCommands()) {
                // Execute the command
                A4Solution ans = TranslateAlloyToKodkod.execute_command(rep, world.getAllReachableSigs(), command,
                        options);

                // For 'check' commands, satisfiable means a counterexample (violation) was
                // found.
                if (command.check) {
                    if (ans.satisfiable()) {
                        System.out.println("VIOLATION_FOUND: " + command.label);
                        try {
                            String xmlPath = new java.io.File("output.xml").getAbsolutePath();
                            System.out.println("WRITING_XML_TO: " + xmlPath);
                            ans.writeXML("output.xml");
                            System.out.println("XML_WRITE_SUCCESS");
                        } catch (Exception e) {
                            System.out.println("XML_WRITE_FAILED: " + e.getMessage());
                            e.printStackTrace();
                        }
                    } else {
                        System.out.println("NO_VIOLATION: " + command.label);
                    }
                } else {
                    // For 'run' commands
                    if (ans.satisfiable()) {
                        System.out.println("INSTANCE_FOUND: " + command.label);
                        ans.writeXML("output.xml");
                    } else {
                        System.out.println("NO_INSTANCE: " + command.label);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
