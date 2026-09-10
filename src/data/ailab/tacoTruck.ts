import type { AiLabDataset } from "../../types/aiLab";

export const tacoTruckDataset: AiLabDataset = {
  id: "taco-truck",
  name: "Taco truck orders",
  description:
    "Orders from a neighborhood taco truck. Each row is one customer order.",
  defaultLabelColumn: "would_order_again",
  columns: [
    {
      id: "protein",
      name: "Protein",
      type: "categorical",
      description: "The main filling in the taco.",
    },
    {
      id: "salsa",
      name: "Salsa",
      type: "categorical",
      description: "Which salsa the customer chose.",
    },
    {
      id: "spice",
      name: "Spice level",
      type: "numerical",
      description: "How spicy the customer rated the taco, from 1 to 10.",
    },
    {
      id: "price",
      name: "Price",
      type: "numerical",
      description: "What the customer paid, in dollars.",
    },
    {
      id: "would_order_again",
      name: "Would order again",
      type: "categorical",
      description: "Whether the customer said they would order this taco again.",
    },
  ],
  rows: [
    { protein: "chicken", salsa: "mild", spice: 3, price: 8, would_order_again: "no" },
    { protein: "chicken", salsa: "hot", spice: 7, price: 7, would_order_again: "yes" },
    { protein: "beef", salsa: "mild", spice: 4, price: 9, would_order_again: "yes" },
    { protein: "beef", salsa: "hot", spice: 8, price: 10, would_order_again: "yes" },
    { protein: "beans", salsa: "mild", spice: 2, price: 6, would_order_again: "no" },
    { protein: "beans", salsa: "hot", spice: 9, price: 6, would_order_again: "yes" },
    { protein: "chicken", salsa: "none", spice: 5, price: 8, would_order_again: "no" },
    { protein: "chicken", salsa: "hot", spice: 8, price: 5, would_order_again: "yes" },
    { protein: "beef", salsa: "none", spice: 3, price: 11, would_order_again: "yes" },
    { protein: "beans", salsa: "none", spice: 1, price: 5, would_order_again: "no" },
    { protein: "chicken", salsa: "mild", spice: 6, price: 6, would_order_again: "yes" },
    { protein: "beans", salsa: "hot", spice: 4, price: 8, would_order_again: "no" },
    { protein: "beef", salsa: "hot", spice: 9, price: 8, would_order_again: "yes" },
    { protein: "chicken", salsa: "none", spice: 2, price: 9, would_order_again: "no" },
    { protein: "beans", salsa: "mild", spice: 7, price: 7, would_order_again: "no" },
    { protein: "beef", salsa: "mild", spice: 2, price: 7, would_order_again: "yes" },
    { protein: "chicken", salsa: "hot", spice: 9, price: 11, would_order_again: "yes" },
    { protein: "beans", salsa: "none", spice: 8, price: 4, would_order_again: "no" },
    { protein: "beef", salsa: "none", spice: 6, price: 12, would_order_again: "yes" },
    { protein: "chicken", salsa: "mild", spice: 4, price: 5, would_order_again: "yes" },
  ],
};
