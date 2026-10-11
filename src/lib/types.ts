export type BirthInput={name:string;date:string;time:string;sex:'female'|'male';calendar:'solar'|'lunar';leap:boolean;place:string;timezone:string};
export type Section={title:string;body:string;basis:string;action:string};
export type Narrative={headline:string;summary:string;sections:Section[];questions:string[]};
