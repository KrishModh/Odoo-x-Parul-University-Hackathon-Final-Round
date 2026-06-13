import { Link } from 'react-router-dom';
import BrandMark from '../../components/BrandMark';

export default function NotFoundPage() {
  return <main className="empty-page"><BrandMark /><div><span>404</span><h1>This table is empty.</h1><p>The page you’re looking for isn’t on today’s menu.</p><Link className="primary-button" to="/">Back to dashboard</Link></div></main>;
}
