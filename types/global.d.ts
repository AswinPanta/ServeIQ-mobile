declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css";

declare module "expo-haptics" {
  export function notificationAsync(type?: string): Promise<void>;
  export function impactAsync(style?: string): Promise<void>;
}
