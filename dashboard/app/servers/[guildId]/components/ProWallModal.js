import React from "react";
import Portal from "../../../components/Portal";

const ProWallModal = ({ show, onClose, onProceed, featureName }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="fixed-overlay z-prowall blur-in">
                <div className="modal-card pro-wall-card animate-pop">
                    <button className="modal-close" onClick={onClose}>×</button>

                    <div className="pw-icon">
                        🔒
                    </div>

                    <h2 className="pw-title">Pro Feature</h2>
                    <p className="pw-desc">
                        Unlock {featureName || "exclusive features"} to grow your community!
                        <br />
                        <span className="pw-sub">Custom branding, status, and more awaits.</span>
                    </p>

                    <button className="modal-btn gold-btn" onClick={() => { onClose(); onProceed(); }}>
                        Proceed to Plan 🚀
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default ProWallModal;
