import { Quote } from 'lucide-react';
import BrandMark from '../components/BrandMark';

export default function AuthLayout({ children, mode }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <BrandMark />
        <div className="auth-story__content">
          <span className="eyebrow">CAFE, SIMPLIFIED</span>
          <h1>Good service starts with a calmer workspace.</h1>
          <p>From the first morning brew to the final table, keep every order moving beautifully.</p>
          <div className="auth-quote"><Quote size={22} /><span>Designed for teams who care about every detail.</span></div>
        </div>
        <div className="auth-story__art" aria-hidden="true"><span className="steam steam--one" /><span className="steam steam--two" /><div className="cup"><div /></div><div className="saucer" /></div>
        <small className="auth-story__footer">CREMA POS · EST. 2026</small>
      </section>
      <section className="auth-panel">
        <div className="auth-panel__mobile-brand"><BrandMark /></div>
        <div className="auth-card" key={mode}>{children}</div>
      </section>
    </main>
  );
}
