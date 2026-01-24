
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";

export async function GET(request, { params }) {
    const { guildId } = await params;

    if (!guildId) {
        return NextResponse.json({ error: "Guild ID is required" }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('guild_settings')
            .select('anti_spam_config')
            .eq('guild_id', guildId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                return NextResponse.json({ config: {} });
            }
            throw error;
        }

        return NextResponse.json({ config: data?.anti_spam_config || {} });
    } catch (error) {
        console.error("Error fetching anti-spam config:", error);
        return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { guildId } = await params;

    if (!guildId) {
        return NextResponse.json({ error: "Guild ID is required" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { config } = body;

        // Validation (Basic)
        if (typeof config !== 'object') {
            return NextResponse.json({ error: "Invalid config format" }, { status: 400 });
        }

        // We use upsert to create or update. 
        // Note: This replaces the entire anti_spam_config JSONB column for this row.
        // Needs to ensure we don't wipe other settings. 
        // Actually, we should probably fetch first or use a jsonb_set update if supported,
        // but Supabase/Postgres 'update' works on columns.

        // Fetch existing first to merge? Or assume frontend sends full config? 
        // Frontend should send full anti_spam_config object.

        // However, we must be careful not to overwrite other columns in guild_settings.
        // We only want to update `anti_spam_config`.

        const { error } = await supabase
            .from('guild_settings')
            .update({ anti_spam_config: config })
            .eq('guild_id', guildId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving anti-spam config:", error);
        return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
    }
}
