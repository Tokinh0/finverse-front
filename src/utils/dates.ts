import { getLocale } from "../i18n/locale";

/** "2025-03-02" -> "02/03/2025" in Portuguese, "03/02/2025" in English */
export const formatIsoDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  if (!(year && month && day)) return iso;
  return getLocale() === "en" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
};

/** "2025-03" -> "03/2025" */
export const formatMonth = (month: string) => {
  const [year, m] = month.split("-");
  return year && m ? `${m}/${year}` : month;
};

/** Number formatting locale for the current language. */
export const numberLocale = () => (getLocale() === "en" ? "en-US" : "pt-BR");
