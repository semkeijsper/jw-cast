import type { TutorialStep } from '~/types';

/**
 * On-site tutorial content shown in TutorialDialog, keyed by locale with an
 * `en` fallback (mirrors whatsappChannels). Add a locale block to translate
 * the walkthrough into a new language.
 */
export const tutorialSteps: Record<string, TutorialStep[]> = {
  nl: [
    {
      icon: 'mdi-translate',
      title: 'Kies je talen',
      body: 'Selecteer bovenaan de audiotaal en de ondertiteltaal los van elkaar. Zo kun je een video in de ene taal beluisteren en in een andere taal meelezen.',
    },
    {
      icon: 'mdi-play-circle-outline',
      title: 'Bekijk de video',
      body: 'Klik op een video om de speler te openen. Wissel gerust van taal terwijl je kijkt — je positie blijft behouden. Open het transcript om mee te lezen en naar een zin te springen.',
    },
    {
      icon: 'mdi-cast',
      title: 'Cast naar je tv',
      body: 'Met een Chromecast in de buurt verschijnt de castknop. Stream de video rechtstreeks naar je tv; de bediening staat onderin in de castbalk.',
    },
    {
      icon: 'mdi-download',
      title: 'Download of open op jw.org',
      body: 'Via het downloadmenu haal je de videobestanden of ondertitels op, of open je de video rechtstreeks op jw.org.',
    },
  ],
  en: [
    {
      icon: 'mdi-translate',
      title: 'Pick your languages',
      body: 'At the top, choose the audio language and the subtitle language independently. Listen in one language while reading along in another.',
    },
    {
      icon: 'mdi-play-circle-outline',
      title: 'Watch the video',
      body: 'Click a video to open the player. Switch languages while watching — your position is kept. Open the transcript to read along and jump to any line.',
    },
    {
      icon: 'mdi-cast',
      title: 'Cast to your TV',
      body: 'With a Chromecast nearby the cast button appears. Stream the video straight to your TV; the controls live in the cast bar at the bottom.',
    },
    {
      icon: 'mdi-download',
      title: 'Download or open on jw.org',
      body: 'Use the download menu to grab the video files or subtitles, or open the video directly on jw.org.',
    },
  ],
};
