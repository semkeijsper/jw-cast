/* eslint-disable no-use-before-define */
import { Language } from '.';

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
  selectedVideo: string | null;
}
