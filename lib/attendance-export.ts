import { getAttendanceStatusLabel } from "@/lib/flex-attendance";

type AttendanceExportRow = {
  name: string;
  email: string;
  grade: string;
  status: string;
  joinedAt: string;
  checkIn: string;
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildAttendanceRows(records: Array<{
  user: { name: string | null; email: string | null; grade: number | null };
  status: string;
  joinedAt: Date;
  checkIn: Date | null;
}>): AttendanceExportRow[] {
  return records.map((record) => ({
    name: record.user.name || "Unnamed student",
    email: record.user.email || "",
    grade: record.user.grade ? `Grade ${record.user.grade}` : "",
    status: getAttendanceStatusLabel(record.status as any),
    joinedAt: new Date(record.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "",
  }));
}

export function buildAttendanceCsv(title: string, rows: AttendanceExportRow[]) {
  const header = ["Session", "Student", "Email", "Grade", "Status", "Joined", "Check In"];
  const csvRows = [
    header.join(","),
    ...rows.map((row) =>
      [title, row.name, row.email, row.grade, row.status, row.joinedAt, row.checkIn]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  return csvRows.join("\n");
}

export function buildAttendancePdf(title: string, rows: AttendanceExportRow[]) {
  const lines = [
    `Attendance Export: ${title}`,
    "",
    ...rows.flatMap((row) => [
      `${row.name} | ${row.status}`,
      `${row.email}${row.grade ? ` | ${row.grade}` : ""}`,
      `Joined: ${row.joinedAt || "-"} | Check In: ${row.checkIn || "-"}`,
      "",
    ]),
  ];

  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...lines.map((line, index) => `${index === 0 ? "" : "0 -16 Td"} (${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];

  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const body = objects
    .map((object) => {
      xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
      offset += object.length + 1;
      return object;
    })
    .join("\n");

  const xrefStart = "%PDF-1.4\n".length + body.length + 1;
  const trailer = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return `%PDF-1.4\n${body}\n${trailer}`;
}
