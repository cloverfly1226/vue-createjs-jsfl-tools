import fs from "fs";
import path from "path";
const outputDir = "./dist";
fs.readdirSync(outputDir).forEach(f => {
  if (f.endsWith(".js")) fs.renameSync(path.join(outputDir, f), path.join(outputDir, f.slice(0, -3) + ".jsfl"));
});
