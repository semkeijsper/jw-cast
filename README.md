## JW Cast

### https://semkeijsper.github.io/jw-cast

---

Deze site haalt videos op van [jw.org](https://jw.org) en maakt het mogelijk om twee verschillende talen te kiezen voor video en ondertitels. Je kan dus bijvoorbeeld het congres in het Engels bekijken met Nederlandse ondertiteling!

# Handleiding

1. Klik op het filmpje wat je wilt kijken
    - De beschikbaarheid van filmpjes hangt af van welke taal je hebt geselecteerd
2. Kies de taal van de audio bij het luidspreker-icoontje
3. Kies de taal van de ondertiteling bij het ondertiteling-icoontje.
    - Let op: sommige talen hebben geen ondertiteling!

Je hebt nu twee opties: gebruik een [Chromecast](https://store.google.com/product/chromecast?hl=nl) of [VLC Media Player](https://www.videolan.org/vlc/):

#### **Met een Chromecast**:

4. Klik op `Afspelen` en kies de gewenste kwaliteit
5. Een nieuw tabblad wordt geopend. Deze site heet SMPlayer, en maakt het mogelijk om de video naar je Chromecast te streamen
6. Klik op `Connect to Chromecast`, en daarna op `Play on Chromecast`

#### **Met VLC Media Player**:

4. Klik op de downloadknop voor `Video` en kies de gewenste kwaliteit
5. Klik op de downloadknop voor `Ondertitels`
6. Open de gedownloade video (.mp4 bestand) met VLC Media Player
7. In VLC, rechtsklik op de video: Ondertitels > Ondertitelbestand toevoegen
8. Selecteer het ondertitelbestand wat je hebt gedownload (.vtt bestand), en klik op openen
9. De video speelt nu af met de gekozen ondertiteling

---

#### **Wat is het verschil tussen Chromecast en VLC?**

1. Met een Chromecast stream je direct van jw.org. Je hoeft een video dus niet eerst te downloaden, wat wel het geval is met de VLC methode.
2. Een Chromecast is aangesloten op een TV en kan direct een video daarop weergeven. Met VLC Media Player moet je een laptop verbinden via bijvoorbeeld een HDMI kabel om het op de TV te kijken.
3. Een Chromecast kost 30-40 euro, VLC is gratis en vereist alleen een laptop (en eventueel een HDMI kabel)

---

## Technische informatie

Alle data (beschikbare videos, afbeeldingen, mp4/vtt links) worden rechtstreeks van de jw.org API gehaald. Deze site is puur een interface om de data op een bruikbare manier te presenteren. Er wordt niks aan aangepast of veranderd.

Als je de site zelf wilt bouwen, doe je dat zo:

```
git clone https://github.com/semkeijsper/jw-cast.git
cd jw-cast
yarn install
yarn build
```

Wil je de site op localhost starten, gebruik dan `yarn serve` in plaats van `yarn build`.
