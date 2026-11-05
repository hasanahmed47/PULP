import { useEffect, useId, useRef, useState } from 'react';
import './FilmDialog.css';

export function FilmDialog({ videoSrc, posterSrc, onClose }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const titleId = useId();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    let resumeOnReturn = false;

    function playFilm() {
      video.play().catch(() => {});
    }

    function handleVisibility() {
      if (document.hidden) {
        resumeOnReturn = !video.paused;
        video.pause();
      } else if (resumeOnReturn) {
        resumeOnReturn = false;
        playFilm();
      }
    }

    dialog.showModal();
    if (!document.hidden) playFilm();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      video.pause();
      dialog.close();
    };
  }, []);

  function closeFilm() {
    videoRef.current.pause();
    dialogRef.current.close();
    onClose();
  }

  function cancelFilm(event) {
    event.preventDefault();
    closeFilm();
  }

  function closeBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) closeFilm();
  }

  function guardPlayback() {
    if (document.hidden) videoRef.current.pause();
  }

  return (
    <dialog
      ref={dialogRef}
      className="film-dialog"
      aria-labelledby={titleId}
      onCancel={cancelFilm}
      onClick={closeBackdrop}
      data-lenis-prevent
    >
      <h2 id={titleId} className="sr-only">PULP film</h2>
      <video
        ref={videoRef}
        className="film-dialog__video"
        src={videoSrc}
        poster={posterSrc}
        controls
        playsInline
        muted
        onPlay={guardPlayback}
        onError={() => setFailed(true)}
        aria-label="PULP Blood Orange film"
      />
      {failed && <p className="film-dialog__error" role="alert">The film could not load. Please try again later.</p>}
      <button type="button" className="film-dialog__close" aria-label="Close film" onClick={closeFilm}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </dialog>
  );
}
