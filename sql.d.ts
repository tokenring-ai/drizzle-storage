// Ambient declaration to support Bun's `import ... with { type: "sql" }` under tsc.
// Bun runtime natively supports loading .sql files as strings via this attribute.
declare module "*.sql" {
  const content: string;
  export default content;
}
