import type { ChatAttachment } from "../../../../../types/chat";
import type { FileItem } from "../../../../../types/file";
import type { DevPanelUploadedFile } from "../../../dev/types";
import {
  findFileEntryInTree,
  NON_ROOT_WRAPPER_FOLDERS,
  TUTOR_STAGED_UPLOADS_FOLDER,
} from "../../../../ide/weblab2/webLab2FileTree";
import { normalizeFileLookupPath, pathBasename } from "../../../../../utils/fileTree";
import { isAddableUploadAttachment } from "./uploadIntentClassifier";

export { TUTOR_STAGED_UPLOADS_FOLDER };

function inferUploadFileKind(fileName: string): FileItem["type"] {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "html" || extension === "htm") return "html";
  if (extension === "css") return "css";
  if (["bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp"].includes(extension)) {
    return "image";
  }
  if (extension === "txt" || extension === "md" || extension === "csv") return "text";
  return "file";
}

function getProjectRoot(tree: FileItem[]) {
  const root =
    tree.length === 1 &&
    tree[0].type === "folder" &&
    !NON_ROOT_WRAPPER_FOLDERS.has(tree[0].name)
      ? tree[0]
      : null;
  return {
    root,
    siblings: root?.children ?? tree,
    rootName: root?.name ?? "",
  };
}

function deleteFileAtTreePath(
  tree: FileItem[],
  targetPath: string,
  parentPath = "",
): { tree: FileItem[]; deleted: boolean } {
  let deleted = false;
  const nextTree = tree.flatMap((item) => {
    const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (itemPath === targetPath && item.type !== "folder") {
      deleted = true;
      return [];
    }
    if (item.children) {
      const result = deleteFileAtTreePath(item.children, targetPath, itemPath);
      if (result.deleted) {
        deleted = true;
        return [{ ...item, children: result.tree }];
      }
    }
    return [item];
  });

  return { tree: nextTree, deleted };
}

export function getStagedUploadProjectPath(attachment: ChatAttachment) {
  const normalizedAttachmentPath = normalizeFileLookupPath(attachment.path);
  if (normalizedAttachmentPath.startsWith(`${TUTOR_STAGED_UPLOADS_FOLDER}/`)) {
    return normalizedAttachmentPath;
  }
  return `${TUTOR_STAGED_UPLOADS_FOLDER}/${attachment.fileName}`;
}

export function getRootUploadProjectPath(attachment: ChatAttachment) {
  return pathBasename(normalizeFileLookupPath(attachment.path));
}

export function getProjectFileNames(tree: FileItem[]): Set<string> {
  const names = new Set<string>();

  const visit = (items: FileItem[], parentPath = "") => {
    for (const item of items) {
      const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      if (item.children) {
        visit(item.children, itemPath);
        continue;
      }
      names.add(item.name);
      names.add(itemPath);
    }
  };

  visit(tree);
  return names;
}

export function isStagedTutorUploadInProject(
  tree: FileItem[],
  attachment: ChatAttachment,
) {
  return findFileEntryInTree(tree, getStagedUploadProjectPath(attachment)) !== null;
}

export function isRootTutorUploadInProject(
  tree: FileItem[],
  attachment: ChatAttachment,
) {
  return findFileEntryInTree(tree, getRootUploadProjectPath(attachment)) !== null;
}

export function getChatAttachmentProjectContent(attachment: ChatAttachment): string | null {
  if (!isAddableUploadAttachment(attachment)) return null;

  if (attachment.imageDataUrl ?? attachment.imageSrc) {
    return attachment.imageDataUrl ?? attachment.imageSrc ?? null;
  }

  return attachment.content?.trim() ? attachment.content : null;
}

export function canStageTutorUploadInProject(
  attachment: ChatAttachment,
  tree: FileItem[],
): true | string {
  if (attachment.source !== "upload") {
    return "Only composer uploads can be staged in the project.";
  }

  if (!isAddableUploadAttachment(attachment)) {
    return "This upload cannot be added to the project.";
  }

  if (isStagedTutorUploadInProject(tree, attachment)) {
    return true;
  }

  if (!getChatAttachmentProjectContent(attachment)) {
    return "This upload does not include usable file content.";
  }

  const uploadsEntry = findFileEntryInTree(tree, getStagedUploadProjectPath(attachment));
  if (uploadsEntry) {
    return true;
  }

  const { siblings } = getProjectRoot(tree);
  const uploadsFolder = siblings.find(
    (item) => item.type === "folder" && item.name === TUTOR_STAGED_UPLOADS_FOLDER,
  );
  if (uploadsFolder?.children?.some((child) => child.name === attachment.fileName)) {
    return `A file named ${attachment.fileName} already exists in ${TUTOR_STAGED_UPLOADS_FOLDER}/.`;
  }

  return true;
}

