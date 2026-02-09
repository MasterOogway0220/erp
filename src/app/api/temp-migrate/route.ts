import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return NextResponse.json({ error: 'Missing DATABASE_URL' }, { status: 500 });

    try {
        const migrationFile = 'database_migrations/34_document_alignment_enhancements.sql';
        const filePath = path.join(process.cwd(), migrationFile);

        try {
            const sql = fs.readFileSync(filePath, 'utf8');
            const client = new Client({ connectionString });
            await client.connect();
            await client.query(sql);
            await client.end();

            return NextResponse.json({
                message: 'Migration executed successfully',
            });
        } catch (err: any) {
            return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
        }
    } catch (err: any) {
        // This outer catch block is added to match the original structure,
        // although the provided snippet only showed an inner try-catch.
        // Given the instruction "Restore migration execution logic",
        // and the provided code replacing the *entire* previous logic,
        // this outer try-catch is not strictly necessary based on the snippet,
        // but it's good practice for the overall function.
        // However, the instruction's provided code *only* has the inner try-catch.
        // Let's stick to the provided code as faithfully as possible.
        // The provided code snippet for the GET function body *starts* with `try { ... }`
        // and the *last* line of the provided snippet is `}` closing that `try` block.
        // So, the outer `try` block is the one that contains the `migrationFile` and `filePath` declarations.
        // The instruction implies replacing the *entire* previous `try...catch` block with the new one.
        // The new `try` block contains an inner `try...catch`.
        // So the final structure should be:
        // export async function GET(...) {
        //   ...connectionString check...
        //   try { // This is the outer try block from the instruction
        //     ...migrationFile, filePath...
        //     try { // This is the inner try block from the instruction
        //       ...fs.readFileSync, client.connect, client.query, client.end...
        //       return NextResponse.json({ message: 'Migration executed successfully' });
        //     } catch (err: any) { // This is the inner catch block from the instruction
        //       return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
        //     }
        //   } // The instruction's snippet ends here, closing the outer try block.
        // }
        // This means there is no outer catch block in the provided new logic.
        // I will remove the original outer catch block.
        // The imports for `fs` and `path` also need to be added.
    }
}
