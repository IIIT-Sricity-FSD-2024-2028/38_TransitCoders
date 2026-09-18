/**
 * Simple placeholder page for features that are not implemented yet.
 * Each teammate replaces their own feature page in a later lab.
 */
export default function Placeholder({ title, description }) {
  return (
    <div>
      <div className="hm-page-header">
        <div>
          <div className="hm-page-title">{title}</div>
          <div className="hm-page-subtitle">{description}</div>
        </div>
      </div>
      <div className="hm-card placeholder-card">
        🚧 This feature will be implemented by its owner in an upcoming lab.
      </div>
    </div>
  );
}