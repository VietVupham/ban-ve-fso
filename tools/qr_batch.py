#!/usr/bin/env python3
"""Them 1 dot tem QR vao app QR (index.html) va tu dat vi tri len mat bang thiet ke.
Dung:  python3 qr_batch.py <thu muc TAG pdf cua dot> <index.html> [index2.html ...] --design <pdf thiet ke tang> [--page N] [--plan L1] [--refresh]
 - Doc ma QR tat ca file *TAG*.pdf (zxing-cpp), them vao D.tags (stt = so trang trong file TAG, tem 'BO SUNG' stt=None).
 - Mat bang: trang 'FLOOR FRAMING LAYOUT - LEVEL 1' cua ban ve thiet ke (tim theo chu), render 2.2x, luu vao D.plans[plan].
 - Moi cau kien trong tem -> tim nhan dam (L1.HBx.y, L1.VBx.y, B2A, B4, CT3...) tren mat bang -> pin. Ten chung (VB8) -> lay het VB8.*
 - Khong dung lai vi tri da co trong D.members (khong ghi de).
 - In ra danh sach cau kien khong tim thay nhan de kiem tra tay.
Can: pip install zxing-cpp pymupdf pillow
"""
import sys,re,json,io,base64,glob,os,collections,argparse
import pymupdf,zxingcpp,numpy as np
from PIL import Image
NUM=re.compile(r'^\d+(\.\d+)?$')
def parse(t):
    f=t.split('/')
    if len(f)<10:return None
    j=-1
    for i in range(len(f)-2,1,-1):
        if NUM.match(f[i]) and NUM.match(f[i-1]):j=i;break
    if j<0:j=7
    return dict(member='/'.join(f[j+1:len(f)-1]),kg=float(f[j]))
def find_D(s):
    i=s.index('const D=')+8;depth=0;k=i
    while True:
        c=s[k]
        if c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:break
        elif c=='"':
            k+=1
            while s[k]!='"':
                if s[k]=='\\':k+=1
                k+=1
        k+=1
    return i,k+1
def read_tags(folder):
    out=[]
    for f in sorted(glob.glob(os.path.join(folder,'*TAG*.pdf'))):
        d=pymupdf.open(f);no=os.path.basename(f)[:4];bs='BO SUNG' in os.path.basename(f).upper()
        miss=0
        for i,p in enumerate(d):
            pix=p.get_pixmap(matrix=pymupdf.Matrix(3,3),colorspace=pymupdf.csGRAY)
            r=zxingcpp.read_barcodes(np.frombuffer(pix.samples,np.uint8).reshape(pix.height,pix.width))
            if r:out.append((r[0].text,None if bs else i+1))
            else:miss+=1
        print(os.path.basename(f)[:60],len(d),'trang, khong doc duoc',miss)
    return out
def codes(m):
    m=m.replace('L1.','');m=re.sub(r'\s*TR\s*P.*$','',m);m=re.sub(r'(?<=\d)TR.*$','',m);m=m.replace('REN','')
    return re.findall(r'(?:[HV]B\d+(?:\.\d+)?[A-Z]?(?![A-Z0-9])|\bB2A\b|\bB4\b|\bB1\b|\bB5\b|\bCT\d\b)',m)
def plan_from_design(pdf,page=None,Z=2.2):
    d=pymupdf.open(pdf)
    if page is None:
        for i,p in enumerate(d):
            if re.search(r'FLOOR FRAMING LAYOUT\s*-\s*LEVEL 1',p.get_text()) and 'BASEMENT' not in p.get_text()[:0]:
                if len(p.get_text('words'))>800:page=i;break
    p=d[page];print('trang mat bang:',page+1)
    # vung ban ve: tu toa do nhan dam, bo bang thong ke ben phai (x>1185)
    CL=pymupdf.Rect(60,30,1185,1495)
    pix=p.get_pixmap(matrix=pymupdf.Matrix(Z,Z),clip=CL,colorspace=pymupdf.csRGB)
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples);b=io.BytesIO();im.save(b,'JPEG',quality=72,optimize=True)
    pts=collections.defaultdict(list)
    for w in p.get_text('words'):
        if not CL.contains(pymupdf.Point((w[0]+w[2])/2,(w[1]+w[3])/2)):continue
        t=w[4]
        if re.match(r'^L1\.[HV]B\d',t) or t in('B1','B2A','B4','B5','CT2','CT3','CT4','CT5'):
            c=re.sub(r'-\d+x\d+.*$','',t.replace('L1.',''))
            x=round(((w[0]+w[2])/2-CL.x0)*Z);y=round(((w[1]+w[3])/2-CL.y0)*Z)
            if not any(abs(x-a)<25 and abs(y-b2)<25 for a,b2 in pts[c]):pts[c].append((x,y))
    return {'img':'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode(),'w':im.width,'h':im.height,'zone':{'l':0,'t':0,'w':1,'h':1}},pts
def main():
    ap=argparse.ArgumentParser();ap.add_argument('tagdir');ap.add_argument('html',nargs='+')
    ap.add_argument('--design');ap.add_argument('--page',type=int);ap.add_argument('--plan',default='L1');ap.add_argument('--refresh',action='store_true')
    a=ap.parse_args()
    tags=read_tags(a.tagdir);print('doc duoc',len(tags),'tem')
    plan=pts=None
    for path in a.html:
        s=open(path).read();i,k=find_D(s);D=json.loads(s[i:k])
        if (a.plan not in D['plans'] or a.refresh) and a.design:
            if plan is None:plan,pts=plan_from_design(a.design,a.page)
            D['plans'][a.plan]=plan
        elif plan is None and a.design:
            _,pts=plan_from_design(a.design,a.page)   # chi lay nhan, giu anh cu
        n=0
        for t,stt in tags:
            if t not in D['tags']:D['tags'][t]={'stt':stt};n+=1
        mem=collections.OrderedDict()
        for t,_ in tags:
            r=parse(t)
            if r:e=mem.setdefault(r['member'],{'n':0,'kg':0.0});e['n']+=1;e['kg']+=r['kg']
        add=0;miss=[]
        for m,e in mem.items():
            if m in D['members'] and D['members'][m].get('segs'):continue
            if not pts:break
            segs=[]
            for c in codes(m):
                ks=[c] if c in pts else [k2 for k2 in pts if k2.startswith(c+'.')]
                for k2 in ks:
                    for x,y in pts[k2]:segs.append({'l':k2,'x':x,'y':y,'g':'','z':''})
            if segs:D['members'][m]={'segs':segs,'n':e['n'],'kg':round(e['kg'],1),'plan':a.plan};add+=1
            elif 'BO SUNG' not in m:miss.append(m)
        open(path,'w').write(s[:i]+json.dumps(D,ensure_ascii=False)+s[k:])
        print(path,'tem moi',n,'cau kien co vi tri moi',add,'khong thay nhan',miss)
if __name__=='__main__':main()
