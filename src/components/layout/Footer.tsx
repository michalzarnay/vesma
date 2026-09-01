import { COLORS } from '../../data/constants';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center gap-1.5 mb-2" aria-hidden="true">
          {COLORS.brandDots.map((color) => (
            <span key={color} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>
        <p>VESMA – Voda a energia – sprievodca mapovaním areálov</p>
        <p className="mt-1">Toto hodnotenie je orientačné. Pre presný návrh kontaktujte odborníka.</p>
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-gray-400">
          <img
            src={`${import.meta.env.BASE_URL}INOVIA_Logo_Final_RGB.jpg`}
            alt="INOVIA"
            className="w-4 h-4 rounded-full object-cover object-left"
          />
          <span>V spolupráci s INOVIA</span>
        </div>
      </div>
    </footer>
  );
}
