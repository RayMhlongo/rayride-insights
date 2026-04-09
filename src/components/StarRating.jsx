export default function StarRating({ value, onChange }) {
  return (
    <div className="star-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? 'star active' : 'star'}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
