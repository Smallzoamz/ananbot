
import { NextResponse } from 'next/server';

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_API_URL;

async function proxyRequest(request, { params }) {
    if (!BOT_API_URL) {
        return NextResponse.json({ error: "Bot API URL not configured" }, { status: 500 });
    }

    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const url = `${BOT_API_URL}/api/${path}${request.nextUrl.search}`;

    console.log(`[Proxy] Forwarding to: ${url}`);

    try {
        const body = request.method !== 'GET' ? await request.text() : undefined;

        const response = await fetch(url, {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                // Forward other necessary headers if needed
            },
            body: body,
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error(`[Proxy Error] ${error.message}`);
        return NextResponse.json({ error: "Failed to connect to Bot API" }, { status: 502 });
    }
}

export async function GET(request, context) { return proxyRequest(request, context); }
export async function POST(request, context) { return proxyRequest(request, context); }
export async function PUT(request, context) { return proxyRequest(request, context); }
export async function DELETE(request, context) { return proxyRequest(request, context); }
export async function OPTIONS(request) {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
