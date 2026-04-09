import type { FileItem } from "../../types/file";
import type { ChatMessage } from "../../types/chat";

export const pythonFileStructure: FileItem[] = [
  {
    name: "main.py",
    type: "html",
    content: 'print("Hello world!")',
  },
];

export const pythonInitialChatMessages: ChatMessage[] = [];

export const SAMPLE_PYTHON_OUTPUT = `Hello world!`;

export const SAMPLE_PYTHON_ERROR_OUTPUT = `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print(undefined_var)
NameError: name 'undefined_var' is not defined`;
