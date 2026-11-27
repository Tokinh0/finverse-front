/** "2025-03-02" -> "02/03/2025" */
export const formatIsoDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
};

/** "2025-03" -> "03/2025" */
export const formatMonth = (month: string) => {
  const [year, m] = month.split("-");
  return year && m ? `${m}/${year}` : month;
};
