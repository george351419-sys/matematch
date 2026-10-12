export type Timing={asOf:string;current:{pillar:string;start:string;end:string}|null;next:{pillar:string;start:string;end:string}|null;method:string};
export type Scorecard={version:string;asOf:string;scope:string;dimensions:{title:string;score:number|null;weight:number;verdict:string;formula:string}[];applicableWeight:number;weighted:number;total:number;facts:any;disclaimer:string};
