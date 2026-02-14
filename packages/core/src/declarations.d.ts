declare module 'drizzle-orm/sqlite-core' {
  export function sqliteTable(name: string, columns: Record<string, any>): any;
  export function text(name: string): any;
  export function integer(name: string, config?: any): any;
}

declare module 'drizzle-orm/better-sqlite3' {
  export function drizzle(client: any, config?: any): any;
  export type BetterSQLite3Database<T = any> = any;
}

declare module 'drizzle-orm' {
  export function eq(col: any, val: any): any;
}
