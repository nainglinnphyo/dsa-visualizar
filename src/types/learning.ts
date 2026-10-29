export interface ComplexityInfo {
  best?: string;
  average?: string;
  worst?: string;
  space: string;
  stable?: boolean;
  inPlace?: boolean;
}

export interface LearningContent {
  /** One paragraph: what the algorithm does. */
  what: string;
  /** Ordered walkthrough of how it works. */
  how: string[];
  useCases: string[];
  pros: string[];
  cons: string[];
  /** A small exercise the reader can try in the visualizer. */
  challenge: string;
}
