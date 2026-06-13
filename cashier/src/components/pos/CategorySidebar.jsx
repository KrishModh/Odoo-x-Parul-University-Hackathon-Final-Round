import { Coffee, CupSoda, IceCreamBowl, Sandwich, Soup, Utensils } from 'lucide-react';

const iconMap = { tea: Coffee, coffee: Coffee, snacks: Sandwich, dessert: IceCreamBowl, meals: Utensils, beverages: CupSoda };

export default function CategorySidebar({ categories, activeCategory, onChange }) {
  return (
    <aside className="pos-category-sidebar">
      <button className={`category-tab ${activeCategory === 'all' ? 'is-active' : ''}`} onClick={() => onChange('all')}><Soup size={19} /><span>All</span></button>
      {categories.map((category) => {
        const Icon = iconMap[category.slug] || Coffee;
        return <button key={category.slug} className={`category-tab ${activeCategory === category.slug ? 'is-active' : ''}`} onClick={() => onChange(category.slug)}><Icon size={19} /><span>{category.name}</span></button>;
      })}
    </aside>
  );
}
