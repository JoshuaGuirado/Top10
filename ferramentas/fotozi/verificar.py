"""Fotozi: confere todas as fotos (roda no GitHub Actions, que acessa a Wikipédia).

Para cada item de fotozi/data/fotos-*.js:
  - pega a foto principal do artigo na Wikipédia em português (a mesma que o jogo usa);
  - nas fotos de gente, acha o ROSTO com o detector YuNet do OpenCV (o maior rosto da foto);
  - nas outras, acha o assunto principal (mapa de saliência do OpenCV) e usa o meio dele;
  - grava ferramentas/fotozi/fotos.json (arquivo da foto, tamanho, rosto e ponto do zoom em % da foto inteira);
  - monta folhas de conferência (ferramentas/fotozi/folhas/*.jpg): cada foto inteira com uma grade A–E × 1–5,
    o rosto achado (verde) e o ponto onde o zoom começa (cruz vermelha), para revisar a olho.
"""
import json, os, subprocess, sys, time, urllib.parse, urllib.request
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, "ferramentas", "fotozi")
UA = "GameziFotozi/1.0 (https://github.com/JoshuaGuirado/Top10; verificacao de fotos)"
PESSOAS = {"futebol", "famosos", "musicos", "atores", "atletas", "historia"}
API = "https://pt.wikipedia.org/w/api.php"

def baixar(url, tentativas=6):
    for k in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:
            espera = 2 * (k + 1)
            print("  erro", e, "→ de novo em", espera, "s", file=sys.stderr)
            time.sleep(espera)
    return None

def itens():
    js = """
    const fs = require('fs'); const it = [];
    global.fzFotos = (tema, lista) => lista.forEach((x) => it.push({ id: 'f' + (it.length + 1), tema, titulo: x[0], nome: x[1] }));
    for (const f of fs.readdirSync('fotozi/data').filter((f) => /^fotos-\\d+\\.js$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)))) require('./fotozi/data/' + f);
    console.log(JSON.stringify(it));
    """
    return json.loads(subprocess.check_output(["node", "-e", js], cwd=RAIZ))

def paginas(titulos):
    res = {}
    for i in range(0, len(titulos), 50):
        lote = titulos[i:i + 50]
        q = urllib.parse.urlencode({"action": "query", "format": "json", "redirects": 1, "prop": "pageimages|pageprops",
                                    "ppprop": "disambiguation", "piprop": "thumbnail|name|original", "pithumbsize": 960,
                                    "titles": "|".join(lote)})
        d = json.loads(baixar(API + "?" + q))["query"]
        vira = {x["from"]: x["to"] for x in d.get("normalized", []) + d.get("redirects", [])}
        pags = {p["title"]: p for p in d.get("pages", {}).values()}
        for t in lote:
            nome = t
            for _ in range(3):
                nome = vira.get(nome, nome)
            res[t] = pags.get(nome)
        time.sleep(1)
    return res

def detector():
    caminho = os.path.join(SAIDA, "yunet.onnx")
    if not os.path.exists(caminho):
        dados = baixar("https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx")
        open(caminho, "wb").write(dados)
    return cv2.FaceDetectorYN.create(caminho, "", (320, 320), 0.6, 0.3, 5000)

def rosto(det, img):
    h, w = img.shape[:2]
    esc = min(1.0, 1280 / max(w, h))
    peq = cv2.resize(img, (int(w * esc), int(h * esc))) if esc < 1 else img
    det.setInputSize((peq.shape[1], peq.shape[0]))
    _, faces = det.detect(peq)
    if faces is None or not len(faces):
        return None
    # O maior rosto (quem é o assunto da foto), com um pouco de preferência pelos mais confiáveis.
    f = max(faces, key=lambda r: r[2] * r[3] * r[14])
    x, y, fw, fh = [float(v) / esc for v in f[:4]]
    return [round(100 * x / w, 1), round(100 * y / h, 1), round(100 * fw / w, 1), round(100 * fh / h, 1), round(float(f[14]), 2)]

