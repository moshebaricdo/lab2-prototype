export interface CodePanelFile {
  name: string;
  language: string;
  content: string;
}

export interface CodePanelConfig {
  files: CodePanelFile[];
  /** Where the stem text appears relative to the two-column split. */
  stemPosition?: "above" | "inline";
  /** 0–1, initial width ratio for the code panel. Defaults to 0.55. */
  defaultWidthRatio?: number;
}

// ---------------------------------------------------------------------------
// Multi-choice: AP CS A — method tracing
// ---------------------------------------------------------------------------

export const mockCodePanelMultiChoice: CodePanelConfig = {
  files: [
    {
      name: "StringScramble.java",
      language: "java",
      content: [
        "public class StringScramble {",
        "",
        "  /** Scrambles word by removing every other character",
        "   *  starting from index 1. */",
        "  public static String scramble(String word) {",
        '    String result = "";',
        "    for (int i = 0; i < word.length(); i += 2) {",
        "      result += word.substring(i, i + 1);",
        "    }",
        "    return result;",
        "  }",
        "",
        "  public static void main(String[] args) {",
        '    System.out.println(scramble("compiler"));',
        '    System.out.println(scramble("Java"));',
        "  }",
        "}",
      ].join("\n"),
    },
  ],
  stemPosition: "inline",
};

// ---------------------------------------------------------------------------
// Free-response: AP CS Principles — Python trace output
// ---------------------------------------------------------------------------

export const mockCodePanelFreeResponse: CodePanelConfig = {
  files: [
    {
      name: "matrix_sum.py",
      language: "python",
      content: [
        "def row_total(matrix, row):",
        "    total = 0",
        "    for col in range(len(matrix[row])):",
        "        total += matrix[row][col]",
        "    return total",
        "",
        "",
        "def largest_row_total(matrix):",
        "    max_total = row_total(matrix, 0)",
        "    for r in range(1, len(matrix)):",
        "        current = row_total(matrix, r)",
        "        if current > max_total:",
        "            max_total = current",
        "    return max_total",
        "",
        "",
        "grid = [",
        "    [5, 1, 3],",
        "    [9, 0, 2],",
        "    [4, 7, 6],",
        "]",
        "",
        "print(largest_row_total(grid))",
      ].join("\n"),
    },
  ],
  stemPosition: "inline",
};

// ---------------------------------------------------------------------------
// Multi-choice: multi-file web project (HTML + CSS + JS)
// ---------------------------------------------------------------------------

export const mockCodePanelMultiFile: CodePanelConfig = {
  files: [
    {
      name: "index.html",
      language: "html",
      content: [
        '<!DOCTYPE html>',
        '<html lang="en">',
        "<head>",
        '  <link rel="stylesheet" href="style.css">',
        "</head>",
        "<body>",
        '  <div id="app">',
        '    <h1 class="title">Hello World</h1>',
        '    <button id="toggle">Toggle</button>',
        '    <p id="message" class="hidden">Now you see me!</p>',
        "  </div>",
        '  <script src="app.js"></script>',
        "</body>",
        "</html>",
      ].join("\n"),
    },
    {
      name: "style.css",
      language: "css",
      content: [
        ".title {",
        "  color: #1a1a2e;",
        "  font-family: sans-serif;",
        "}",
        "",
        ".hidden {",
        "  display: none;",
        "}",
        "",
        ".visible {",
        "  display: block;",
        "  color: #16213e;",
        "  font-weight: bold;",
        "}",
      ].join("\n"),
    },
    {
      name: "app.js",
      language: "javascript",
      content: [
        'const btn = document.getElementById("toggle");',
        'const msg = document.getElementById("message");',
        "",
        'btn.addEventListener("click", function () {',
        '  if (msg.classList.contains("hidden")) {',
        '    msg.classList.remove("hidden");',
        '    msg.classList.add("visible");',
        "  } else {",
        '    msg.classList.remove("visible");',
        '    msg.classList.add("hidden");',
        "  }",
        "});",
      ].join("\n"),
    },
  ],
  stemPosition: "inline",
};

// ---------------------------------------------------------------------------
// Multi-choice: editable Python — predict the output
// ---------------------------------------------------------------------------

export const mockCodePanelEditable: CodePanelConfig = {
  files: [
    {
      name: "fibonacci.py",
      language: "python",
      content: [
        "def fibonacci(n):",
        "    if n <= 0:",
        '        return "Input must be positive"',
        "    if n == 1:",
        "        return [0]",
        "    if n == 2:",
        "        return [0, 1]",
        "",
        "    seq = [0, 1]",
        "    for i in range(2, n):",
        "        seq.append(seq[i - 1] + seq[i - 2])",
        "    return seq",
        "",
        "",
        "result = fibonacci(7)",
        "print(result)",
        "print(sum(result))",
      ].join("\n"),
    },
  ],
  stemPosition: "inline",
};

// ---------------------------------------------------------------------------
// Level-group: AP CS A mini-quiz with a shared program
// ---------------------------------------------------------------------------

export const mockCodePanelLevelGroup: CodePanelConfig = {
  files: [
    {
      name: "Inventory.java",
      language: "java",
      content: [
        "import java.util.ArrayList;",
        "",
        "public class Inventory {",
        "  private ArrayList<String> items;",
        "",
        "  public Inventory() {",
        "    items = new ArrayList<String>();",
        "  }",
        "",
        "  public void addItem(String item) {",
        "    items.add(item);",
        "  }",
        "",
        "  public String removeFirst() {",
        "    return items.remove(0);",
        "  }",
        "",
        "  public boolean contains(String item) {",
        "    for (int i = 0; i < items.size(); i++) {",
        "      if (items.get(i).equals(item)) {",
        "        return true;",
        "      }",
        "    }",
        "    return false;",
        "  }",
        "",
        "  public int countItem(String item) {",
        "    int count = 0;",
        "    for (String s : items) {",
        "      if (s.equals(item)) {",
        "        count++;",
        "      }",
        "    }",
        "    return count;",
        "  }",
        "",
        "  public static void main(String[] args) {",
        '    Inventory inv = new Inventory();',
        '    inv.addItem("apple");',
        '    inv.addItem("bread");',
        '    inv.addItem("apple");',
        '    inv.addItem("milk");',
        "",
        "    System.out.println(inv.contains(\"bread\"));",
        "    System.out.println(inv.countItem(\"apple\"));",
        "    System.out.println(inv.removeFirst());",
        "    System.out.println(inv.contains(\"apple\"));",
        "  }",
        "}",
      ].join("\n"),
    },
  ],
  stemPosition: "inline",
};
