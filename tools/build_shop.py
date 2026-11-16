import json,re,collections
rows=json.load(open('shop_raw.json'))
DOC={ # code -> (hạng mục chính, zone gốc, tên cụm)
'003':('Bể nước PCCC',['Chung'],'Thép bể nước PCCC hầm B1'),
'004':('Cột - Vách',['Zone 2'],'Thép cột Zone 2.1 + 2.2 (hầm B3 lên tầng 1)'),
'005':('Cột - Vách',['Zone 3'],'Thép cột Zone 3.1 + 3.2 (hầm B3 lên tầng 1)'),
'006':('Dầm',['Zone 2'],'Thép dầm Zone 2.1 + 2.2 hầm B1'),
'007':('Dầm',['Zone 3'],'Thép dầm Zone 3.1 + 3.2 hầm B1'),
'008':('Cột - Vách',['Zone 1'],'Thép cột Zone 1.1 + 1.2 + 1.3 hầm B1'),
'009':('Sàn',['Zone 2'],'Thép sàn Zone 2.1 + 2.2 hầm B1'),
'010':('Sàn',['Zone 3'],'Thép sàn Zone 3.1 + 3.2 hầm B1'),
'011':('Dầm',['Zone 1'],'Thép dầm Zone 1.1 + 1.2 + 1.3 hầm B1'),
'012':('Sàn',['Zone 1'],'Thép sàn Zone 1.1 + 1.2 + 1.3 hầm B1'),
}
BOIL=re.compile(r'TEL|FAX|E - MAIL|APPROVAL|PHÊ DUYỆT|SCALE|DWG No|DRAWN BY|THỰC HIỆN|REVISION|HIỆU CHỈNH|NGÀY HOÀN|DATE:|CIVIL CONTRACTOR|SITE MANAGER|CHỈ HUY|ISSUED FOR|LOẠI HỒ SƠ|AS-BUILT|HOÀN CÔNG|REVISED|FOR CONSTRUCTION|FOR APPROVAL|FOR CONTRACT|HỢP ĐỒNG|REFERENCE|THAM KHẢO|PROJECT/|CLIENT/|NOTES/|DRAWING TITLE|ITEM/|CONSULTANCY|CHECKED BY|KIỂM TRA|WEBSITE|ADDRESS|GREENWORLD|ARTELIA|SOL E&C|CÔNG TY|KHÁCH SẠN|STAR ODYSSEY|DU LỊCH|Eng\.|THI CÔNG PHẦN HẦM|TRÌNH DUYỆT|XIN PHÉP|THI CÔNG$',re.I)
def clean(t):
    out=[];seen=collections.Counter()
    for ln in t.split('\n'):
        ln=ln.strip()
        if len(ln)<2 or BOIL.search(ln) or re.fullmatch(r'[\d\s.,\-+/()xX]+',ln): continue
        seen[ln]+=1
        if seen[ln]>1: continue
        out.append(ln)
    return ' | '.join(out)[:6000]
def zones(r):
    t=r['title'].upper()+' '+r['text'][:300].upper()
    z=set(re.findall(r'ZONE\s*(\d)',r['title'].upper()))
    if z: return ['Zone '+x for x in sorted(z)]
    return DOC[r['code']][1]
def kind(r):
    t=r['title'].upper()
    if not t: return 'Bìa'
    if 'DANH MỤC' in t: return 'Danh mục bản vẽ'
    if 'ĐIỂN HÌNH' in t: return 'Chi tiết điển hình'
    if 'CHIA ZONE' in t: return 'Mặt bằng chia Zone'
    if 'Ô NẤM' in t or 'SÀN NẤM' in t or 'MŨ CỘT' in t: return 'Mũ cột (ô nấm)'
    if 'COLUMN & SHEAR WALL PLAN' in t: return 'Mặt bằng cột vách'
    if 'CHI TIẾT CỘT' in t: return 'Chi tiết cột'
    if 'CHI TIẾT DẦM' in t: return 'Chi tiết dầm'
    if 'MẶT BẰNG DẦM SÀN' in t: return 'Mặt bằng dầm sàn'
    if 'THÉP LỚP' in t or 'CHÂN KÊ' in t or 'SÀN BIỆN PHÁP' in t: return 'Thép sàn'
    if 'BỂ NƯỚC' in t: return 'Bể nước PCCC'
    if 'VÁCH' in t: return 'Vách'
    if 'DẦM' in t: return 'Chi tiết dầm'
    return 'Khác'
out=[]
for r in rows:
    m=DOC[r['code']]
    out.append(dict(id=f"S{r['code']}-{r['page']:02d}",doc=r['code'],pdf=r['pdf'],page=r['page'],title=r['title'] or ('Bìa / thông tin dự án' if r['page']<=2 else '(không có tiêu đề)'),
      cat=m[0],kind=kind(r),zones=zones(r),cum=m[2],txt=clean(r['text'])))
json.dump(out,open('shop_pages.json','w'),ensure_ascii=False)
print(len(out),sum(len(o['txt']) for o in out))
print(collections.Counter((o['cat'],o['kind']) for o in out).most_common(40))
print(collections.Counter(tuple(o['zones']) for o in out))
