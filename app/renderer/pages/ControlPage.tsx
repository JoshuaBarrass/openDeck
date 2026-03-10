import React from "react"
import Grid from "../components/Grid"
import { useDeckConfig } from "../hooks/useDeckConfig"

export default function ControlPage() {
    const { pages, currentPageIndex, setCurrentPageIndex, displayImage } = useDeckConfig()
    const currentPage = pages[currentPageIndex]

    return (
        <div className="control-page">
            <div className="sd-device">
                <div className="sd-device-frame">
                    {displayImage && (
                        <img className="sd-display-image" src={displayImage} alt="" draggable={false} />
                    )}
                    <Grid buttons={currentPage.grid} columns={5} rows={3} />
                </div>
            </div>
            <nav className="sd-page-bar">
                {pages.map((page, index) => (
                    <button
                        key={page.name}
                        className={`sd-page-tab ${index === currentPageIndex ? "active" : ""}`}
                        onClick={() => setCurrentPageIndex(index)}
                    >
                        {page.name}
                    </button>
                ))}
            </nav>
        </div>
    )
}
