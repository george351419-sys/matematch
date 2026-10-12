declare module '*scoring.mjs' {
 export function evaluatePair(a:any,b:any,asOf:string):import('./lib/scoring-types').Scorecard;
}
declare module '*service.mjs' {
 export const outputSchema: import('zod').ZodType<import('./lib/types').Narrative>;
}
