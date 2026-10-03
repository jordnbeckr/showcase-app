// Shown on every page of this retired app so nobody keeps entering data here by mistake.
export default function MovedNotice() {
  return (
    <div
      role="alert"
      style={{ backgroundColor: '#fef3c7', borderBottom: '2px solid #f59e0b', color: '#78350f', padding: '12px 16px', textAlign: 'center', fontSize: 14, lineHeight: 1.45 }}
    >
      <strong>This app has moved.</strong> All showcases now live in the new Showcase app, and Team Spirit Showcase (Sept 20, 2026) is kept there as a past showcase. This old app is no longer used — please don’t enter anything here.{' '}
      <a href="https://showcase-hub-plum.vercel.app" style={{ color: '#78350f', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Open the new Showcase app →</a>
    </div>
  )
}
