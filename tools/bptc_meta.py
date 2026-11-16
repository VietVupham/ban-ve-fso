import glob,os,re,json,hashlib
def key(f): return hashlib.md5(os.path.basename(f).encode()).hexdigest()[:10]
CATS=[('Cẩu tháp','cẩu tháp|bulong móng'),('Quan trắc - Đo đạc','quan trắc|đo chuyển vị|đo mực nước|inclinometer|mốc|trắc đạt|khảo sát'),
('Đào đất - Hạ mực nước','đào đất|giếng|hạ mực|capping'),('Cốp pha - Bê tông','cốp pha|đổ bê tông|bê tông khác mác|bảo dưỡng bê tông|mạch ngừng'),
('Cốt thép - Cấy thép','coupler|tẩy gỉ|keo khoan cấy|khoan cấy'),('Hầm - Tổng thể','hầm tổng thể|khuyết tật')]
def cat(t):
    tl=t.lower()
    for c,p in CATS:
        if re.search(p,tl): return c
    return 'Khác'
out=[]
for f in sorted(glob.glob('/mnt/user-data/uploads/DUYET/*.pdf')):
    b=os.path.basename(f)[:-4]
    m=re.match(r'(\d{6})\.FSO\.SOL\.?(BP2|BSV)\.RFA\.MOS\.(\d{3})(?:\.([A-C])(?=[.\s]|$))?\.?\s*(.*)',b)
    d,org,no,rev,title=m.groups()
    title=re.sub(r'^[\s.]+|\s*pdf$','',title).strip(); rb=re.search(r'\(([AB])\)\s*$',title); rev=rev or (rb.group(1) if rb else ''); title=re.sub(r'\s*\([AB]\)\s*$','',title)
    title=re.sub(r'\s+',' ',title)
    out.append(dict(key=key(f),file=os.path.basename(f),no=no,date=f'20{d[:2]}-{d[2:4]}-{d[4:]}',rev=rev,org=org,title=title,cat=cat(b),size=os.path.getsize(f)))
out.sort(key=lambda x:x['no'])
json.dump(out,open('bptc_meta.json','w'),ensure_ascii=False,indent=1)
for o in out: print(o['no'],o['date'],o['rev'],o['cat'],'|',o['title'])
