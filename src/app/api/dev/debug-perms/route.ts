
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export async function GET() {
    const logs: string[] = [];
    try {
        const docsPath = path.join(process.cwd(), 'documents');
        if (fs.existsSync(docsPath)) {
            const files = fs.readdirSync(docsPath);
            logs.push(`Files in docs (${files.length}): ${files.join(', ')}`);

            for (const f of files.filter(x => x.endsWith('.xlsx')).slice(0, 3)) {
                const fullPath = path.join(docsPath, f);
                try {
                    const stats = fs.statSync(fullPath);
                    logs.push(`File: ${f}, Size: ${stats.size}, Mode: ${stats.mode}`);
                    const fd = fs.openSync(fullPath, 'r');
                    logs.push(`Successfully opened ${f}`);
                    fs.closeSync(fd);
                } catch (err: any) {
                    logs.push(`Failed to access ${f}: ${err.message}`);
                }
            }
        } else {
            logs.push('Documents dir not found');
        }

        return NextResponse.json({ success: true, logs });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
