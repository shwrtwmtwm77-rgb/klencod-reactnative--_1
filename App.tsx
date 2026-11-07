#!/system/bin/sh
# FFON - all-in-one Free Fire aim profile activation
# run: sh /sdcard/FFTOOL/on.sh          (preview: DRY=1 sh ...)
R=/sdcard/FFTOOL; L=$R/fftool.log
PKG=com.dts.freefireth
PREFS=/data/data/$PKG/shared_prefs/com.dts.freefireth_preferences.xml
DDIR=/sdcard/Android/data/$PKG/files
DRY=${DRY:-0}

mkdir -p "$R/conf" "$R/backup"
log(){ echo "[$(date +%H:%M:%S)] $*" >>"$L"; }
[ -f "$L" ] && [ "$(wc -l <"$L")" -gt 400 ] && tail -n 150 "$L" >"$L.t" && mv "$L.t" "$L"

u=$(id -u 2>/dev/null)
case "$u" in 0) MODE=root ;; 2000) MODE=shizuku ;; *) MODE=limited ;; esac
running(){ pidof "$PKG" >/dev/null 2>&1 || ps -A 2>/dev/null | grep -q "$PKG"; }
dget(){ d=$(dumpsys window displays 2>/dev/null | grep -oE 'density [0-9]+' | head -n1 | awk '{print $2}')
        [ -z "$d" ] && d=$(wm density 2>/dev/null | grep -oE '[0-9]+$' | tail -n1); echo "${d:-0}"; }
dset(){ if command -v wm >/dev/null 2>&1; then wm density "$1"; else settings put secure display_density_forced "$1"; fi; }
cl(){ [ "$1" -lt "$2" ] && echo "$2" || { [ "$1" -gt "$3" ] && echo "$3" || echo "$1"; }; }
save(){ [ -f "$R/backup/$1" ] || printf '%s' "$2" > "$R/backup/$1"; }

# ---------- self-config ----------
C=$R/conf/aim.conf
[ -f "$C" ] || cat > "$C" <<'X'
BASE=50
SCALE=85
OPT_INPUT=1
OPT_DEVICE=1
OPT_SYSTEM=1
X
. "$C"

T=$R/conf/knobs.tbl
[ -f "$T" ] || cat > "$T" <<'X'
general|int|100|0|200|Sensitivity_General;GeneralSensitivity;SensitivityGeneral
reddot|int|100|0|200|Sensitivity_RedDot;RedDotSensitivity;Sensitivity_RedDot_
x2|int|100|0|200|Sensitivity_2xScope;Sensitivity_2x;2xSensitivity
x4|int|78|0|200|Sensitivity_4xScope;Sensitivity_4x;4xSensitivity
sniper|int|78|0|200|Sensitivity_SniperScope;Sensitivity_Sniper;SniperSensitivity
freelook|int|78|0|200|Sensitivity_FreeLook;FreeLookSensitivity
gyro|int|100|0|200|Sensitivity_Gyro;GyroSensitivity
drag|int|90|0|200|DragSpeed;Sensitivity_Drag;Drag
tracking|int|95|0|200|Tracking;AimTracking;Sensitivity_Tracking
scope|int|85|0|200|ScopeSpeed;Sensitivity_Scope
firebtn|int|120|40|160|FireButtonSize;FireBtnSize;BtnFireSize
hud|int|100|60|140|HudScale;HUDScale;Hud_Scale
aimassist|bool|0|0|0|AimAssist;Aim_Assist;aimassist
precision|bool|0|0|0|AimPrecision;PreciseOnScope;Aim_Precision
quick|bool|0|0|0|QuickWeaponSwitch;FastSwitch
autofire|bool|0|0|0|FireMode;AutoFire
X

log "== on.sh mode=$MODE base=$BASE dry=$DRY =="
running && { am force-stop "$PKG" 2>/dev/null; sleep 1; }

