export type ValidationStatus = "pass" | "fail" | "skip";

export type ValidationMatcher =
  | {
      type: "includes";
      value: string;
    }
  | {
      type: "regex";
      value: string;
      flags?: string;
    };

export interface ValidationTestDefinition {
  id: string;
  description: string;
  matcher?: ValidationMatcher;
  targetFile?: string;
}