def assunto(img):
    sal = cv2.saliency.StaticSaliencyFineGrained_create()
    ok, mapa = sal.computeSaliency(img)
    if not ok:
        return [50, 45]
    mapa = cv2.GaussianBlur((mapa * 255).astype("uint8"), (0, 0), 9)
    _, bin_ = cv2.threshold(mapa, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    n, rot, st, cen = cv2.connectedComponentsWithStats(bin_)
    if n <= 1:
        return [50, 45]
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    h, w = img.shape[:2]
    return [round(float(100 * cen[i][0] / w), 1), round(float(100 * cen[i][1] / h), 1)]

def main():
    os.makedirs(os.path.join(SAIDA, "folhas"), exist_ok=True)
    lista = itens()
    print(len(lista), "fotos")
    pags = paginas([x["titulo"] for x in lista])
    det = detector()
    saida = {}
    try:
        fonte = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
    except Exception:
        fonte = ImageFont.load_default()
    LADO, COLS, LINS = 230, 6, 5
    folha, n_folha, pos = None, 0, 0
    def salvar():
        if folha is not None:
            folha.save(os.path.join(SAIDA, "folhas", f"folha-{n_folha:02d}.jpg"), quality=80)
    for k, x in enumerate(lista):
        p = pags.get(x["titulo"])
        reg = {"tema": x["tema"], "titulo": x["titulo"], "nome": x["nome"]}
        if not p or "thumbnail" not in p or not p.get("pageimage"):
            reg["erro"] = "sem foto" if p else "artigo não encontrado"
        elif "pageprops" in p and "disambiguation" in p["pageprops"]:
            reg["erro"] = "desambiguação"
        else:
            reg["arquivo"] = p["pageimage"]
            reg["pagina"] = p["title"]
            reg["original"] = [p.get("original", {}).get("width"), p.get("original", {}).get("height")]
            dados = baixar(p["thumbnail"]["source"])
            img = cv2.imdecode(np.frombuffer(dados, np.uint8), cv2.IMREAD_COLOR) if dados else None
            if img is None:
                reg["erro"] = "não baixou"
            else:
                h, w = img.shape[:2]
                reg["tamanho"] = [w, h]
                if x["tema"] in PESSOAS:
                    r = rosto(det, img)
                    reg["rosto"] = r
                    # O zoom começa entre os olhos e o nariz: um pouco acima do meio do rosto.
                    reg["foco"] = [round(r[0] + r[2] / 2, 1), round(r[1] + r[3] * 0.45, 1)] if r else assunto(img)
                else:
                    reg["foco"] = assunto(img)
                # Folha de conferência.
                if pos % (COLS * LINS) == 0:
                    salvar()
                    n_folha += 1
                    folha = Image.new("RGB", (COLS * LADO, LINS * (LADO + 34)), (30, 30, 30))
                cel = pos % (COLS * LINS)
                ox, oy = (cel % COLS) * LADO, (cel // COLS) * (LADO + 34)
                pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                pil.thumbnail((LADO - 10, LADO - 10))
                px, py = ox + (LADO - pil.width) // 2, oy + (LADO - pil.height) // 2
                folha.paste(pil, (px, py))
                d = ImageDraw.Draw(folha)
                for g in range(1, 5):
                    d.line([px + pil.width * g / 5, py, px + pil.width * g / 5, py + pil.height], fill=(255, 255, 255), width=1)
                    d.line([px, py + pil.height * g / 5, px + pil.width, py + pil.height * g / 5], fill=(255, 255, 255), width=1)
                for g, letra in enumerate("ABCDE"):
                    d.text((px + pil.width * (g + 0.5) / 5 - 4, py + 2), letra, fill=(255, 255, 0), font=fonte)
                for g in range(5):
                    d.text((px + 2, py + pil.height * (g + 0.5) / 5 - 7), str(g + 1), fill=(255, 255, 0), font=fonte)
                if reg.get("rosto"):
                    r = reg["rosto"]
                    d.rectangle([px + pil.width * r[0] / 100, py + pil.height * r[1] / 100, px + pil.width * (r[0] + r[2]) / 100, py + pil.height * (r[1] + r[3]) / 100], outline=(0, 255, 0), width=3)
                fx, fy = px + pil.width * reg["foco"][0] / 100, py + pil.height * reg["foco"][1] / 100
                d.line([fx - 12, fy, fx + 12, fy], fill=(255, 0, 0), width=4)
                d.line([fx, fy - 12, fx, fy + 12], fill=(255, 0, 0), width=4)
                d.text((ox + 4, oy + LADO + 2), f'{x["id"]} {x["nome"]}'[:30], fill=(255, 255, 255), font=fonte)
                d.text((ox + 4, oy + LADO + 17), x["tema"], fill=(170, 170, 170), font=fonte)
                pos += 1
        saida[x["id"]] = reg
        if k % 50 == 0:
            print(k, x["titulo"], reg.get("erro") or reg.get("foco"), flush=True)
        time.sleep(0.15)
    salvar()
    json.dump(saida, open(os.path.join(SAIDA, "fotos.json"), "w"), ensure_ascii=False, indent=0)
    erros = {k: v for k, v in saida.items() if v.get("erro")}
    sem_rosto = [k for k, v in saida.items() if v["tema"] in PESSOAS and not v.get("erro") and not v.get("rosto")]
    print("erros:", json.dumps(erros, ensure_ascii=False))
    print("gente sem rosto:", sem_rosto)

main()
