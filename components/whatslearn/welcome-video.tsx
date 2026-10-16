export default function WelcomeVideo(){
 return <div className="welcome-video-inline">
  <video src="/videos/whatslearn-welcome.mp4" controls playsInline preload="metadata" aria-label="WhatsLearn welcome video">
   Your browser does not support this video. <a href="/videos/whatslearn-welcome.mp4">Open the welcome video</a>.
  </video>
 </div>;
}
