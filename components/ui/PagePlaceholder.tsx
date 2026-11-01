type PagePlaceholderProps = {
  title: string;
  description?: string;
};

export default function PagePlaceholder({
  title,
  description = "Design coming soon — structure and route are ready.",
}: PagePlaceholderProps) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-8">
      <h2 className="text-xl font-semibold text-brand-dark">{title}</h2>
      <p className="mt-2 text-sm text-brand-muted">{description}</p>
    </div>
  );
}
