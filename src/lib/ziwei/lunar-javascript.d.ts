declare module 'lunar-javascript' {
 export class EightChar {
  setSect(sect:number):void;
  getYun(gender:number,sect:number):{getStartSolar():Solar;getDaYun(n:number):{getIndex():number;getGanZhi():string}[]};
  getYear():string;getMonth():string;getDay():string;getTime():string;
  getYearHideGan():string[];getMonthHideGan():string[];getDayHideGan():string[];getTimeHideGan():string[];
 }
 export class Lunar {
  static fromYmdHms(y:number,m:number,d:number,h:number,mi:number,s:number):Lunar;
  getYear():number;getMonth():number;getDay():number;
  getYearGan():string;getYearZhi():string;getMonthGan():string;getMonthZhi():string;getDayGan():string;getDayZhi():string;
  getSolar():Solar;getEightChar():EightChar;
 }
 export class Solar {
  static fromYmd(y:number,m:number,d:number):Solar;
  static fromYmdHms(y:number,m:number,d:number,h:number,mi:number,s:number):Solar;
  getYear():number;getMonth():number;getDay():number;getLunar():Lunar;nextYear(n:number):Solar;toYmd():string;
 }
}
