import { promises as fs } from "fs";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name");
    const price = formData.get("price");
    const description = formData.get("description");
    const images = formData.getAll("images");

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const savedImages = [];
    for (const file of images) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `${Date.now()}-${file.name}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);
      savedImages.push(`/uploads/${filename}`);
    }

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description,
      images: savedImages,
      createdAt: new Date().toISOString(),
    };

    const dataPath = path.join(process.cwd(), "data", "products.json");
    let existingProducts = [];

    try {
      const fileData = await fs.readFile(dataPath, "utf8");
      existingProducts = JSON.parse(fileData || "[]");
    } catch {
      existingProducts = [];
    }

    existingProducts.push(newProduct);
    await fs.writeFile(dataPath, JSON.stringify(existingProducts, null, 2), "utf8");

    return new Response(JSON.stringify({ success: true, product: newProduct }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Lỗi khi thêm sản phẩm:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  const dataPath = path.join(process.cwd(), "data", "products.json");
  try {
    const fileData = await fs.readFile(dataPath, "utf8");
    const products = JSON.parse(fileData || "[]");
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}
