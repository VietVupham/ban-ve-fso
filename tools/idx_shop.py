import pymupdf,json,re,os
meta=json.load(open('shop_meta.json'))
TYPE={'003':'Bể nước PCCC','004':'Cột','005':'Cột','008':'Cột','006':'Dầm','007':'Dầm','011':'Dầm','009':'Sàn','010':'Sàn','012':'Sàn'}
ZONE={'003':'Zone 1','004':'Zone 2','005':'Zone 3','006':'Zone 2','007':'Zone 3','008':'Zone 1','009':'Zone 2','010':'Zone 3','011':'Zone 1','012':'Zone 1'}
docs={}
rows=[]
for m in meta:
    d=docs.get(m['file']) or docs.setdefault(m['file'],pymupdf.open(m['file']))
    p=d[m['page']-1]; txt=re.sub(r'[ \t]+',' ',p.get_text())
    t=m['title']; code=m['code']
    # flat text w/o title-block boilerplate
    tags=set(re.findall(r'\bB1\.[HV]B[\d.]+[A-Z]?\b|\bB\d[A-Z]?\b(?=[;\s])|\bP-C\d+[A-Z]?\b|\bCW\d+\b|\bC\d\b|\bÔ SÀN \d+\b|\bBP\d\b',txt))
    kind='Chi tiết'
    U=txt.upper()
    if 'DANH MỤC BẢN VẼ' in U[:3000] and m['page']<=4: kind='Danh mục / bìa'
    elif m['page']<=2 or len(txt)<80: kind='Bìa'
    elif 'CHI TIẾT ĐIỂN HÌNH' in U and not t.startswith('CHI TIẾT DẦM'): kind='Chi tiết điển hình'
    elif 'MẶT BẰNG CHIA ZONE' in U: kind='Mặt bằng chia Zone'
    typ=TYPE[code]
    if 'Ô NẤM' in U or 'MŨ CỘT' in U: typ2='Mũ cột (ô nấm)'
    else: typ2=typ
    rows.append(dict(src='shop',code=code,pdf=os.path.basename(m['file']),page=m['page'],sheet=m['sheet'],title=t,type=typ,kind=kind,zone=ZONE[code],tags=sorted(tags)[:30],text=txt))
json.dump(rows,open('shop_index.json','w'),ensure_ascii=False)
import collections
print(collections.Counter((r['type'],r['kind']) for r in rows))
for r in rows[:0]: pass
# sample col/slab tags
for r in rows:
    if r['code'] in('008','009') and r['kind']=='Chi tiết' and r['page'] in (8,9,10,12,20): print(r['code'],r['page'],r['tags'][:8],repr(r['text'][:120]))
