interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="page">
      <p className="eyebrow">Practice Time</p>
      <h1>{title}</h1>
      <p className="page-intro">This route is ready for its feature module.</p>
    </section>
  );
}
