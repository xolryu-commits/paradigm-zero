import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 1. Supabase Admin 클라이언트 생성 (Service Role Key 사용)
// 주의: 이 키는 절대 클라이언트에 노출되면 안 됩니다.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// 데이터베이스 테이블 이름 정의
const TABLE_NAME = 'game_state';
// 저장할 행의 고정 ID (단일 게임 상태 저장용)
const ROW_ID = 1;

// GET: 게임 상태 불러오기
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('data')
      .eq('id', ROW_ID)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 결과 없음
      console.error("Supabase Load Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // 데이터가 없으면 null 반환 (클라이언트에서 초기값 사용)
    return NextResponse.json({ ok: true, data: data?.data || null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: 게임 상태 저장하기
export async function POST(req: Request) {
  try {
    // 관리자 키 검증
    const adminKey = req.headers.get("x-admin-key");
    if (adminKey !== "1217") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();

    // 데이터 저장 (Upsert: 없으면 생성, 있으면 수정)
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({ id: ROW_ID, data: payload });

    if (error) {
      console.error("Supabase Save Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}