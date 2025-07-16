export type TreeItem = string | [string, ...TreeItem[]];

export type FileCollection = {
  [path: string]: string;
};
