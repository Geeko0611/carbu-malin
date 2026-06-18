#!/bin/sh
# Carbu-Malin - build quotidien des donnees + publication atomique (cron Hostinger mutualise)
# Lance par hPanel > Taches Cron. Ecrit dans un staging puis ne publie que si succes.
BASE=/home/u266672782/domains/carbu-malin.fr/public_html
PY=/opt/alt/python311/bin/python3
LOG="$BASE/scripts/build_cron.log"

cd "$BASE/scripts" || exit 1

"$PY" build_data.py --source instant --output "$BASE/data_build" --history-start-year 2025
STATUS=$?

if [ "$STATUS" -eq 0 ]; then
    cp -f "$BASE"/data_build/*.json "$BASE"/data/
    echo "$(date '+%Y-%m-%d %H:%M:%S') BUILD OK - donnees publiees" >> "$LOG"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') BUILD ECHEC code=$STATUS - donnees inchangees" >> "$LOG"
fi
