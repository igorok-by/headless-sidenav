export default function Page({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">Resize for mobile drawer; use Toggle for wide/narrow.</p>
    </div>
  );
}
