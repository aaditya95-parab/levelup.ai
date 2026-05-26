const fs = require("fs");
const path = require("path");

const lockfiles = ["package-lock.json", "yarn.lock"];

for (const lockfile of lockfiles) {
  const fullPath = path.join(process.cwd(), lockfile);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

const userAgent = process.env.npm_config_user_agent || "";
if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