# ---------- 1 input latency ----------
if [ "$OPT_INPUT" = 1 ]; then
  save pointer.speed "$(settings get system pointer_speed 2>/dev/null)"
  [ "$DRY" = 0 ] && settings put system pointer_speed 7
  for k in window_animation_scale transition_animation_scale animator_duration_scale; do
    save "$k.orig" "$(settings get global $k 2>/dev/null)"
    [ "$DRY" = 0 ] && settings put global $k 0.5
  done
  log "input ok"
fi

# ---------- 2 display ----------
O=$R/backup/density.orig
[ -f "$O" ] || dget > "$O"
ORIG=$(cat "$O" 2>/dev/null); case "$ORIG" in ''|*[!0-9]*) ORIG=0 ;; esac
if [ "$ORIG" -gt 0 ]; then
  NEW=$(cl $((ORIG * SCALE / 100)) 320 640)
  [ "$DRY" = 0 ] && dset "$NEW" && log "density $ORIG->$NEW"
else log "density skip"; fi

# ---------- 3 device profile ----------
if [ "$OPT_DEVICE" = 1 ] && [ -f "$R/conf/device.high.xml" ] && [ -d "$DDIR" ]; then
  save device.orig.xml "$(cat "$DDIR/device.xml" 2>/dev/null)"
  [ "$DRY" = 0 ] && cp -f "$R/conf/device.high.xml" "$DDIR/device.xml" && log "device ok"
else log "device skip"; fi

# ---------- 4 system perf ----------
if [ "$OPT_SYSTEM" = 1 ] && [ "$MODE" = root ]; then
  for f in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
    [ -f "$f" ] || continue
    save "gov.$(basename "$(dirname "$(dirname "$f")")")" "$(cat "$f")"
    [ "$DRY" = 0 ] && echo performance > "$f" 2>/dev/null
  done
  [ "$DRY" = 0 ] && { cmd game set --mode performance --package "$PKG" 2>/dev/null || cmd game mode performance "$PKG" 2>/dev/null; }
  log "system ok"
else log "system skip"; fi

# ---------- 5 game knobs ----------
OK=0; MISS=0
if [ "$MODE" = root ] && [ -f "$PREFS" ]; then
  save prefs.orig.xml "$(cat "$PREFS")"
  W=$PREFS.fftool.tmp; cp -f "$PREFS" "$W" || exit 1
  K=$(grep -oE 'name="[^"]+"' "$W" | sed 's/^name="//; s/"$//')
  res(){ for c in $(echo "$1" | tr ';' ' '); do h=$(echo "$K" | grep -ixE "$c" | head -n1)
           [ -n "$h" ] && { echo "$h"; return; }; done; }
  setv(){ if grep -q "name=\"$1\" value=\"" "$W"
          then sed -i "s|name=\"$1\" value=\"[^\"]*\"|name=\"$1\" value=\"$2\"|" "$W"
          else sed -i "s|\(<string name=\"$1\">\)[^<]*|\1$2|" "$W"; fi; }
  while IFS='|' read -r id typ w lo hi cand; do
    case "$id" in ''|'#'*) continue ;; esac
    k=$(res "$cand")
    if [ -z "$k" ]; then MISS=$((MISS+1)); log "skip $id"; continue; fi
    if [ "$typ" = bool ]; then v=true; else v=$(cl $((BASE * w * 2 / 100)) "$lo" "$hi"); fi
    setv "$k" "$v"; OK=$((OK+1)); log "set $id=$v"
  done < "$T"
  if [ "$DRY" = 0 ]; then
    chown "$(stat -c %u:%g /data/data/$PKG/shared_prefs)" "$W" 2>/dev/null
    chmod 660 "$W" 2>/dev/null; mv -f "$W" "$PREFS"; sync
  else rm -f "$W"; fi
  log "knobs ok=$OK miss=$MISS"
else log "knobs skip (no root or no prefs)"; fi

echo "== FFON =="
echo "mode=$MODE  knobs=$OK  skipped=$MISS  dry=$DRY"
[ "$DRY" = 0 ] && echo "log: $L"
exit 0