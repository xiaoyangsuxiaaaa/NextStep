// 直接填写新密钥，无需读取文件/环境变量
const apiKey = "sk-502a458e92cc43fe9de23c92de7bfa9e";
console.log("当前生效的Key：", apiKey);import fs from "fs";
import path from "path";

function getDeepSeekKey() {
  if (process.env.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY;
  }

  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return "";
  }

  const envText = fs.readFileSync(envPath, "utf-8");
  const match = envText.match(/^DEEPSEEK_API_KEY=(.*)$/m);

  if (!match) return "";

  return match[1].trim().replace(/^["']|["']$/g, "");
}import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // ── Step 1: Check API Key ──
    console.log("[analyze] Step 1 — 收到请求");

    
   
    console.log("[analyze] Step 1 OK — key prefix:", apiKey.slice(0, 8));

    // ── Step 2: Parse request body ──
    console.log("[analyze] Step 2 — 解析请求体");

    let goal: string;
    let experiences: { type: string; content: string; source: string }[];
    try {
      const body = await request.json();
      goal = body.goal;
      experiences = body.experiences;
    } catch (e) {
      console.log("[analyze] Step 2 FAIL — JSON 解析失败:", e);
      return NextResponse.json({ stage: "body", error: "无法解析请求体", detail: String(e) }, { status: 400 });
    }

    if (!goal || !experiences?.length) {
      console.log("[analyze] Step 2 FAIL — 缺少字段", { goal: !!goal, count: experiences?.length });
      return NextResponse.json({ stage: "body", error: "缺少 goal 或 experiences" }, { status: 400 });
    }
    console.log("[analyze] Step 2 OK — goal:", goal, "expCount:", experiences.length);

    // ── Step 3: Call DeepSeek ──
    console.log("[analyze] Step 3 — 调用 DeepSeek API");

    let dsResponse: Response;
    try {
      dsResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          thinking: { enabled: false },
          messages: [
            { role: "system", content: "用中文回答，直接说结论，不要格式。" },
            { role: "user", content: `目标: ${goal}\n\n经验内容: ${experiences.map((e) => e.content).join(" | ")}` },
          ],
          max_tokens: 500,
        }),
      });
    } catch (e) {
      console.log("[analyze] Step 3 FAIL — fetch 网络错误:", e);
      return NextResponse.json({ stage: "fetch", error: "无法连接 DeepSeek API", detail: String(e) }, { status: 502 });
    }

    // ── Step 4: Check status ──
    console.log("[analyze] Step 4 — DeepSeek status:", dsResponse.status);

    const responseText = await dsResponse.text();
    console.log("[analyze] Step 4 — response body length:", responseText.length);
    console.log("[analyze] Step 4 — response body:", responseText.slice(0, 600));

    if (!dsResponse.ok) {
      console.log("[analyze] Step 4 FAIL — 非 200:", dsResponse.status);
      return NextResponse.json({
        stage: "deepseek_status",
        error: `DeepSeek 返回 ${dsResponse.status}`,
        detail: responseText.slice(0, 500),
      }, { status: 502 });
    }

    // ── Step 5: Parse DeepSeek response ──
    console.log("[analyze] Step 5 — 解析 DeepSeek JSON");

    let dsData: { choices?: { message?: { content?: string } }[] };
    try {
      dsData = JSON.parse(responseText);
    } catch (e) {
      console.log("[analyze] Step 5 FAIL — DeepSeek response 不是 JSON:", String(e));
      return NextResponse.json({
        stage: "deepseek_json",
        error: "DeepSeek 返回不是 JSON",
        detail: responseText.slice(0, 500),
      }, { status: 502 });
    }

    const content = dsData?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.log("[analyze] Step 5 FAIL — choices[0].message.content 为空");
      return NextResponse.json({
        stage: "deepseek_content",
        error: "DeepSeek 返回 content 为空",
        detail: responseText.slice(0, 500),
      }, { status: 502 });
    }

    // ── Success ──
    console.log("[analyze] Step 5 OK — AI 返回内容长度:", content.length);
    console.log("========== AI CONTENT ==========");
    console.log(content);
    console.log("========== END ==========");

    return NextResponse.json({ ok: true, content, stage: "success" });
  } catch (e) {
    console.log("[analyze] 外层 catch — 未预期的错误:", e);
    return NextResponse.json({
      stage: "unknown",
      error: "未预期的服务器错误",
      detail: String(e),
    }, { status: 500 });
  }
}
