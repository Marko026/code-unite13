import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: "Test API is working",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasGroqKey: !!process.env.GROQ_API_KEY,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        return NextResponse.json({
            message: "Test POST is working",
            receivedData: body,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            hasGroqKey: !!process.env.GROQ_API_KEY,
        });
    } catch (error) {
        return NextResponse.json({
            error: "Failed to parse request",
            message: error instanceof Error ? error.message : "Unknown error",
        }, { status: 400 });
    }
}