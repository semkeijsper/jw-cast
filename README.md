## JW Cast

### https://jwcast.semdev.nl

---

Deze site haalt videos op van [jw.org](https://jw.org) en maakt het mogelijk om twee verschillende talen te kiezen voor video en ondertitels. Je kan dus bijvoorbeeld de Broadcasting in het Engels bekijken met Nederlandse ondertiteling!

# Handleiding

1. Klik op de video die je wilt kijken
   - De beschikbaarheid van videos hangt af van welke taal je hebt geselecteerd
   - Via de knop `Zoeken` kan je elke video vinden die op jw.org staat
2. Kies de taal van de audio bij het luidspreker-icoontje
3. Kies de taal van de ondertiteling bij het ondertiteling-icoontje.
   - Let op: sommige videos of talen hebben geen ondertiteling!

Je hebt nu twee opties: gebruik een [Chromecast](https://store.google.com/product/chromecast?hl=nl) of [VLC Media Player](https://www.videolan.org/vlc/):

#### **Met een Chromecast**:

4. Klik op `Afspelen` en kies de gewenste kwaliteit
5. Een nieuw tabblad wordt geopend. Deze site heet SMPlayer, en maakt het mogelijk om de video naar je Chromecast te streamen
6. Klik op `Connect to Chromecast`, en daarna op `Play on Chromecast`

#### **Met VLC Media Player**:

4. Klik op de downloadknop voor `Video` en kies de gewenste kwaliteit
5. Klik op de downloadknop voor `Ondertitels` en daarna op `Downloaden`
6. Open de gedownloade video (.mp4 bestand) met VLC Media Player
7. In VLC, klik bovenaan op `Ondertitels`, en dan op `Ondertitelbestand toevoegen...`
8. Selecteer het ondertitelbestand wat je hebt gedownload (.vtt bestand), en klik op openen
9. De video speelt nu af met de gekozen ondertiteling

---

#### **Wat is het verschil tussen Chromecast en VLC?**

- Met een Chromecast stream je direct van jw.org. Je hoeft een video dus niet eerst te downloaden, wat wel het geval is met de VLC methode.
- Een Chromecast is aangesloten op een TV en kan direct een video daarop weergeven. Met VLC Media Player moet je een laptop verbinden via bijvoorbeeld een HDMI kabel om het op de TV te kijken.
- Een Chromecast kost 30-40 euro, VLC is gratis en vereist alleen een laptop (en eventueel een HDMI kabel)

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

De site is gehost op GitHub Pages, de bestanden zijn te vinden in de branch `gh-pages`.

Deployment gebeurd via een subtree d.m.v. `git subtree push --prefix dist origin gh-pages`.
