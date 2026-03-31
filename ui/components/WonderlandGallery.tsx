const galleryItems = [
  {
    type: "image",
    src: "/images/funding_opportunities.png",
    title: "Funding Opportunities",
    caption: "Support the Future of AI",
  },
  {
    type: "image",
    src: "/images/dashboard_ui.jpeg",
    title: "Dashboard Wonderland",
    caption: "Projects, Analytics, Settings",
  },
  {
    type: "image",
    src: "/images/storm_laptop.png",
    title: "Immersion Storm",
    caption: "AI-WONDERLAND pulls you in",
  },
  {
    type: "image",
    src: "/images/wonderspace_ide.jpeg",
    title: "WONDERSPACE IDE",
    caption: "Where your code comes alive",
  },
  {
    type: "video",
    src: "/videos/grok_video_2025-12-12-16-35-26.mp4",
    title: "WONDERSPACE Demo",
    caption: "Real environment preview",
  },
];

export default function WonderlandGallery() {
  return (
    <section className="wonderland-gallery">
      <h2 className="gallery-title">🌌 Wonderland Gallery</h2>
      <div className="gallery-grid">
        {galleryItems.map((item, idx) => (
          <div key={idx} className="gallery-card">
            {item.type === "image" ? (
              <img src={item.src} alt={item.title} className="gallery-media" />
            ) : (
              <video
                src={item.src}
                className="gallery-media"
                autoPlay
                muted
                loop
                playsInline
              />
            )}
            <div className="gallery-overlay">
              <h3>{item.title}</h3>
              <p>{item.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wonderland-gallery {
          padding: 4rem 2rem;
          background: radial-gradient(circle at center, #ff00ff, #000033);
          color: #ffffff;
          text-align: center;
        }
        .gallery-title {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-shadow: 0 0 10px #00ffff;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .gallery-card {
          position: relative;
          border: 2px solid #00ffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
        }
        .gallery-media {
          width: 100%;
          height: auto;
          display: block;
        }
        .gallery-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.6);
          padding: 1rem;
        }
        .gallery-overlay h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #00ffff;
        }
        .gallery-overlay p {
          margin: 0;
          font-size: 0.9rem;
        }
      `}</style>
    </section>
  );
}
