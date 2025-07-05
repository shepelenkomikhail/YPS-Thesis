import React, { useState, useEffect } from 'react';

function useResizeObserver(ref: React.RefObject<HTMLElement | null>) {
    const [componentWidth, setComponentWidth] = useState(0);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setComponentWidth(entry.contentRect.width);
            }
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                resizeObserver.unobserve(ref.current);
            }
        };
    }, [ref]);

    return componentWidth;
}

export default useResizeObserver;
