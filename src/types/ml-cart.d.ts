declare module "ml-cart" {
  interface CartDistribution {
    getRow(row: number): number[];
  }

  export interface CartNode {
    left?: CartNode;
    right?: CartNode;
    splitColumn?: number;
    splitValue?: number;
    gain?: number;
    distribution?: CartDistribution | number;
  }

  export class DecisionTreeClassifier {
    constructor(options?: { maxDepth?: number });
    train(trainingSet: number[][], trainingLabels: number[]): void;
    predict(rows: number[][]): number[];
    root: CartNode;
  }

  export class DecisionTreeRegression {
    constructor(options?: { maxDepth?: number });
    train(trainingSet: number[][], trainingValues: number[]): void;
    predict(rows: number[][]): number[];
    root: CartNode;
  }
}
