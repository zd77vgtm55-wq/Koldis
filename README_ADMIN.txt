KOLDIS 0.9.6 – ADMIN + FEEDBACK

1. Die drei bisherigen Dateien (index.html, app.js, style.css) durch diese Version ersetzen.
2. Zusätzlich admin.html, admin.js und admin.css in den gleichen GitHub-Pages-Ordner hochladen.
3. In Supabase -> SQL Editor die Datei koldis_admin_setup.sql komplett ausführen.
4. Ganz unten in der SQL-Datei die kommentierte Admin-Zeile verwenden und DEINE EMAIL durch die E-Mail deines eigenen KOLDIS-Kontos ersetzen:
   insert into public.koldis_admins(user_id)
   select id from auth.users where email = 'DEINE EMAIL' on conflict do nothing;
   Diese E-Mail nur direkt in Supabase eingeben – nicht öffentlich teilen.
5. Danach Admin öffnen:
   https://zd77vgtm55-wq.github.io/admin.html

Sicherheit:
- Kein Service-Role-Key im Browser.
- Der Adminbereich verlangt eine Supabase-Anmeldung.
- Zusätzlich muss die Benutzer-ID in koldis_admins stehen.
- Die RLS-Policies schützen die Daten serverseitig.

Hinweis:
Das Dashboard zeigt Nutzungsdaten, sobald KOLDIS Events schreibt. Die Version enthält dafür bereits Tracking für App-Start, Navigation, Rezeptöffnung, automatischen Wochenplan, Einkaufsliste und eigene Einkaufsartikel.
