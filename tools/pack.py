import pymupdf,glob,os,io,json,hashlib,struct,collections
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
OUT='site/data/c'; import shutil; shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT,exist_ok=True)
def enc(f,i,w,q):
    d=pymupdf.open(f); p=d[i]; z=w/p.rect.width
    pix=p.get_pixmap(matrix=pymupdf.Matrix(z,z),colorspace=pymupdf.csRGB)
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples); b=io.BytesIO(); im.save(b,'WEBP',quality=q,method=4); return b.getvalue()
def job(a):
    cid,items,w,q=a   # items: [(page,f,i)]
    out=f'{OUT}/{cid}.txt'
    if os.path.exists(out): return
    blobs=[(pg,enc(f,i,w,q)) for pg,f,i in items]
    head=struct.pack('<I',len(blobs))+b''.join(struct.pack('<HI',pg,len(b)) for pg,b in blobs)
    open(out,'wb').write(head+b''.join(b for _,b in blobs))
if __name__=='__main__':
    G=collections.defaultdict(list)
    for r in json.load(open('shop_pages.json')):
        f=glob.glob('/mnt/user-data/uploads/07*/4-2-1-*/'+r['pdf'])[0]
        G[('s'+r['doc'],(r['page']-1)//8,3600,72)].append((r['page'],f,r['page']-1))
    for m in json.load(open('bptc_meta.json')):
        f='/mnt/user-data/uploads/DUYET/'+m['file']
        for i in range(len(pymupdf.open(f))): G[('b'+m['key'],i//12,1800,60)].append((i+1,f,i))
    jobs=[(f'{k[0]}_{k[1]}',v,k[2],k[3]) for k,v in G.items()]
    print(len(jobs),flush=True)
    with ProcessPoolExecutor(2) as ex: list(ex.map(job,jobs))
    import datetime,hashlib
    h={f[:-4]:hashlib.md5(open(f'{OUT}/{f}','rb').read()).hexdigest()[:8] for f in sorted(os.listdir(OUT))}
    tz=datetime.timezone(datetime.timedelta(hours=7))
    json.dump({'updated':datetime.datetime.now(tz).isoformat(timespec='minutes'),'h':h},open('site/version.json','w'))
    print('DONE',flush=True)
