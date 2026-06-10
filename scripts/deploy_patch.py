"""
deploy_patch.py — Déploiement manuel de fichiers ciblés sur le FTP.
Ajouter les fichiers modifiés dans la liste `files` avant de lancer.
"""
import ftplib, os, shutil
from pathlib import Path
from update_and_deploy import archive_before_deploy

FTP_HOST = os.getenv("FTP_HOST", "")
FTP_USER = os.getenv("FTP_USER", "")
FTP_PASSWORD = os.getenv("FTP_PASSWORD", "")
BASE = Path(__file__).parent          # work/scripts/
ROOT = BASE.parent.parent             # racine du projet
WORK = BASE.parent                    # work/  — source de vérité (git)
DEPLOY = ROOT / "public_html"         # miroir local du FTP

archive_before_deploy()

ftp = ftplib.FTP()
ftp.connect(FTP_HOST, 21, timeout=30)
ftp.login(FTP_USER, FTP_PASSWORD)
ftp.set_pasv(True)

# Ajouter ici les fichiers à uploader :
#   (chemin Path source dans work/, chemin distant string)
files = [
    (WORK / "assets" / "styles.css", "/public_html/assets/styles.css"),
    (WORK / "assets" / "app.js",     "/public_html/assets/app.js"),
    (WORK / "index.html",            "/public_html/index.html"),
]

for local, remote in files:
    size = local.stat().st_size
    with open(local, "rb") as f:
        ftp.storbinary(f"STOR {remote}", f)
    # Mise à jour du miroir local
    rel = Path(remote.lstrip("/")).relative_to("public_html")
    mirror = DEPLOY / rel
    mirror.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(local), str(mirror))
    print(f"OK  {remote} ({size//1024} KB)")

ftp.quit()
print("Done.")
