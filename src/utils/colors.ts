/** Fallback palette for chart slices without a color_code. */
export const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A", "#33AADD", "#FF6666", "#66CC66"];

export const colorAt = (index: number, color?: string | null) => color || CHART_COLORS[index % CHART_COLORS.length];

