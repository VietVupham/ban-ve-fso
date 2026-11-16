import pymupdf,glob,os,re,json,sys
def pagemeta(p):
    W,H=p.rect.width,p.rect.height
    sx,sy=W/1191.0,H/842.0
    title=[];item=[];sheet=''
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines',[]):
            for s in l['spans']:
                t=s['text'].strip()
                if not t: continue
                x0,y0,x1,y1=[v/ (sx if i%2==0 else sy) for i,v in enumerate(s['bbox'])]
                if x0>1055 and 760<y0<780: title.append((x0,t))
                if x0>1055 and 722<y0<735: item.append((x0,t))
                if 1128<x0<1150 and 817<y0<830 and re.fullmatch(r'\d{1,3}',t): sheet=t
    j=lambda a:' '.join(t for _,t in sorted(a)).strip()
    return j(title),j(item),sheet
out=[]
for f in sorted(glob.glob('/mnt/user-data/uploads/07*/4-2-1-*/*.pdf')):
    d=pymupdf.open(f); code=re.search(r'STR\.(\d{3})',f).group(1)
    for i,p in enumerate(d):
        t,it,sh=pagemeta(p)
        out.append(dict(file=f,code=code,page=i+1,title=re.sub(r'\s+',' ',t),item=it,sheet=sh))
json.dump(out,open('shop_meta.json','w'),ensure_ascii=False,indent=0)
for o in out: print(o['code'],o['page'],o['sheet'],'|',o['title'],'|',o['item'])
