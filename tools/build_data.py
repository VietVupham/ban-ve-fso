# Tạo bptc_meta.json + site/data/bptc.json từ thư mục DUYET (bỏ qua file hỏng)
import glob,os,re,json,hashlib,subprocess,pymupdf
SRC='/mnt/user-data/uploads/DUYET'
exec(open('bptc_meta.py').read().split('out=[]')[0])   # key(), cat()
out=[];pages=[];skipped=[]
for f in sorted(glob.glob(SRC+'/*.pdf')):
    b=os.path.basename(f)[:-4]
    try: d=pymupdf.open(f); n=len(d)
    except Exception: n=0
    if not n: skipped.append(os.path.basename(f)); continue
    m=re.match(r'(\d{6})\.FSO\.SOL\.?(BP2|BSV)\.RFA\.MOS\.(\d{3})(?:\.([A-C])(?=[.\s]|$))?\.?\s*(.*)',b)
    dd,org,no,rev,title=m.groups()
    title=re.sub(r'^[\s.]+|\s*pdf$','',title).strip(); rb=re.search(r'\(([AB])\)\s*$',title); rev=rev or (rb.group(1) if rb else ''); title=re.sub(r'\s*\([AB]\)\s*$','',title); title=re.sub(r'\s+',' ',title)
    k=key(f)
    out.append(dict(key=k,file=os.path.basename(f),no=no,date=f'20{dd[:2]}-{dd[2:4]}-{dd[4:]}',rev=rev,org=org,title=title,cat=cat(b),np=n))
    for i in range(n):
        t=d[i].get_text()
        if len(t.strip())<50:
            o=f'ocr/{k}_{i:03d}.txt'
            if not os.path.exists(o):
                pix=d[i].get_pixmap(dpi=170,colorspace=pymupdf.csGRAY); png=f'/tmp/o_{k}_{i}.png'; pix.save(png)
                open(o,'w').write(subprocess.run(['tesseract',png,'-','-l','vie+eng','--psm','3'],capture_output=True,text=True).stdout); os.remove(png)
            t=open(o).read()
        t=' | '.join(l.strip() for l in t.splitlines() if l.strip())
        pages.append(dict(k=k,p=i+1,t=t))
out.sort(key=lambda x:x['no'])
json.dump(out,open('bptc_meta.json','w'),ensure_ascii=False,indent=1)
docs=[{x:o[x] for x in('key','no','rev','org','title','cat','date','file')} for o in out]
json.dump(dict(docs=docs,pages=pages),open('site/data/bptc.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(docs),'docs',len(pages),'pages','skipped:',skipped)
