import React from "react";
import Portal from "../../../components/Portal";

import { useRouter, useParams } from "next/navigation";

const ProWallModal = ({ show, onClose, onProceed, featureName }) => {
    const router = useRouter();
    const params = useParams();

    if (!show) return null;

    const handleProceed = () => {
        // Redirect to Premium Hub
        if (params?.guildId) {
            router.push(`/servers/${params.guildId}/premium`);
        } else if (onProceed) {
            onProceed();
        }
    };

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

                    <button className="modal-btn gold-btn" onClick={handleProceed}>
                        Proceed to Plan 🚀
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default ProWallModal;
