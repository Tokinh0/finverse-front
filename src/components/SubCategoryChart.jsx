export default function SubcategoryChart({ data }) {
  const flattened = [];

  for (const [category, subcats] of Object.entries(data)) {
    for (const [sub, val] of Object.entries(subcats)) {
      flattened.push({ category, subcategory: sub, total: parseFloat(val.total) });
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Total by Subcategory</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={flattened}>
          <XAxis dataKey="subcategory" angle={-40} textAnchor="end" interval={0} height={120} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
