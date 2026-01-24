
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AntiSpamPage() {
    const { guildId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config State
    const [config, setConfig] = useState({
        enabled: false,
        max_mentions: 5,
        rate_limit_enabled: false,
        rate_limit_count: 5,
        rate_limit_window: 10,
        repeat_text_enabled: false,
        repeat_text_count: 3,
        action: "warn"
    });

    useEffect(() => {
        if (guildId) fetchConfig();
    }, [guildId]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`/api/guild/${guildId}/anti-spam`);
            const data = await res.json();
            if (data.config) {
                setConfig(prev => ({ ...prev, ...data.config }));
            }
        } catch (error) {
            console.error("Failed to load config:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/guild/${guildId}/anti-spam`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config })
            });
            if (res.ok) {
                alert("บันทึกการตั้งค่าเรียบร้อยแล้วค่ะ! 🌸");
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึกค่ะ 🥺");
            }
        } catch (error) {
            console.error("Failed to save:", error);
            alert("เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้ค่ะ");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return <div className="p-8 text-center text-pink-500 animate-pulse">กำลังโหลดข้อมูล... 🌸</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-pink-100 text-pink-500 transition-colors"
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                🛡️ Anti-Spam System
                                <span className="text-xs bg-gradient-to-r from-pink-400 to-orange-400 text-white px-2 py-1 rounded-full">PRO</span>
                            </h1>
                            <p className="text-gray-500 mt-1">ปกป้องเซิร์ฟเวอร์จากสแปมและการก่อกวนด้วยระบบอัจฉริยะ</p>
                        </div>
                    </div>
                    <button
                        onClick={saveConfig}
                        disabled={saving}
                        className={`px-6 py-2 rounded-xl text-white font-medium shadow-lg transition-all transform hover:scale-105 ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-pink-500 to-orange-400 hover:shadow-pink-300"
                            }`}
                    >
                        {saving ? "Creating Magic... ✨" : "Save Changes 💾"}
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 1. Excessive Mentions */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-pink-100 rounded-xl text-2xl">📢</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Excessive Mentions</h3>
                                    <p className="text-sm text-gray-500">ป้องกันการแท็กระราน</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Mentions per Message</label>
                                <input
                                    type="number"
                                    value={config.max_mentions}
                                    onChange={(e) => handleChange("max_mentions", parseInt(e.target.value))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">แนะนำ: 5-10 Mentions</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Rate Limiting */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-xl text-2xl">⚡</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Rate Limiting</h3>
                                    <p className="text-sm text-gray-500">จำกัดความเร็วข้อความ</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                <input
                                    type="checkbox"
                                    id="rate-toggle"
                                    className="peer sr-only"
                                    checked={config.rate_limit_enabled}
                                    onChange={(e) => handleChange("rate_limit_enabled", e.target.checked)}
                                />
                                <label
                                    htmlFor="rate-toggle"
                                    className="block w-full h-full bg-gray-200 rounded-full cursor-pointer peer-checked:bg-blue-500 peer-focus:ring-2 peer-focus:ring-blue-300 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"
                                ></label>
                            </div>
                        </div>
                        {config.rate_limit_enabled && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Messages</label>
                                        <input
                                            type="number"
                                            value={config.rate_limit_count}
                                            onChange={(e) => handleChange("rate_limit_count", parseInt(e.target.value))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Window (s)</label>
                                        <input
                                            type="number"
                                            value={config.rate_limit_window}
                                            onChange={(e) => handleChange("rate_limit_window", parseInt(e.target.value))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">ส่งเกิน {config.rate_limit_count} ข้อความ ใน {config.rate_limit_window} วินาที จะถือว่าสแปม</p>
                            </div>
                        )}
                    </div>

                    {/* 3. Repeated Text */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-xl text-2xl">📝</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Repeated Text</h3>
                                    <p className="text-sm text-gray-500">ข้อความซ้ำๆ ติดกัน</p>
                                </div>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                <input
                                    type="checkbox"
                                    id="repeat-toggle"
                                    className="peer sr-only"
                                    checked={config.repeat_text_enabled}
                                    onChange={(e) => handleChange("repeat_text_enabled", e.target.checked)}
                                />
                                <label
                                    htmlFor="repeat-toggle"
                                    className="block w-full h-full bg-gray-200 rounded-full cursor-pointer peer-checked:bg-purple-500 peer-focus:ring-2 peer-focus:ring-purple-300 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"
                                ></label>
                            </div>
                        </div>
                        {config.repeat_text_enabled && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Repeats Allowed</label>
                                    <input
                                        type="number"
                                        value={config.repeat_text_count}
                                        onChange={(e) => handleChange("repeat_text_count", parseInt(e.target.value))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-300 outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">ส่งข้อความเดิมซ้ำเกิน {config.repeat_text_count} ครั้งจะถูกจัดการ</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Action Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 rounded-xl text-2xl">⚖️</div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">Punishment</h3>
                                    <p className="text-sm text-gray-500">บทลงโทษเมื่อทำผิด</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Action to Take</label>
                                <select
                                    value={config.action}
                                    onChange={(e) => handleChange("action", e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-300 outline-none bg-white"
                                >
                                    <option value="warn">⚠️ Warn (แจ้งเตือน)</option>
                                    <option value="mute">🔇 Mute 5 Mins (ปิดปาก)</option>
                                    <option value="kick">zzZZ Kick (เตะออก)</option>
                                    <option value="ban">🔨 Ban (แบนถาวร)</option>
                                </select>
                                <p className="text-xs text-red-400 mt-2 font-medium">
                                    * Bot Moderators & Admins will be ignored.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
