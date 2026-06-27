import { useEffect, useState } from 'react';
import { getPlaceReviews, reviewPlace } from '../services/map.api';
import { Stars, RatingInput, Spinner } from './ui';

// Inline reviews panel shown under a place card on HomePage.
export default function PlaceReviews({ placeId }) {
  const [reviews, setReviews] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlaceReviews(placeId).then(setReviews).catch(() => setReviews([]));
  }, [placeId]);

  async function submit() {
    if (!rating) return setError('Vui lòng chọn số sao.');
    setSubmitting(true);
    setError('');
    try {
      const created = await reviewPlace(placeId, { rating_score: rating, comment });
      setReviews((r) => [...(r || []), created]);
      setRating(0);
      setComment('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <hr className="divider" />
      {reviews === null ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <p className="muted small">Chưa có đánh giá nào.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.review_id} style={{ marginBottom: 8 }}>
            <Stars value={r.rating_score} />
            {r.comment && <p className="muted small">{r.comment}</p>}
          </div>
        ))
      )}

      <hr className="divider" />
      {error && <div className="alertMsg alertMsg--error">{error}</div>}
      <RatingInput value={rating} onChange={setRating} />
      <textarea
        className="textarea"
        placeholder="Chia sẻ trải nghiệm tiếp cận của bạn…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ marginTop: 8 }}
      />
      <button
        className="btn btn--primary btn--sm"
        onClick={submit}
        disabled={submitting}
        style={{ marginTop: 8 }}
      >
        {submitting ? 'Sending...' : 'Submit Review'}
      </button>
    </div>
  );
}
