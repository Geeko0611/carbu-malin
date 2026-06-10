"""
Carbu-Malin — Mise à jour quotidienne des données + déploiement FTP
Lancé automatiquement par le Planificateur de tâches Windows chaque matin.
"""
import subprocess, sys, os, ftplib, logging, shutil
from datetime import datetime, timedelta
from pathlib import Path

BASE = Path(__file__).parent          # work/scripts/
ROOT = BASE.parent.parent             # racine du projet
WORK = BASE.parent                    # work/  — source de vérité (git)
DEPLOY = ROOT / "public_html"         # miroir local du FTP (pour archivage)
SCRIPTS = BASE                        # work/scripts/
VERSIONS_DIR = ROOT / "public_html_versions"
PYTHON = sys.executable

FTP_HOST = os.getenv("FTP_HOST", "")
FTP_USER = os.getenv("FTP_USER", "")
FTP_PASSWORD = os.getenv("FTP_PASSWORD", "")
REMOTE_ROOT = os.getenv("FTP_REMOTE_PATH", "/public_html")

MAX_SIZE = 10 * 1024 * 1024

logging.basicConfig(
    filename=BASE / "update_and_deploy.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger()


def _files_changed_since(src: Path, ref: Path) -> bool:
    """Return True if any file in src differs (mtime or size) vs ref."""
    for f in sorted(src.rglob("*")):
        if f.is_dir():
            continue
        rel = f.relative_to(src)
        ref_f = ref / rel
        if not ref_f.exists():
            return True
        if f.stat().st_mtime > ref_f.stat().st_mtime + 1:
            return True
        if f.stat().st_size != ref_f.stat().st_size:
            return True
    return False


def archive_before_deploy():
    """Archive public_html/ → public_html_versions/AAAA-MM-JJ_HHmm/ (brief §Versioning)."""
    VERSIONS_DIR.mkdir(exist_ok=True)
    existing = sorted(
        [d for d in VERSIONS_DIR.iterdir() if d.is_dir()],
        key=lambda d: d.name
    )

    if existing and not _files_changed_since(DEPLOY, existing[-1]):
        log.info("ARCHIVE skip: aucun changement depuis %s", existing[-1].name)
        return

    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    dest = VERSIONS_DIR / timestamp
    if dest.exists():
        log.info("ARCHIVE skip: %s existe déjà", timestamp)
        return

    shutil.copytree(
        str(DEPLOY), str(dest),
        ignore=shutil.ignore_patterns("*.log", "__pycache__", "*.pyc")
    )
    log.info("ARCHIVE créée: %s", dest.name)

    cutoff = datetime.now() - timedelta(days=7)
    recent = [d for d in existing if datetime.strptime(d.name, "%Y-%m-%d_%H%M") > cutoff]
    if len(recent) >= 10:
        old = [d for d in existing if datetime.strptime(d.name, "%Y-%m-%d_%H%M") <= cutoff]
        for d in old:
            shutil.rmtree(d)
            log.info("ARCHIVE supprimée (>7j): %s", d.name)


def run_build():
    log.info("== Génération des données ==")
    result = subprocess.run(
        [PYTHON, str(SCRIPTS / "build_data.py"),
         "--source", "instant",
         "--output", str(WORK / "data"),
         "--history-start-year", "2025"],
        capture_output=True, text=True, cwd=str(SCRIPTS)
    )
    if result.returncode != 0:
        log.error("build_data.py a échoué:\n%s", result.stderr)
        raise RuntimeError("build_data.py failed")
    log.info("build_data.py OK\n%s", result.stdout[-500:])


def ftp_upload():
    log.info("== Déploiement FTP ==")
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, 21, timeout=60)
    ftp.login(FTP_USER, FTP_PASSWORD)
    ftp.set_pasv(True)

    data_dir = WORK / "data"
    uploaded = 0
    for f in sorted(data_dir.iterdir()):
        if f.stat().st_size > MAX_SIZE:
            log.info("SKP %s (%.0f MB)", f.name, f.stat().st_size / 1e6)
            continue
        remote = f"{REMOTE_ROOT}/data/{f.name}"
        with open(f, "rb") as fh:
            ftp.storbinary(f"STOR {remote}", fh)
        log.info("OK  %s (%.0f KB)", f.name, f.stat().st_size / 1024)
        uploaded += 1

    ftp.quit()
    log.info("FTP terminé : %d fichiers", uploaded)


def sync_mirror():
    """Synchronise work/data/ → public_html/data/ (maintient le miroir FTP local)."""
    src = WORK / "data"
    dst = DEPLOY / "data"
    dst.mkdir(exist_ok=True)
    for f in src.iterdir():
        if f.is_file():
            shutil.copy2(str(f), str(dst / f.name))
    log.info("MIRROR data/ synchronisé → public_html/data/")


if __name__ == "__main__":
    try:
        run_build()
        archive_before_deploy()
        ftp_upload()
        sync_mirror()
        log.info("== Mise à jour terminée ==")
    except Exception as exc:
        log.exception("ERREUR : %s", exc)
        sys.exit(1)
