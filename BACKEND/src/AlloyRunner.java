import edu.mit.csail.sdg.alloy4.A4Reporter;
import edu.mit.csail.sdg.alloy4.Err;
import edu.mit.csail.sdg.alloy4.ErrorWarning;
import edu.mit.csail.sdg.alloy4compiler.ast.Command;
import edu.mit.csail.sdg.alloy4compiler.ast.Module;
import edu.mit.csail.sdg.alloy4compiler.parser.CompUtil;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Options;
import edu.mit.csail.sdg.alloy4compiler.translator.A4Solution;
import edu.mit.csail.sdg.alloy4compiler.translator.TranslateAlloyToKodkod;

public class AlloyRunner {
    public static void main(String[] args) {
        try {
            if (args.length < 1) {
                System.out.println("Usage: java AlloyRunner <alloy_file.als>");
                return;
            }

            String filename = args[0];
            A4Reporter rep = new A4Reporter() {
                @Override
                public void warning(ErrorWarning msg) {
                    System.out.print("Relevance Warning:\n" + (msg.toString().trim()) + "\n\n");
                    System.out.flush();
                }
            };

            Module world = CompUtil.parseEverything_fromFile(rep, null, filename);
            A4Options options = new A4Options();
            options.solver = A4Options.SatSolver.SAT4J;

            Command command = world.getAllCommands().get(0);
            A4Solution ans = TranslateAlloyToKodkod.execute_command(rep, world.getAllReachableSigs(), command, options);

            String xmlPath = filename.replace(".als", ".xml");
            ans.writeXML(xmlPath);
            System.out.println("XML generated: " + xmlPath);

        } catch (Throwable t) {
            try {
                java.io.FileWriter fw = new java.io.FileWriter("crash.log");
                java.io.PrintWriter pw = new java.io.PrintWriter(fw);
                t.printStackTrace(pw);
                pw.close();
                fw.close();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
            System.err.println("CRASH_DUMP: " + t.toString());
            t.printStackTrace();
            System.exit(1);
        }
    }
}
