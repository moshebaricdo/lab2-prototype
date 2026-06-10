import { getRootFolderName } from "../../hooks/useFileWorkspaceState";
import type { BackpackItem } from "../../types/backpack";
import type { FileItem } from "../../types/file";
import { findFileByNameInTree } from "../../utils/fileTree";

function addToProjectRoot(tree: FileItem[], newFile: FileItem, rootName: string): FileItem[] {
  const rootExists = tree.some(
    (node) => node.type === "folder" && node.name === rootName,
  );
  if (!rootExists) {
    const alreadyExists = tree.some((node) => node.name === newFile.name);
    return alreadyExists ? tree : [...tree, newFile];
  }

  return tree.map((node) => {
    if (node.type === "folder" && node.name === rootName && node.children) {
      const alreadyExists = node.children.some((child) => child.name === newFile.name);
      if (alreadyExists) return node;
      return { ...node, children: [...node.children, newFile] };
    }
    return node;
  });
}

export function importBackpackItemToTree(
  tree: FileItem[],
  item: BackpackItem,
): { tree: FileItem[]; file: FileItem } | string {
  if (findFileByNameInTree(tree, item.name)) {
    return `A file named ${item.name} already exists in this project.`;
  }

  const file: FileItem = {
    name: item.name,
    type: item.fileKind,
    content: item.content,
  };

  return {
    tree: addToProjectRoot(tree, file, getRootFolderName(tree)),
    file,
  };
}
