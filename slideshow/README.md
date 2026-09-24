# Foto-Slideshow

Eine kleine, kostenlos hostbare Slideshow-Webseite aus mehreren Seiten
(Bild + Text). Reines HTML/CSS/JS ohne Build-Tool, damit du selbst leicht
weiter anpassen kannst.

## Neue Seite hinzufügen

1. Neuen Ordner unter `pages/` anlegen. Der Ordnername bestimmt die
   Reihenfolge der Seiten in der Slideshow, z. B. `04-nächster-ausflug`
   (numerisches Präfix + kurzer Name).
2. Bilder in den Ordner legen (beliebige Dateinamen, kein Umbenennen nötig).
3. Eine `page.json` im Ordner anlegen. Kopiervorlagen für die drei
   verfügbaren Layouts:

   **Ein großes Bild (`single`):**
   ```json
   {
     "title": "Mein Titel",
     "text": "Mein Text zu diesem Bild.",
     "layout": "single",
     "images": ["mein-bild.jpg"]
   }
   ```

   **Mehrere Bilder im Raster (`grid`):**
   ```json
   {
     "title": "Mein Titel",
     "text": "Mein Text zu diesen Bildern.",
     "layout": "grid",
     "images": ["bild1.jpg", "bild2.jpg", "bild3.jpg"]
   }
   ```

   **Mehrere Bilder als Mini-Karussell (`carousel`):**
   ```json
   {
     "title": "Mein Titel",
     "text": "Mein Text zu diesen Bildern.",
     "layout": "carousel",
     "images": ["bild1.jpg", "bild2.jpg", "bild3.jpg"]
   }
   ```

   Die Reihenfolge der Bilder auf der Seite entspricht der Reihenfolge im
   `images`-Array — hier kannst du frei sortieren.

4. Den neuen Ordnernamen in `pages.json` (im `slideshow/`-Root) ergänzen,
   an der gewünschten Stelle in der Liste:
   ```json
   ["01-beispiel", "02-beispiel-mehrere-bilder", "03-beispiel-grid", "04-nächster-ausflug"]
   ```
   Das ist nötig, weil GitHub Pages eine rein statische Webseite ausliefert
   und Ordner nicht automatisch zur Laufzeit auflisten kann.
5. Änderungen committen und pushen. Der GitHub-Actions-Workflow deployt die
   Seite dann automatisch neu.

Ein unbekannter oder fehlender `layout`-Wert blockiert die Slideshow nicht:
die Seite fällt automatisch auf ein sinnvolles Standard-Layout zurück.

## Lokal testen

Im `slideshow/`-Ordner:

```bash
python3 -m http.server
```

Dann `http://localhost:8000` im Browser öffnen.

## GitHub Pages aktivieren (einmalig)

1. Im Repository auf GitHub: **Settings → Pages**.
2. Unter **Source** die Option **GitHub Actions** wählen.
3. Nach dem nächsten Push auf den `main`-Branch (im Pfad `slideshow/`)
   deployt der Workflow `.github/workflows/deploy-slideshow.yml`
   automatisch. Die Live-URL wird danach unter **Settings → Pages**
   angezeigt.

**Alternative:** Falls GitHub Pages Probleme macht, kann der Ordner
`slideshow/` auch einfach per Drag & Drop bei
[Netlify Drop](https://app.netlify.com/drop) hochgeladen werden — ebenfalls
kostenlos, ohne Repo-Anbindung.

## Zugriffsschutz — wichtige Einschränkung

GitHub Pages liefert die Seite immer über eine öffentlich erreichbare URL
aus. Ein echtes Login ist auf diesem kostenlosen Weg nicht möglich. Diese
Slideshow kombiniert deshalb zwei einfache Maßnahmen:

- **Unlistete URL:** Die Adresse der Seite wird nirgendwo öffentlich
  verlinkt oder beworben — nur wer den Link direkt von dir bekommt, findet
  die Seite.
- **Einfaches Passwort:** Beim Öffnen erscheint eine Passwortabfrage
  (siehe `SITE_PASSWORD` in `script.js`).

**Das ist kein echter Sicherheitsmechanismus.** Das Passwort steht im
Klartext im JavaScript-Code und die Bilder liegen technisch trotzdem
öffentlich unter der Pages-URL (z. B. direkt über den Bildlink erreichbar,
auch ohne Passwort). Diese Lösung hält nur Gelegenheitsbesucher ab. Lade
hier keine Inhalte hoch, bei denen ein wirklicher Schutz nötig wäre.

Das Passwort änderst du in `script.js` ganz oben in der Konstante:

```js
const SITE_PASSWORD = 'dein-neues-passwort';
```

**Falls doch ein echter Login nötig wird:** Als Alternative zu GitHub
Pages könnte die Seite z. B. über Cloudflare Pages + Cloudflare Access
gehostet werden (kostenlos für wenige Nutzer/E-Mail-Adressen), was ein
echtes Login ermöglicht — das erfordert aber mehr Setup außerhalb dieses
Repos.

## Komponentenbibliothek

Diese Slideshow nutzt [Materialize CSS](https://materializecss.com/) per
CDN für einen schnell professionellen Material-Design-Look (Karten,
Buttons, Icons, Ripple-Effekt), kombiniert mit eigenem CSS in `style.css`,
das du gezielt anpassen kannst (Farben, Abstände, Schriftgrößen), ohne die
Materialize-Basis zu verlieren.

**Alternative für später:** Googles offizielle
[Material Web Components](https://github.com/material-components/material-web)
(`@material/web`) wären eine modernere, offizielle Option — dort kommen die
Komponenten aber als Web Components mit Shadow DOM, was eigene
CSS-Anpassungen deutlich erschwert. Deshalb aktuell nicht als Standard
gewählt.
