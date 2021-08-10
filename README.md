## JW Cast
### https://semkeijsper.github.io/jw-cast

---

Deze site haalt videos op van jw.org en maakt het mogelijk om twee verschillende talen te kiezen voor video en ondertitels. Je kan dus bijvoorbeeld in het Engels het congres bekijken met Nederlandse ondertiteling!

# Handleiding

1. Klik op het filmpje wat je wilt kijken. De beschikbaarheid van filmpjes hangt af van welke taal je hebt geselecteerd
2. Kies de taal van de audio bij het luidspreker-icoontje
3. Kies de taal van de ondertiteling bij het ondertiteling-icoontje. Opmerking: Niet elke taal heeft ondertiteling beschikbaar!

Je hebt nu twee opties: gebruik een [Chromecast](https://store.google.com/product/chromecast?hl=nl) of [VLC Media Player](https://www.videolan.org/vlc/):

#### **Met een Chromecast**:

4. Klik op `Afspelen` en kies de gewenste kwaliteit
5. Een nieuwe pagina wordt geopend. Deze site heet SMPlayer, en maakt het mogelijk om de video naar je Chromecast te streamen. Klik op Connect to Chromecast, en daarna op Play on Chromecast

#### **Met VLC Media Player**:

4. Klik op de downloadknop voor `Video` en kies de gewenste kwaliteit
5. Klik op de downloadknop voor `Ondertitels`
6. Open de gedownloade video (.mp4 bestand) met VLC Media Player
7. In VLC, rechtsklik op de video: Ondertitels > Ondertitelbestand toevoegen
8. Selecteer het ondertitelbestand wat je hebt gedownload (.vtt bestand), en klik op openen
9. De video speelt nu af met de gekozen ondertiteling

---

## Technische informatie

Alle data (beschikbare videos, afbeeldingen, mp4/vtt links) wordt rechtstreeks van de jw.org API gehaald. Deze site is puur een interface om de data op een bruikbare manier te presenteren. Er wordt niks aan aangepast of veranderd.

Als je de site zelf wilt bouwen, doe je dat zo:
```
git clone https://github.com/semkeijsper/jw-cast.git
cd jw-cast
yarn install
yarn build
```

Wil je de site op localhost starten, gebruik dan `yarn serve` in plaats van `yarn build`.
