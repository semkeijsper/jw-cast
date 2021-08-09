/* eslint-disable no-use-before-define */
import { Category, Language } from '.';

export interface State {
  baseUrl: string;
  languages: Language[];
  translations: { [key: string]: string };
  siteLanguage: string;
  videoLanguage: string;
  subtitleLanguage: string;
  categories: Category[];
  selectedVideo: string | null;
}
