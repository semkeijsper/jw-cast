/* eslint-disable no-use-before-define */
import { Category, Language } from '.';

export interface State {
  baseUrl: string;
  languages: Language[];
  siteLanguage: string;
  videoLanguage: string;
  subtitleLanguage: string;
  categories: Category[];
}
