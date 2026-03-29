declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.css";

declare module "*.mp3" {
  const src: string;
  export default src;
}
