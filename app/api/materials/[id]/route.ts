// GET /api/materials/[id] —— 占位（真实逻辑在 client localStorage,这里只是为了让 fetch 不 404）
// 客户端会自己从 localStorage 读取 material,如果 client 已有就不需要这个端点。
// 但 /learn?source=material&id=xxx 走 server 渲染会调到这里。

export async function GET() {
  return new Response(JSON.stringify({ error: "用户上传的资料存储在浏览器本地,请通过客户端导航进入" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}
