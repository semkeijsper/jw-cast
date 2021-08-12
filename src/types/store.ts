/* eslint-disable no-use-before-define */
import { Language } from '.';

export interface State {
  baseUrl: string;
  languages: Language[];
  translations: { [key: string]: string };
  siteLanguage: string;
  videoLanguage: string;
  subtitleLanguage: string;
  videoDialog: boolean;
  selectedVideo: string | null;
}
