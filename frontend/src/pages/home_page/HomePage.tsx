import {useEffect, useState} from "react";
import Header from "./navbar/Header.tsx";
import Desk from "./widgets/Desk.tsx";
import {WidgetProps} from "../../data/types/WidgetProps.ts";

export default function HomePage() {
    const defaultMode: string | boolean = localStorage.getItem("mode") || window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode: boolean = defaultMode === "dark";
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [darkMode, setDarkMode] = useState(isDarkMode);

    const isSmallScreen = screenWidth < 648;
    const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
        const savedWidgets = localStorage.getItem('activeWidgets');
        if (savedWidgets) {
            const parsedWidgets = JSON.parse(savedWidgets);
            return isSmallScreen ? [parsedWidgets[0]] : parsedWidgets;
        }
        return isSmallScreen ? ['notes'] : ['notes', 'weather', 'calendar', 'news', 'chats'];
    });

    useEffect(() => {
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
    }, [activeWidgets]);

    const widgetConfig: { [key: string]: WidgetProps } = {
        notes: { x: 0, y: 0, w: 2, h: 1, minW: 2, maxW: 4, minH: 1, maxH: 3 },
        weather: { x: 2, y: 0, w: 2, h: 1, minW: 1, maxW: 4, minH: 1, maxH: 2 },
        calendar: { x: 0, y: 1, w: 2, h: 2, minW: 2, maxW: 4, minH: 1, maxH: 4 },
        news: { x: 2, y: 0, w: 2, h: 2, minW: 2, maxW: 3, minH: 1, maxH: 2 },
        chats: { x: 6, y: 0, w: 4, h: 3, minW: 4, maxW: 8, minH: 2, maxH: 4 },
    };

    const [layout, setLayout] = useState<WidgetProps[]>(() => {
        const savedLayout = localStorage.getItem("layout");
        const isSmallScreen = window.innerWidth < 768;

        if (!savedLayout) {
            return activeWidgets.map(widget => ({
                i: widget,
                ...widgetConfig[widget],
                ...(isSmallScreen ? { h: 3, minH: 3, maxH: 3 } : {})
            }));
        }

        const parsedLayout = JSON.parse(savedLayout);
        return parsedLayout
            .filter((item: any) => activeWidgets.includes(item.i))
            .map((item: any) => ({
                ...item,
                ...(isSmallScreen ? { h: 3, minH: 3, maxH: 3 } : {})
            }));
    });

    const [bgImage, setBgImage] = useState<string>(localStorage.getItem("bgImage") || "/src/assets/default_bg.jpg");

    useEffect(() => {
        if (bgImage) {
            setBgImage(localStorage.getItem("bgImage") || "/src/assets/default_bg.jpg");
        }
    }, [localStorage.getItem("bgImage")])

    useEffect(() => {
        localStorage.setItem("layout", JSON.stringify(layout));
    }, [layout]);


    const handleAddWidget = (widget: string) => {
        setActiveWidgets(prev => {
            const isSmallScreen = screenWidth < 648;
            const newActiveWidgets = isSmallScreen ? [widget] : prev.includes(widget) ? prev : [...prev, widget];

            setLayout((prevLayout: WidgetProps[]) => {
                return isSmallScreen
                    ? [{
                        i: widget,
                        ...(widgetConfig[widget] || widgetConfig),
                        x: 0,
                        y: 0,
                        h: 3,
                        minH: 3,
                        maxH: 3
                    }]
                    : prevLayout.some((item) => item.i === widget)
                        ? prevLayout
                        : [...prevLayout, {
                            i: widget,
                            ...(widgetConfig[widget] || widgetConfig)
                        }];
            });

            return newActiveWidgets;
        });

        if (screenWidth < 648) {
            localStorage.setItem('activeWidgets', JSON.stringify([widget]));
        }
    };

    const removeWidget = (widget: string) => {
        setActiveWidgets(activeWidgets.filter(w => w !== widget));
        setLayout(layout.filter((item: WidgetProps) => item.i !== widget));
    };

    const handleTheme: () => void = () => {
        setDarkMode(!darkMode);
        localStorage.setItem("mode", !darkMode ? "dark" : "light");
    };

    const headerHeight: number = 100;

    // Determine the background style
    const containerStyle = bgImage && bgImage !== "/src/assets/default_bg.jpg"
        ? {
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }
        : {};

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setScreenWidth(width);
            const nowSmallScreen = width < 648;

            if (nowSmallScreen && activeWidgets.length > 1) {
                const singleWidget = [activeWidgets[0]];
                setActiveWidgets(singleWidget);
                localStorage.setItem('activeWidgets', JSON.stringify(singleWidget));

                setLayout([{
                    i: singleWidget[0],
                    ...widgetConfig[singleWidget[0]],
                    x: 0,
                    y: 0,
                    h: 3,
                    minH: 3,
                    maxH: 3
                }]);
            } else if (!nowSmallScreen && activeWidgets.length === 1) {
                const defaultWidgets = ['notes', 'weather', 'calendar', 'news', 'chats'];
                setActiveWidgets(defaultWidgets);
                localStorage.setItem('activeWidgets', JSON.stringify(defaultWidgets));

                setLayout(defaultWidgets.map(widget => ({
                    i: widget,
                    ...widgetConfig[widget]
                })));
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [activeWidgets]);

    useEffect(() => {
        localStorage.setItem('activeWidgets', JSON.stringify(activeWidgets));
    }, [activeWidgets]);

    return (
        <div
            className={`h-[100vh] w-[100vw] ${bgImage === "/src/assets/default_bg.jpg" || !bgImage ? (darkMode ? "darkBody" : "lightBody") : ""}`}
            style={containerStyle}
        >
            <Header headerHeight={headerHeight}
                    handleTheme={handleTheme}
                    onAddWidget={handleAddWidget}
                    activeWidgets={activeWidgets}
                    removeWidget={removeWidget}
            />

            <Desk
                headerHeight={headerHeight}
                activeWidgets={activeWidgets}
                layout={layout}
                setLayout={setLayout}
                removeWidget={removeWidget}/>
        </div>
    );
}