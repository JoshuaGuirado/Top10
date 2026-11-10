# Põe \unfoldRepeats no começo da música de cada \score de uma partitura do LilyPond, para o MIDI tocar as repetições
# (casa 1 e casa 2) como no papel. Pula os blocos \header que vierem antes da música. Usado pelo robô
# .github/workflows/classicas-repeticoes.yml. Uso: python3 desdobrar.py arquivo.ly
import re, sys

def pular_bloco(txt, i):
    # i aponta para "{"; devolve a posição logo depois do "}" que fecha
    nivel = 0
    while i < len(txt):
        if txt[i] == "{": nivel += 1
        elif txt[i] == "}":
            nivel -= 1
            if nivel == 0: return i + 1
        i += 1
    return i

arq = sys.argv[1]
txt = open(arq, encoding="utf-8").read()
saida, i, n = [], 0, 0
for m in re.finditer(r"\\score\s*\{", txt):
    if m.start() < i: continue
    j = m.end()
    while True:
        k = re.match(r"\s*\\header\s*\{", txt[j:])
        if not k: break
        j = pular_bloco(txt, j + k.end() - 1)
    saida.append(txt[i:j] + " \\unfoldRepeats ")
    i, n = j, n + 1
saida.append(txt[i:])
open(arq, "w", encoding="utf-8").write("".join(saida))
print(arq, n, "partitura(s) desdobrada(s)")
