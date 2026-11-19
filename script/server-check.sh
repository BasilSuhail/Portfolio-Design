#!/usr/bin/env bash
# Server health and security check for the VPS that runs Dokploy.
#
#   sudo bash server-check.sh            # read-only report, changes nothing
#   sudo bash server-check.sh --upgrade  # report, then install OS security updates
#
# The report never prints secrets. Nothing is deleted or removed in either mode.

set -u
UPGRADE=0
[ "${1:-}" = "--upgrade" ] && UPGRADE=1

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo so every check can read what it needs."
  exit 1
fi

section() { printf '\n==== %s ====\n' "$1"; }
SINCE="2026-11-13"   # one day before the hosting provider's reported incident

section "System"
. /etc/os-release 2>/dev/null && echo "OS: $PRETTY_NAME"
echo "Kernel: $(uname -r)"
uptime
[ -f /var/run/reboot-required ] && echo "REBOOT REQUIRED (pending kernel or library update)"

section "Pending updates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
UPG=$(apt list --upgradable 2>/dev/null | grep -c upgradable || true)
SEC=$(apt list --upgradable 2>/dev/null | grep -c -- '-security' || true)
echo "Upgradable packages: $UPG (security: $SEC)"
dpkg -s unattended-upgrades >/dev/null 2>&1 \
  && echo "unattended-upgrades: installed" \
  || echo "unattended-upgrades: NOT installed (no automatic security updates)"

section "SSH settings"
sshd -T 2>/dev/null | grep -Ei '^(port|permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|maxauthtries) '

section "Accounts that can log in"
awk -F: '$7 !~ /(nologin|false|sync)$/ {print $1" (uid "$3", shell "$7")"}' /etc/passwd
echo "UID 0 accounts: $(awk -F: '$3==0{print $1}' /etc/passwd | tr '\n' ' ')"

section "SSH keys allowed in (fingerprints only)"
for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do
  [ -f "$f" ] || continue
  echo "$f  (modified $(stat -c %y "$f" | cut -d. -f1))"
  ssh-keygen -lf "$f" 2>/dev/null | sed 's/^/   /'
done

section "Recent logins"
last -n 15 -a 2>/dev/null | head -n 15
echo
echo "Successful SSH logins since $SINCE:"
journalctl -u ssh -u sshd --since "$SINCE" --no-pager 2>/dev/null \
  | grep -E 'Accepted (publickey|password)' | awk '{print $1,$2,$3,$9,$11}' | sort | uniq -c | tail -n 20
echo "Failed SSH attempts since $SINCE: $(journalctl -u ssh -u sshd --since "$SINCE" --no-pager 2>/dev/null | grep -c 'Failed password' || true)"

section "Open ports (listening on all interfaces)"
ss -tulpnH 2>/dev/null | awk '$5 ~ /^(0\.0\.0\.0|\*|\[::\]):/ {print $1, $5, $7}' | sort -u

section "Firewall"
if command -v ufw >/dev/null; then ufw status verbose; else echo "ufw not installed"; fi
echo "Note: ports published by Docker skip ufw rules. Check them in the open ports list above."

section "Docker and Dokploy"
docker version --format 'Docker engine {{.Server.Version}}' 2>/dev/null
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null
docker service ls 2>/dev/null | head -n 20

section "Busy processes (miners show up here)"
ps -eo pid,user,%cpu,%mem,etime,comm --sort=-%cpu | head -n 10

section "Scheduled jobs"
for u in $(cut -d: -f1 /etc/passwd); do
  c=$(crontab -l -u "$u" 2>/dev/null | grep -v '^#' | grep -v '^$')
  [ -n "$c" ] && { echo "[$u]"; echo "$c"; }
done
ls -la /etc/cron.d 2>/dev/null
systemctl list-timers --no-pager 2>/dev/null | head -n 15

section "Files changed since $SINCE in system folders"
find /etc /usr/local/bin /usr/bin /usr/sbin /root /tmp /var/tmp /dev/shm \
  -xdev -type f -newermt "$SINCE" 2>/dev/null \
  | grep -vE '^/etc/(ssl/certs|ld.so.cache)|^/var/lib' | head -n 50
echo "Executable files in temp folders:"
find /tmp /var/tmp /dev/shm -xdev -type f -perm -u+x 2>/dev/null | head -n 20

if [ "$UPGRADE" -eq 1 ]; then
  section "Installing updates"
  apt-get -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold upgrade
  apt-get -y install unattended-upgrades
  dpkg-reconfigure -f noninteractive unattended-upgrades
  echo
  [ -f /var/run/reboot-required ] \
    && echo "Updates done. A reboot is needed: run 'sudo reboot' when a minute of downtime is fine." \
    || echo "Updates done. No reboot needed."
fi

printf '\nDone. Paste this whole report back for review.\n'
