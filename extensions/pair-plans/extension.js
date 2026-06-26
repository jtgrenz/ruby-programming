const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

const PLANS_DIR = ".pair-plans";

/** Build a sorted list of child nodes for a directory: dirs first, then files. */
function readDirNodes(dirPath) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const dirs = [];
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue; // skip dotfiles inside the plans folder
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      dirs.push({ uri: vscode.Uri.file(fullPath), type: "dir", label: entry.name });
    } else if (entry.isFile()) {
      files.push({ uri: vscode.Uri.file(fullPath), type: "file", label: entry.name });
    }
  }

  const byName = (a, b) =>
    path.basename(a.uri.fsPath).localeCompare(path.basename(b.uri.fsPath), undefined, {
      sensitivity: "base",
      numeric: true,
    });
  dirs.sort(byName);
  files.sort(byName);
  return [...dirs, ...files];
}

class PairPlansProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(node) {
    const collapsible =
      node.type === "dir"
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;
    const item = new vscode.TreeItem(node.label, collapsible);
    item.resourceUri = node.uri;
    if (node.type === "file") {
      item.command = {
        command: "vscode.open",
        title: "Open",
        arguments: [node.uri],
      };
    }
    return item;
  }

  getChildren(element) {
    if (element) {
      if (element.type !== "dir") {
        return [];
      }
      return readDirNodes(element.uri.fsPath);
    }

    // Root: find .pair-plans in each open workspace folder.
    const folders = vscode.workspace.workspaceFolders || [];
    const roots = [];
    for (const folder of folders) {
      const plansPath = path.join(folder.uri.fsPath, PLANS_DIR);
      try {
        if (fs.statSync(plansPath).isDirectory()) {
          roots.push({ folderName: folder.name, plansPath });
        }
      } catch {
        // no .pair-plans in this root
      }
    }

    if (roots.length === 0) {
      return []; // triggers viewsWelcome message
    }
    if (roots.length === 1) {
      return readDirNodes(roots[0].plansPath); // inline contents, no extra click
    }
    // Multi-root: one node per workspace folder that has a .pair-plans.
    return roots.map((root) => ({
      uri: vscode.Uri.file(root.plansPath),
      type: "dir",
      label: root.folderName,
    }));
  }
}

function activate(context) {
  const provider = new PairPlansProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("pairPlansView", provider)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("pairPlans.refresh", () => provider.refresh())
  );

  const watcher = vscode.workspace.createFileSystemWatcher("**/.pair-plans/**");
  watcher.onDidCreate(() => provider.refresh());
  watcher.onDidDelete(() => provider.refresh());
  watcher.onDidChange(() => provider.refresh());
  context.subscriptions.push(watcher);
}

function deactivate() {}

module.exports = { activate, deactivate };
