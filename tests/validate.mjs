import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const required = ["index.html", "styles.css", "script.js", "README.md"];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");

const checks = [
  [html.includes("SomniTune"), "Project title missing"],
  [html.includes('id="prototype"'), "Prototype section missing"],
  [html.includes("content_impression"), "Event framework missing"],
  [html.includes("不提供医疗诊断或治疗"), "Safety boundary missing"],
  [html.includes('href="styles.css"'), "Stylesheet link missing"],
  [html.includes('src="script.js"'), "Script link missing"],
  [css.includes("@media (max-width: 700px)"), "Mobile breakpoint missing"],
  [css.includes("prefers-reduced-motion"), "Reduced-motion support missing"],
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(message);
}

new vm.Script(js, { filename: "script.js" });

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) throw new Error(`Duplicate IDs: ${[...new Set(duplicates)].join(", ")}`);

console.log(`Validated ${required.length} files, ${ids.length} unique IDs and JavaScript syntax.`);
