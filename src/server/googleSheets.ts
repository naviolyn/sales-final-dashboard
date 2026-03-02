// src/server/googleSheets.ts
import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function fetchSheetValues(params: {
  spreadsheetId: string;
  rangeA1: string; // contoh: "DATA!A1:Z"
}) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: params.spreadsheetId,
    range: params.rangeA1,
  });

  return res.data.values ?? [];
}
