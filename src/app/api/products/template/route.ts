import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = [
  "name",
  "sku",
  "category",
  "description",
  "price",
  "discountPercent",
  "cost",
  "quantity",
  "reorderLevel",
  "status",
  "imageFolderPath",
  "image1",
  "image2",
  "image3",
  "image4",
  "image5",
];

const rows = [
  {
    name: "Sample Product 1",
    sku: "ABC-001",
    category: "Electronics",
    description: "Short product description",
    price: 999,
    discountPercent: 10,
    cost: 700,
    quantity: 25,
    reorderLevel: 5,
    status: "active",
    imageFolderPath: "/home/dev/product-images/ABC-001",
    image1: "front.jpg",
    image2: "side.jpg",
    image3: "back.jpg",
    image4: "",
    image5: "",
  },
  {
    name: "Sample Product 2",
    sku: "ABC-002",
    category: "Office",
    description: "Another product description",
    price: 499,
    discountPercent: 0,
    cost: 250,
    quantity: 50,
    reorderLevel: 10,
    status: "draft",
    imageFolderPath: "/home/dev/product-images/ABC-002",
    image1: "main.png",
    image2: "",
    image3: "",
    image4: "",
    image5: "",
  },
];

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv() {
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape(row[header as keyof (typeof rows)[number]]))
        .join(",")
    ),
  ].join("\n");
}

function csvResponse() {
  return new NextResponse(buildCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="product-upload-template.csv"',
    },
  });
}

function xlsxResponse() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [
        "Required: name, sku, price, cost, quantity. Status: active, draft, archived. imageFolderPath and image1-image5 are optional references for organizing product pictures.",
      ],
    ],
    { origin: `A${rows.length + 4}` }
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
  const body = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(body).set(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="product-upload-template.xlsx"',
    },
  });
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  return format === "xlsx" ? xlsxResponse() : csvResponse();
}
