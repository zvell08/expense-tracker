import { CATEGORY_COLORS } from '../utils/categories'

export default function ColorSwatches({ value, onChange }) {
  return (
    <div className="swatch-row">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${value === c ? 'selected' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`Warna ${c}`}
        />
      ))}
    </div>
  )
}
