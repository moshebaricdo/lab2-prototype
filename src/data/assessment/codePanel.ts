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
// Free-response: AP CS A — explain / trace output
// ---------------------------------------------------------------------------

export const mockCodePanelFreeResponse: CodePanelConfig = {
  files: [
    {
      name: "MatrixSum.java",
      language: "java",
      content: [
        "public class MatrixSum {",
        "",
        "  public static int rowTotal(int[][] matrix, int row) {",
        "    int sum = 0;",
        "    for (int col = 0; col < matrix[row].length; col++) {",
        "      sum += matrix[row][col];",
        "    }",
        "    return sum;",
        "  }",
        "",
        "  public static int largestRowTotal(int[][] matrix) {",
        "    int max = rowTotal(matrix, 0);",
        "    for (int r = 1; r < matrix.length; r++) {",
        "      int total = rowTotal(matrix, r);",
        "      if (total > max) {",
        "        max = total;",
        "      }",
        "    }",
        "    return max;",
        "  }",
        "",
        "  public static void main(String[] args) {",
        "    int[][] grid = {",
        "      { 5, 1, 3 },",
        "      { 9, 0, 2 },",
        "      { 4, 7, 6 }",
        "    };",
        "    System.out.println(largestRowTotal(grid));",
        "  }",
        "}",
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
