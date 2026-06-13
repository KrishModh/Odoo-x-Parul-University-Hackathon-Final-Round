export default function CategoryCard({ category }) {
  return (
    <article className="category-card" style={{ '--category-color': category.color }}>
      <span>{category.emoji}</span><div><strong>{category.name}</strong><small>{category.count} products</small></div>
    </article>
  );
}
