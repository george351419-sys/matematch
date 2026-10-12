export type BirthInput={name:string;date:string;time:string;sex:'female'|'male';calendar:'solar'|'lunar';leap:boolean;place:string;timezone:string};
export type Section={title:string;verdict:string;body:string;basis:string;action:string};
export type Narrative={headline:string;summary:string;advantage:string;challenge:string;sections:Section[];perspectives:{direction:'甲方看乙方'|'乙方看甲方';smooth:string;friction:string}[];advice:{title:string;body:string}[];conclusion:string;ziwei:string;questions:string[]};
