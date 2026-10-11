import { NextResponse } from "next/server";

/** Endpoint data pengguna: ekspor (GET) dan hapus (DELETE) data lokal. */
export async function GET() {
  return NextResponse.json({
    message: "export endpoint ready",
  });
}

/** Menghapus data pengguna. Backend belum tersedia, jadi ini masih no-op. */
export async function DELETE() {
  return NextResponse.json({
    message: "delete endpoint ready",
  });
}
