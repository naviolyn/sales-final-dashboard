import { NextResponse } from "next/server";
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

export async function GET() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const spreadsheetId = "1YCtYBlhWhLO28o-bV09o3osfwbW7k8_P6ACqO2xONgc";

  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });

  const tabs =
    res.data.sheets?.map((s) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title,
    })) ?? [];

  return NextResponse.json({ spreadsheetId, tabs });
}
