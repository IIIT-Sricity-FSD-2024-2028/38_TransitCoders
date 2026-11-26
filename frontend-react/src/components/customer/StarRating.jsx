import { useState } from 'react';
import { StarFill } from 'react-bootstrap-icons';

export default function StarRating({ rating = 5, onRatingChange, readOnly = false }) {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((starValue) => {
                const isActive = (hoveredRating || rating) >= starValue;

                return (
                    <button
                        key={starValue}
                        type="button"
                        disabled={readOnly}
                        onClick={() => onRatingChange && onRatingChange(starValue)}
                        onMouseEnter={() => !readOnly && setHoveredRating(starValue)}
                        onMouseLeave={() => !readOnly && setHoveredRating(0)}
                        className={`text-xl transition-all ${
                            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                        } ${isActive ? 'text-amber-400' : 'text-gray-200'}`}
                        title={`${starValue} Star${starValue > 1 ? 's' : ''}`}
                    >
                        <StarFill size={20} />
                    </button>
                );
            })}
            <span className="text-xs font-bold text-gray-500 ml-2">
                {rating} / 5 Stars
            </span>
        </div>
    );
}
