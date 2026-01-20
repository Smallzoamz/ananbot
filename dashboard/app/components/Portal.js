"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
};

export default Portal;
