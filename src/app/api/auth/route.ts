import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    const pinSuami = process.env.NEXT_PUBLIC_PIN_SUAMI || "123456";
    const pinIstri = process.env.NEXT_PUBLIC_PIN_ISTRI || "654321";

    if (pin === pinSuami) {
      return NextResponse.json({ success: true, user: "suami" });
    } else if (pin === pinIstri) {
      return NextResponse.json({ success: true, user: "istri" });
    }

    return NextResponse.json(
      { success: false, message: "PIN salah" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}