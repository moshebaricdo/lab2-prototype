import type { ChatMessage } from "../../../../types/chat";
import type { FileItem } from "../../../../types/file";
import mainPy from "./files/main.py?raw";

export const pythonFileStructure: FileItem[] = [
  {
    name: "main.py",
    type: "python",
    content: mainPy,
  },
];

export const pythonInitialChatMessages: ChatMessage[] = [];

export const SAMPLE_PYTHON_OUTPUT = `What is your name? Ada
Hello, Ada!`;

export const SAMPLE_PYTHON_ERROR_OUTPUT = `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print(undefined_var)
NameError: name 'undefined_var' is not defined`;
