import Layout from "./Layout.jsx";

import Tutorial from "./Tutorial";

import Tutorials from "./Tutorials";

import Dashboard from "./Dashboard";

import TutorialEditor from "./TutorialEditor";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Tutorial: Tutorial,
    
    Tutorials: Tutorials,
    
    Dashboard: Dashboard,
    
    TutorialEditor: TutorialEditor,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Tutorial />} />
                
                
                <Route path="/Tutorial" element={<Tutorial />} />
                
                <Route path="/Tutorials" element={<Tutorials />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/TutorialEditor" element={<TutorialEditor />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}