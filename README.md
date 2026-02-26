🎒 LernKumpel

Willkommen im LernKumpel Repository! Dies ist eine Sammlung von motivierenden, spielerischen Lern-Apps für Grundschulkinder. Die Apps sind so gestaltet, dass sie direkt im Browser laufen, kinderleicht zu bedienen sind und durch Gamification (Münzen, Sticker, Themes) den Spaß am Lernen fördern.

👉 Hier geht's zur Live-Version!

🦁 Aktuelle Apps im LernKumpel-Universum

1. Zahlen-Safari (Mathe-App)

👉 Zahlen-Safari spielen: https://mainkai.github.io/LernKumpel/zahlen-safari/

Die Zahlen-Safari hilft Kindern, spielerisch Kopfrechnen zu üben.

Features:

🎓 Altersgerechte Level: Von Kindergarten (nur Plus bis 10) bis zur 4. Klasse (große Zahlen, Division).

🧩 Lücken-Modus: Fördert das algebraische Denken (z.B. 5 + _ = 12).

🪙 Shop-System: Richtige Antworten bringen Münzen. Damit können Kinder neue, liebevoll gestaltete Themes (Baustelle 🚧, Weltraum 🚀, Einhorn 🦄 etc.) freischalten.

🎁 Stickerheft: Besonders gute Runden werden mit zufälligen Sammel-Stickern belohnt.

👥 Multi-User fähig: Geschwister können sich ein Tablet teilen. Die App merkt sich alle Profile und Spielstände auf dem Gerät.

🏆 Globale Bestenliste: Echtzeit-Highscores pro Level und Spielmodus.

🚀 Geplante Apps (Roadmap)

📖 Lese-Abenteuer: Eine geplante App zur Leseförderung.

Das Besondere: Dank der geteilten Datenbank können erspielte Münzen und Profile aus der Zahlen-Safari nahtlos auch in zukünftigen Apps genutzt werden!

💻 Tech-Stack & Architektur

Dieses Projekt ist extrem leichtgewichtig und auf minimalen Wartungsaufwand ausgelegt. Es benötigt keinen komplexen Build-Prozess (wie Node.js oder Webpack) und kann direkt über GitHub Pages gehostet werden.

Frontend: React 18 & ReactDOM (via CDN eingebunden), Babel Standalone (für JSX im Browser).

Styling: Tailwind CSS (via CDN).

Backend & Datenbank: Firebase (Firestore für Highscores und Profile, Anonymous Auth für unsichtbaren Login).

Icons: Inline-SVGs (Lucide React inspiriert) für absolute Unabhängigkeit von externen Font-Bibliotheken.

📂 Ordnerstruktur

Um das "Geteilte Universum" auf GitHub Pages optimal abzubilden, ist das Repo wie folgt strukturiert:

LernKumpel/
 │
 ├── index.html              # Das zukünftige Hauptmenü (Hub)
 │
 ├── zahlen-safari/          # Die fertige Mathe-App
 │   └── index.html          # Single-File React App
 │
 └── lese-abenteuer/         # Geplante Lese-App
     └── index.html


🛠️ Lokale Entwicklung / Setup

Jeder kann dieses Projekt klonen und sofort lokal ausführen, ohne etwas installieren zu müssen!

Repository klonen:
git clone [https://github.com/mainkai/LernKumpel.git](https://github.com/mainkai/LernKumpel.git)


Ordner im Code-Editor (z.B. VS Code) öffnen.

Die Datei zahlen-safari/index.html z.B. mit der Erweiterung "Live Server" öffnen.

Fertig! Die App läuft im Browser.

🔑 Eigene Firebase-Datenbank einbinden

Wenn du einen Fork (eine eigene Kopie) dieses Repositories erstellst, erstelle ein eigenes Firebase-Projekt und tausche in der index.html das firebaseConfig-Objekt gegen deine eigenen API-Keys aus:

const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "dein-projekt.firebaseapp.com",
  projectId: "dein-projekt",
  storageBucket: "dein-projekt.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};


Wichtig: Stelle sicher, dass in Firebase Firestore sowie Anonymous Authentication aktiviert sind!

Viel Spaß beim Lernen und Rechnen! 🎒✨
