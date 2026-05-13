import type { ChatMessage } from "../../../../types/chat";
import type { FileItem } from "../../../../types/file";
import pythonInstructionsMarkdown from "./instructions.md?raw";
import mainPy from "./files/main.py?raw";
import readmeMd from "./files/README.md?raw";

export const pythonFileStructure: FileItem[] = [
  {
    name: "main.py",
    type: "python",
    content: mainPy,
  },
  {
    name: "README.md",
    type: "text",
    content: readmeMd,
  },
];

export const pythonInitialChatMessages: ChatMessage[] = [];

export { pythonInstructionsMarkdown };

export const SAMPLE_PYTHON_OUTPUT = `What is your name? Ada
Hello, Ada!
Here is a quick coding plan for today:
1. practice one Python function
2. debug one small mistake
3. explain my code out loud
You are thinking like a programmer already.`;

export const SAMPLE_PYTHON_ERROR_OUTPUT = `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print(undefined_var)
NameError: name 'undefined_var' is not defined`;
