const fse = require("fs-extra");
const path = require("path");

try {
  const topDir = __dirname;
  const tinymceDir = path.join(topDir, "public", "tinymce");
  const nodeModulesTinymce = path.join(topDir, "node_modules", "tinymce");

  // Check if source exists before copying
  if (fse.existsSync(nodeModulesTinymce)) {
    fse.ensureDirSync(path.join(topDir, "public"));
    fse.emptyDirSync(tinymceDir);
    fse.copySync(nodeModulesTinymce, tinymceDir, { overwrite: true });
    console.log("TinyMCE files copied successfully");
  } else {
    console.warn("TinyMCE source directory not found, skipping copy");
  }
} catch (error) {
  console.error("Error in postinstall script:", error);
  // Don't fail the build if this fails
}
