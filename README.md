# Lemmon — Plataforma SESMT

Estrutura do projeto:

- `index.html` — página principal (só a estrutura; carrega os demais arquivos)
- `css/` — estilos, em ordem numérica
- `js/` — código da plataforma, dividido por assunto (a ordem dos arquivos no `index.html` importa; não mude)
- `lib/` — bibliotecas de terceiros (não editar)

## Rodar no seu computador
1. Abra a pasta no VS Code (Arquivo > Abrir Pasta).
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.

## Publicar (GitHub Pages)
```
git init
git add .
git commit -m "Lemmon fase 1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lemmon.git
git push -u origin main
```
No GitHub: Settings > Pages > Branch `main` / pasta `/ (root)`.
