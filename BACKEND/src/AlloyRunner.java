import edu.mit.csail.sdg.alloy4.A4Reporter;
import edu.mit.csail.sdg.alloy4compiler.ast.Command;
import edu.mit.csail.sdg.alloy4compiler.ast.Module;
import edu.mit.csail.sdg.alloy4compiler.parser.CompUtil;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Options;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Solution;
import edu.mit.csail.sdg.alloy4compiler.translator.TranslateAlloyToKodkod;

public class AlloyRunner {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java -cp .;alloy4.2.jar AlloyRunner <als_file>");
            return;
        }

        String filename = args[0];
        // System.out.println("Running Alloy on: " + filename);

        try {
            A4Reporter rep = new A4Reporter();
            Module world = CompUtil.parseEverything_fromFile(rep, null, filename);
            A4Options options = new A4Options();
            options.solver = A4Options.SatSolver.SAT4J;

            for (Command command : world.getAllCommands()) {
                System.out.println("Executing command: " + command);
                A4Solution ans = TranslateAlloyToKodkod.execute_command(rep, world.getAllReachableSigs(), command,
                        options);

                if (ans.satisfiable()) {
                    System.out.println("### VIOLATION FOUND ###");
                    System.out.println("Command: " + command.label);
                    System.out.println("--- Counterexample ---");
                    System.out.println(ans.toString());
                    System.out.println("### END VIOLATION ###");
                } else {
                    System.out.println("RESULT: No counterexample found for " + command.label);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