export function canAddTutorUploadToProjectRoot(
  attachment: ChatAttachment,
  tree: FileItem[],
): true | string {
  if (attachment.source !== "upload") {
    return "Only composer uploads can be added to the project.";
  }

  if (!isAddableUploadAttachment(attachment)) {
    return "This upload cannot be added to the project.";
  }

  if (isRootTutorUploadInProject(tree, attachment)) {
    return true;
  }

  if (!getChatAttachmentProjectContent(attachment)) {
    return "This upload does not include usable file content.";
  }

  const { siblings } = getProjectRoot(tree);
  const projectPath = getRootUploadProjectPath(attachment);
  if (siblings.some((item) => item.name === projectPath)) {
    return `A file named ${projectPath} already exists in the project.`;
  }

  return true;
}

export function chatAttachmentToUploadedFile(attachment: ChatAttachment): DevPanelUploadedFile | null {
  const content = getChatAttachmentProjectContent(attachment);
  if (!content) return null;

  return {
    name: pathBasename(getStagedUploadProjectPath(attachment)),
    path: getStagedUploadProjectPath(attachment),
    type: attachment.mimeType ?? "",
    size: attachment.sizeBytes ?? content.length,
    content,
  };
}

export function chatAttachmentToRootUploadedFile(attachment: ChatAttachment): DevPanelUploadedFile | null {
  const content = getChatAttachmentProjectContent(attachment);
  if (!content) return null;

  const name = getRootUploadProjectPath(attachment);
  return {
    name,
    path: name,
    type: attachment.mimeType ?? "",
    size: attachment.sizeBytes ?? content.length,
    content,
  };
}

function ensureUploadsFolderChildren(siblings: FileItem[]) {
  const uploadsIndex = siblings.findIndex(
    (item) => item.type === "folder" && item.name === TUTOR_STAGED_UPLOADS_FOLDER,
  );

  if (uploadsIndex === -1) {
    return [
      ...siblings,
      { name: TUTOR_STAGED_UPLOADS_FOLDER, type: "folder" as const, children: [] },
    ];
  }

  return siblings;
}

function addFileToUploadsFolder(siblings: FileItem[], file: FileItem): FileItem[] {
  const withUploadsFolder = ensureUploadsFolderChildren(siblings);
  return withUploadsFolder.map((item) => {
    if (item.type !== "folder" || item.name !== TUTOR_STAGED_UPLOADS_FOLDER) {
      return item;
    }

    const children = item.children ?? [];
    if (children.some((child) => child.name === file.name)) {
      throw new Error(`A file named ${file.name} already exists in ${TUTOR_STAGED_UPLOADS_FOLDER}/.`);
    }

    return {
      ...item,
      children: [...children, file],
    };
  });
}

export function buildFileTreeWithChatAttachments(
  tree: FileItem[],
  attachments: ChatAttachment[],
): FileItem[] {
  return attachments.reduce((currentTree, attachment) => {
    const uploaded = chatAttachmentToUploadedFile(attachment);
    if (!uploaded) {
      throw new Error(`Unable to stage ${attachment.fileName} in the project.`);
    }

    const newFile: FileItem = {
      name: uploaded.name,
      type: inferUploadFileKind(uploaded.name),
      content: uploaded.content,
    };

    const { root, siblings, rootName } = getProjectRoot(currentTree);
    const nextSiblings = addFileToUploadsFolder(siblings, newFile);

    if (root) {
      return [{ ...root, children: nextSiblings }];
    }

    if (rootName) {
      return nextSiblings;
    }

    return nextSiblings;
  }, tree);
}

export function buildFileTreeWithRootChatAttachments(
  tree: FileItem[],
  attachments: ChatAttachment[],
): FileItem[] {
  return attachments.reduce((currentTree, attachment) => {
    const uploaded = chatAttachmentToRootUploadedFile(attachment);
    if (!uploaded) {
      throw new Error(`Unable to add ${attachment.fileName} to the project.`);
    }

    const newFile: FileItem = {
      name: uploaded.name,
      type: inferUploadFileKind(uploaded.name),
      content: uploaded.content,
    };

    const { root, siblings } = getProjectRoot(currentTree);
    if (siblings.some((item) => item.name === newFile.name)) {
      throw new Error(`A file named ${newFile.name} already exists in the project.`);
    }

    const nextSiblings = [...siblings, newFile];
    return root ? [{ ...root, children: nextSiblings }] : nextSiblings;
  }, tree);
}

export function removeStagedTutorUploadFromTree(
  tree: FileItem[],
  attachment: ChatAttachment,
): FileItem[] {
  const entry = findFileEntryInTree(tree, getStagedUploadProjectPath(attachment));
  if (!entry) return tree;

  const { rootName } = getProjectRoot(tree);
  const fullPath = rootName ? `${rootName}/${entry.path}` : entry.path;
  return deleteFileAtTreePath(tree, fullPath).tree;
}

/** @deprecated Use canStageTutorUploadInProject */
export function canAddChatAttachmentToProject(
  attachment: ChatAttachment,
  existingProjectFileNames: Set<string>,
): true | string {
  void existingProjectFileNames;
  if (attachment.source === "project") {
    return "That file is already part of your project.";
  }
  if (!isAddableUploadAttachment(attachment)) {
    return "This upload cannot be added to the project.";
  }
  return true;
}
