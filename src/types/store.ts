/* eslint-disable no-use-before-define */
import { Language, Video } from '.';

export interface State {
  mediatorUrl: string;
  searchUrl: string;
  tokenUrl: string;
  languages: Language[];
  translations: { [key: string]: string };
  siteLanguage: string;
  videoLanguage: string;
  subtitleLanguage: string;
  searchDialog: boolean;
  videoDialog: boolean;
  transcriptDialog: boolean;
  selectedVideo: string | null;
  subtitleMedia: Video | null;
}
