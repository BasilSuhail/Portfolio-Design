/**
 * Full-page loading screen, shown while a page's code or content is still on its way.
 * index.html carries the same markup inside the root element, so it is on screen before any script runs.
 */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="site-loader" role="status" aria-live="polite">
      <div className="site-loader-bar">
        <div className="site-loader-track">
          <div className="site-loader-fill" />
        </div>
      </div>
      <p className="site-loader-label">{label}</p>
    </div>
  );
}
