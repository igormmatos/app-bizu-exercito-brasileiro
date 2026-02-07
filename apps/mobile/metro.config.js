const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, "../..");
const projectNodeModules = path.resolve(__dirname, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

// Keep a single React instance in this workspace app to avoid duplicate-hook runtime errors.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  react: path.resolve(projectNodeModules, "react"),
  "react-dom": path.resolve(projectNodeModules, "react-dom"),
  "react-native": path.resolve(projectNodeModules, "react-native"),
  // Shared package is consumed from source (no build step), so point Metro to workspace source.
  "@bizu/shared": path.resolve(workspaceRoot, "packages/shared/src/index.ts"),
};
config.resolver.nodeModulesPaths = [projectNodeModules, workspaceNodeModules];
config.resolver.disableHierarchicalLookup = true;
if (!config.resolver.assetExts.includes("txt")) {
  config.resolver.assetExts.push("txt");
}
config.watchFolders = [workspaceRoot];

module.exports = config;
