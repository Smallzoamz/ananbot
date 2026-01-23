"use client";
import React from "react";
import Portal from "../../../../components/Portal";

const DeleteModal = ({ show, channelId, channelName, onClose, onConfirm }) => {
    if (!show) return null;

    return (
        <Portal>
            <div className="sub-modal-overlay">
                <div className="sub-modal channel-delete-modal">
                    <div className="sub-modal-header delete-header">
                        <div className="delete-modal-icon">🗑️</div>
                        <div>
                            <h4>ลบห้องนี้ใช่ไหมค๊าา?</h4>
                            <p>โปรดยืนยันการลบห้องนะคะ Papa</p>
                        </div>
                        <button className="modal-close-inline" onClick={onClose}>×</button>
                    </div>

                    <div className="delete-modal-body">
                        <div className="delete-target-box">
                            <p className="delete-target-name">{channelName}</p>
                        </div>
                        <p className="delete-warning">
                            การดำเนินการนี้ไม่สามารถย้อนคืนได้นะคะ <br /> ห้องและประวัติข้อความจะหายไปทันทีค่ะ 🥺
                        </p>
                    </div>

                    <div className="sub-modal-actions">
                        <button className="sub-modal-btn cancel" onClick={onClose}>ยังไม่อยากลบ 🌸</button>
                        <button className="sub-modal-btn danger" onClick={onConfirm}>
                            ยืนยันลบเลย! 🚀
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default DeleteModal;
