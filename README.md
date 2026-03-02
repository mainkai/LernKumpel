# 🎒 LernKumpel

Willkommen im LernKumpel Repository! Dies ist eine Sammlung von motivierenden, spielerischen Lern-Apps für Grundschulkinder. Die Apps sind so gestaltet, dass sie direkt im Browser laufen, kinderleicht zu bedienen sind und durch Gamification (Münzen, Sticker, Themes) den Spaß am Lernen fördern.

👉 **[Hier geht's zur Live-Version!](https://mainkai.github.io/LernKumpel/)**

## 🦁 Aktuelle Apps im LernKumpel-Universum

### 1. Zahlen-Safari (Mathe-App)

👉 **[Zahlen-Safari spielen](https://mainkai.github.io/LernKumpel/zahlen-safari/)**

Die Zahlen-Safari hilft Kindern, spielerisch Kopfrechnen zu üben.

**Features:**

- 🎓 **Altersgerechte Level:** Von Kindergarten (nur Plus bis 10) bis zur 4. Klasse (große Zahlen, Division).
- 🧩 **Lücken-Modus:** Fördert das algebraische Denken (z.B. 5 + _ = 12).
- 🪙 **Shop-System:** Richtige Antworten bringen Münzen. Damit können Kinder neue, liebevoll gestaltete Themes (Baustelle 🚧, Weltraum 🚀, Einhorn 🦄 etc.) freischalten.
- 🎁 **Stickerheft:** Besonders gute Runden werden mit zufälligen Sammel-Stickern belohnt.
- 👥 **Multi-User fähig:** Geschwister können sich ein Tablet teilen. Die App merkt sich alle Profile und Spielstände auf dem Gerät.
- 🏆 **Globale Bestenliste:** Echtzeit-Highscores pro Level und Spielmodus.

### 2. Lese-Fuchs (Vorlesen-App)

👉 **[Lese-Fuchs spielen](https://mainkai.github.io/LernKumpel/lese-fuchs/)**

Der Lese-Fuchs unterstützt Kinder dabei, Sätze laut vorzulesen und sicherer im Lesen zu werden.

**Features:**

- 🎤 **Vorlesen mit Mikrofon:** Kinder lesen Sätze laut vor, die App erkennt den gesprochenen Text.
- ✅ **Fehlertolerante Prüfung:** Kleine Versprecher werden durch fuzzy matching verziehen.
- ⭐ **Punktesystem:** Für korrekt vorgelesene Sätze gibt es Punkte.
- 🪙 **Gemeinsames Münzsystem:** Dieselben Profile und Münzen wie in der Zahlen-Safari.

### 3. Mal-Atelier (Malen + KI)

👉 **[Mal-Atelier spielen](https://mainkai.github.io/LernKumpel/mal-atelier/)**

Das Mal-Atelier verbindet freies Zeichnen mit kindgerechter KI-Unterstützung.

**Features:**

- 🎨 **Einfaches Zeichnen:** Fokus auf wenige Werkzeuge (Farbe + Strichdicke).
- 🧠 **KI-Bewertung:** Die KI bewertet auf einer Skala von 0–100%, wie gut die Zeichnung zur Aufgabe passt.
- 🪙 **Gemeinsames Profilsystem:** Dieselben Profile und Münzen wie in Zahlen-Safari und Lese-Fuchs.
- ✨ **KI-Zauberbild:** Gegen Münz-Einsatz wird aus der Kinderzeichnung ein KI-Bild (Image-Edit) erzeugt.

### 4. Pose-Theater (Bewegung + Kamera)

👉 **[Pose-Theater spielen](https://mainkai.github.io/LernKumpel/pose-theater/)**

Im Pose-Theater machen Kinder pantomimische Bewegungs-Posen nach, die über die Kamera erkannt und bewertet werden.

**Features:**

- 🎭 **Pose nachmachen:** Jede Runde zeigt eine Ziel-Pose (z.B. Arme hoch, Stern, Hocke).
- 📷 **Kamera + Bilderkennung:** Die Körperhaltung wird in Echtzeit über Pose-Erkennung ausgewertet.
- ⭐ **Punktesystem:** Die Übereinstimmung zur Ziel-Pose bestimmt die Punkte.
- 🪙 **Gemeinsames Münzsystem:** Dieselben Profile und Münzen wie in den anderen LernKumpel-Apps.

## 🚀 Geplante Apps (Roadmap)

- Weitere Lern-Abenteuer folgen.

Das Besondere: Dank der geteilten Datenbank können erspielte Münzen und Profile aus der Zahlen-Safari nahtlos auch in zukünftigen Apps genutzt werden!

## 💻 Tech-Stack & Architektur

Dieses Projekt ist extrem leichtgewichtig und auf minimalen Wartungsaufwand ausgelegt. Es benötigt keinen komplexen Build-Prozess (wie Node.js oder Webpack) und kann direkt über GitHub Pages gehostet werden.

- **Frontend:** React 18 & ReactDOM (via CDN eingebunden), Babel Standalone (für JSX im Browser).
- **Styling:** Tailwind CSS (via CDN).
- **Backend & Datenbank:** Firebase (Firestore für Highscores und Profile, Anonymous Auth für unsichtbaren Login).
- **Icons:** Inline-SVGs (Lucide React inspiriert) für absolute Unabhängigkeit von externen Font-Bibliotheken.

## 📂 Ordnerstruktur

Um das "Geteilte Universum" auf GitHub Pages optimal abzubilden, ist das Repo wie folgt strukturiert:

```text
LernKumpel/
├── index.html               # Hauptmenü (Hub)
├── zahlen-safari/
│   └── index.html           # Mathe-App
├── lese-fuchs/
│   └── index.html           # Vorlesen-App
├── mal-atelier/
│   └── index.html           # Malen + KI
└── pose-theater/
    └── index.html           # Posen + Kamera-Pose-Erkennung
```

## 🛠️ Lokale Entwicklung / Setup

Jeder kann dieses Projekt klonen und sofort lokal ausführen, ohne etwas installieren zu müssen!

1. **Repository klonen:**

   ```bash
   git clone https://github.com/mainkai/LernKumpel.git
   ```

2. Ordner im Code-Editor (z.B. VS Code) öffnen.
3. Die Datei `zahlen-safari/index.html` z.B. mit der Erweiterung "Live Server" öffnen.
4. Fertig! Die App läuft im Browser.

## 🔑 Eigene Firebase-Datenbank einbinden

Wenn du einen Fork (eine eigene Kopie) dieses Repositories erstellst, erstelle ein eigenes Firebase-Projekt und tausche in der `index.html` das `firebaseConfig`-Objekt gegen deine eigenen API-Keys aus:

```javascript
const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "dein-projekt.firebaseapp.com",
  projectId: "dein-projekt",
  storageBucket: "dein-projekt.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**Wichtig:** Stelle sicher, dass in Firebase Firestore sowie Anonymous Authentication aktiviert sind!

Viel Spaß beim Lernen und Rechnen! 🎒✨
