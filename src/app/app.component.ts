import { Component } from '@angular/core';
import { fromEvent, map, Observable } from 'rxjs';
import { People } from './Poeple';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'people_relation';

  private field: any = {
    '姓名': 'name',
    '性别': 'gender',
    '民族': 'nation',
    '出生日期': 'birthday',
    '公民身份证号': 'pid',
    '与户主关系': 'relation',
    '服务处所': 'workplace',
    '电话号码': 'telephone',
    '户号': 'homeNumber',
    '街路巷': 'address',
    '门牌号': 'doorNumber',
    '区分局': 'police',
    '派出所': 'station',
  }

  private r_huzhu = ['户主', '本人'];
  private r_erzi = ['三女', '三子', '二女', '五女', '五子', '四女', '四子', '长女', '长子', '子', '次子', '独生女', '独生子', '女'];
  private r_sunzi = ['孙女', '孙子'];
  private r_waisun = ['外孙女', '外孙子'];
  private r_xiongdi = ['兄', '妹妹', '姐姐', '弟'];
  private r_zhizi = ['侄子', '侄女'];
  private r_qizi = '妻';
  private r_zhangfu = '夫';
  private r_nvxu = '女婿';
  private r_yuefu = '岳父';
  private r_yuemu = '岳母';
  private r_fuqin = '父亲';
  private r_muqin = '母亲';
  private r_zufu = '祖父';
  private r_zumu = '祖母';
  private r_gonggong = '公公';
  private r_popo = '婆婆';
  private r_erxi = '儿媳';
  private r_nv = '女';
  private r_zi = '子';


  private times = 0;
  onFileChange(e: Event) {
    this.times = 0;
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      const file = files[0];
      this.getExcelData(file).pipe(
        map(res => {
          return res.map(item => this.convertData(item))
        })
      ).subscribe(peoples => {
        const pmap = this.peoplesToPeopleMap(peoples);
        this.execAll(pmap);
        const parr = this.peopleMapToPeoples(pmap);
        this.saveSheet(parr)
      })
    }
  }

  private peopleMapToPeoples(pmap:Map<string,People[]>){
    let parr:People[] = [];
    pmap.forEach(value=>{
      parr = parr.concat(value)
    })
    return parr;
  }

  private saveSheet(peoples:People[]){
    const ws = XLSX.utils.json_to_sheet(peoples);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'people');

    /* save to file */
    let fileName = 'people'
    XLSX.writeFile(wb, fileName + ".xlsx");
  }

  private execAll(pmap: Map<string, People[]>) {
    pmap.forEach(value => {
      this.execFamilyRelation(value)
    })
    console.log("共计设置",this.times)
  }

  private execFamilyRelation(families: People[]) {
    const huzhu = families[0];
    if (families.length > 1 && this.isRealtion(huzhu, this.r_huzhu)) {
      for (let i = 0; i < families.length; i++) {
        const p = families[i];
        if (huzhu.gender == '男') {
          if(this.isRealtion(p,this.r_huzhu)){
            this.nanhuzhu(huzhu, families);
          }
          else if (this.isRealtion(p, this.r_qizi)) {
            this.qizi(p, families)
          }
          else if (this.isRealtion(p, this.r_xiongdi)) {
            this.xiongdi(p, families)
          }
          else if (this.isRealtion(p, this.r_zufu)) {
            this.zufu(p, families)
          }
          else if (this.isRealtion(p, this.r_zumu)) {
            this.zumu(p, families)
          }
        } else {
          if(this.isRealtion(p,this.r_huzhu)){
            this.nvhuzhu(p, families)
          }
          else if (this.isRealtion(p, this.r_zhangfu)) {
            this.zhangfu(p, families)
          }
        }
        if (this.isRealtion(p, this.r_sunzi))
          this.sunzi(p, families);
        if (this.isRealtion(p, this.r_waisun))
          this.waisun(p, families);
      }
    }
  }

  private peoplesToPeopleMap(peoples: People[]) {
    let peopleMap = new Map<string, People[]>();
    peoples.forEach((p) => {
      if (!peopleMap.get(p.homeNumber)) {
        peopleMap.set(p.homeNumber, [p]);
      } else {
        this.isRealtion(p, this.r_huzhu) ? peopleMap.get(p.homeNumber)?.unshift(p) : peopleMap.get(p.homeNumber)?.push(p)
      }
    })
    return peopleMap;
  }

  //男户主
  private nanhuzhu(nanhuzhu: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_erzi)) {
        this.times++;
        p.fatherId = nanhuzhu.pid;
      } else if (this.isRealtion(p, this.r_fuqin)) {
        this.times++;
        nanhuzhu.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_muqin)) {
        this.times++;
        nanhuzhu.motherId = p.pid;
      }
    })
  }

  // 妻子
  private qizi(qizi: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_erzi)) {
        this.times++;
        p.motherId = qizi.pid;
      } else if (this.isRealtion(p, this.r_yuefu)) {
        this.times++;
        qizi.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_yuemu)) {
        this.times++;
        qizi.motherId = p.pid;
      }
    })
  }

  //兄弟姐妹
  private xiongdi(nanhuzhu: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_fuqin)) {
        this.times++;
        nanhuzhu.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_muqin)) {
        this.times++;
        nanhuzhu.motherId = p.pid;
      }
    })
  }

  //孙子
  private sunzi(sunzi: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_zi)) {
        this.times++;
        sunzi.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_erxi)) {
        
        this.times++;
        sunzi.motherId = p.pid;
      }
    })
  }

  //祖父
  private zufu(zufu: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_fuqin)) {
        this.times++;
        p.fatherId = zufu.pid;
      }
    })
  }

  //祖母
  private zumu(zumu: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_fuqin)) {
        this.times++;
        p.motherId = zumu.pid;
      }
    })
  }

  //女户主
  private nvhuzhu(nvhuzhu: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_erzi)) {
        this.times++;
        p.motherId = nvhuzhu.pid;
      }
      else if (this.isRealtion(p, this.r_yuefu)) {
        this.times++;
        nvhuzhu.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_yuemu)) {
        this.times++;
        nvhuzhu.motherId = p.pid;
      }
    })
  }

  // 丈夫
  private zhangfu(zhangfu: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_erzi)) {
        this.times++;
        p.fatherId = zhangfu.pid;
      } else if (this.isRealtion(p, this.r_gonggong)) {
        this.times++;
        zhangfu.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_popo)) {
        this.times++;
        zhangfu.motherId = p.pid;
      }
    })
  }

  //外孙
  private waisun(waisun: People, families: People[]) {
    families.forEach(p => {
      if (this.isRealtion(p, this.r_nvxu)) {
        this.times++;
        waisun.fatherId = p.pid;
      } else if (this.isRealtion(p, this.r_nv)) {
        this.times++;
        waisun.motherId = p.pid;
      }
    })
  }

  private isRealtion(p: People, relation: String[] | String) {
    if (typeof (relation) == 'string') {
      return p.relation == relation;
    } else if (relation instanceof Array) {
      return relation.indexOf(p.relation) > -1;
    }
    return false;
  }

  //获取excel数据
  private getExcelData(file: File): Observable<any[]> {
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(file);
    return fromEvent(fileReader, 'load').pipe(
      map((event) => {
        const binary: string = (<any>event.target).result;
        const workbook = XLSX.read(binary, { type: 'binary' });
        const wsname: string = workbook.SheetNames[0];
        const ws: XLSX.WorkSheet = workbook.Sheets[wsname];
        return XLSX.utils.sheet_to_json(ws, {
          raw: false,
          defval: null,
          blankrows: false,
        });
      })
    );
  }

  private convertData(o: any): People {
    let p: any = {};
    for (const key in o) {
      let newkey = <string>this.field[key];
      if (<string>newkey) {
        p[newkey] = o[key];
      }
    }
    return <People>p;
  }





  // 伯母
  // 伯父
  // 其他亲属
  // 其他兄弟姐妹
  // 其他孙子、孙女或外孙子、外孙女
  // 养女或继女
  // 养子或继子
  // 叔父
  // 外甥
  // 外甥女
  // 外祖母
  // 外祖父
  // 妹夫
  // 姑母
  // 嫂


  // 孙媳妇或外孙媳妇
  // 小集体户户主

  // 弟媳

  // 曾孙女或曾外孙女
  // 曾孙子或曾外孙子
  // 曾祖母


  // 继父或养父

  // 非亲属

}
