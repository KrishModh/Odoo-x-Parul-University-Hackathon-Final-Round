export default function LoadingSpinner({ label = 'Loading' }) {
  return <span className="loading-spinner" role="status"><span className="loading-spinner__ring" />{label}</span>;
}
