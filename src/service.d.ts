declare module '*.mjs' {
 export const outputSchema: import('zod').ZodType<import('./lib/types').Narrative>;
}
