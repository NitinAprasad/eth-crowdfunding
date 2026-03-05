import { useRef, useEffect, useState, useCallback } from 'react';

// ─── Data ─────────────────────────────────────────────────────
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const getDaysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();

const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

const ITEM_HEIGHT = 48; // px — must match .drum-item height in CSS

// ─── Single scrollable drum column ──────────────────────────────
const DrumColumn = ({ items, selectedIdx, onSelect, label, formatItem }) => {
    const scrollRef = useRef(null);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startScrollTop = useRef(0);

    // Scroll to the selected item
    const scrollToIndex = useCallback((idx, smooth = true) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTo({
            top: idx * ITEM_HEIGHT,
            behavior: smooth ? 'smooth' : 'instant',
        });
    }, []);

    // Initial scroll — no animation so it snaps silently
    useEffect(() => {
        scrollToIndex(selectedIdx, false);
    }, []);

    // When selectedIdx changes from parent (e.g. month change resets day)
    useEffect(() => {
        scrollToIndex(selectedIdx, true);
    }, [selectedIdx]);

    // Mouse-wheel scrolling
    const handleWheel = (e) => {
        e.preventDefault();
        if (!scrollRef.current) return;
        const delta = e.deltaY > 0 ? 1 : -1;
        const newIdx = Math.min(Math.max(selectedIdx + delta, 0), items.length - 1);
        onSelect(newIdx);
        scrollToIndex(newIdx);
    };

    // Mouse drag scrolling
    const handleMouseDown = (e) => {
        isDragging.current = true;
        startY.current = e.clientY;
        startScrollTop.current = scrollRef.current?.scrollTop ?? 0;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || !scrollRef.current) return;
        const dy = startY.current - e.clientY;
        scrollRef.current.scrollTop = startScrollTop.current + dy;
    };

    const handleMouseUp = () => {
        if (!isDragging.current || !scrollRef.current) return;
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Snap to nearest item
        const rawIdx = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
        const snapped = Math.min(Math.max(rawIdx, 0), items.length - 1);
        onSelect(snapped);
        scrollToIndex(snapped);
    };

    // Touch support
    const touchStartY = useRef(0);
    const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
        if (!scrollRef.current) return;
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        const delta = dy > 0 ? 1 : dy < 0 ? -1 : 0;
        const newIdx = Math.min(Math.max(selectedIdx + delta, 0), items.length - 1);
        onSelect(newIdx);
        scrollToIndex(newIdx);
    };

    return (
        <div className="drum-col">
            <span className="drum-col-label">{label}</span>
            <div className="drum-scroll-wrapper">
                {/* Selection highlight */}
                <div className="drum-center-line" />
                <div
                    ref={scrollRef}
                    className="drum-scroll"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ cursor: 'grab' }}
                >
                    {/* Top spacer — pushes first item to the center */}
                    <div className="drum-spacer" />

                    {items.map((item, i) => (
                        <div
                            key={i}
                            className={`drum-item ${i === selectedIdx ? 'selected' : ''}`}
                            onClick={() => { onSelect(i); scrollToIndex(i); }}
                            style={{
                                transform: `scale(${i === selectedIdx ? 1 : Math.max(0.78, 1 - Math.abs(i - selectedIdx) * 0.07)})`,
                                opacity: Math.max(0.3, 1 - Math.abs(i - selectedIdx) * 0.25),
                                transition: 'transform 0.2s ease, opacity 0.2s ease',
                            }}
                        >
                            {formatItem ? formatItem(item) : item}
                        </div>
                    ))}

                    {/* Bottom spacer */}
                    <div className="drum-spacer" />
                </div>
            </div>
        </div>
    );
};

// ─── Main DrumDatePicker ─────────────────────────────────────────
const DrumDatePicker = ({ value, onChange }) => {
    // Parse existing value or default to today
    const parseDate = (v) => {
        if (v) { const d = new Date(v); if (!isNaN(d)) return d; }
        return new Date();
    };
    const initial = parseDate(value);

    const currentYear = new Date().getFullYear();
    const years = range(currentYear, currentYear + 10);

    const [dayIdx, setDayIdx] = useState(initial.getDate() - 1);
    const [monthIdx, setMonthIdx] = useState(initial.getMonth());
    const [yearIdx, setYearIdx] = useState(Math.max(0, initial.getFullYear() - currentYear));

    // Derive days array from month/year
    const daysInMonth = getDaysInMonth(monthIdx, years[yearIdx]);
    const days = range(1, daysInMonth);

    // Clamp day when month/year change reduces available days
    useEffect(() => {
        if (dayIdx >= daysInMonth) setDayIdx(daysInMonth - 1);
    }, [monthIdx, yearIdx, daysInMonth]);

    // Notify parent whenever selection changes
    useEffect(() => {
        const day = days[Math.min(dayIdx, days.length - 1)];
        const month = monthIdx + 1; // 1-based
        const year = years[yearIdx];
        // ISO date string (YYYY-MM-DD)
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(iso);
    }, [dayIdx, monthIdx, yearIdx]);

    const displayDay = days[Math.min(dayIdx, days.length - 1)];
    const displayMonth = MONTHS[monthIdx];
    const displayYear = years[yearIdx];

    return (
        <div>
            <div className="drum-picker-wrapper">
                <DrumColumn
                    label="Day"
                    items={days}
                    selectedIdx={Math.min(dayIdx, days.length - 1)}
                    onSelect={setDayIdx}
                    formatItem={(d) => String(d).padStart(2, '0')}
                />
                <DrumColumn
                    label="Month"
                    items={MONTHS}
                    selectedIdx={monthIdx}
                    onSelect={setMonthIdx}
                    formatItem={(m) => m.slice(0, 3)}
                />
                <DrumColumn
                    label="Year"
                    items={years}
                    selectedIdx={yearIdx}
                    onSelect={setYearIdx}
                />
            </div>
            <div className="date-display">
                {displayDay} {displayMonth} {displayYear}
            </div>
        </div>
    );
};

export default DrumDatePicker;
