import OpenAI from "openai";

const deepseekApiKey = process.env.DEEPSEEK_API_KEY || "";
const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: "https://api.deepseek.com/v1",
});

export async function chatCompletion(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  tools?: any[]
) {
  const response = await deepseek.chat.completions.create({
    model: deepseekModel,
    messages: [
      {
        role: "system",
        content: `Anda adalah asisten keuangan keluarga Dhaniar. Tugas Anda adalah mencatat transaksi ke DATABASE menggunakan function tools.

PERATURAN WAJIB (JANGAN DILANGGAR):
1. Jika user menyebut nominal uang (50rb, 5jt, 100rb, dll), Anda WAJIB langsung memanggil function tool untuk menyimpan data.
2. JANGAN PERNAH bertanya "siapa pencatatnya" atau "suami atau istri". Gunakan created_by dari parameter yang diberikan.
3. JANGAN PERNAH bertanya "pribadi atau toko". Default: "pribadi".
4. JANGAN PERNAH bertanya "tanggal". Default: hari ini.
5. Jika user menyebut "token" + nominal → langsung upsert_transaction dengan type:"pengeluaran", category:"Token Listrik"
6. Jika user menyebut "gaji" + nominal → langsung upsert_transaction dengan type:"pemasukan", category:"Gaji"  
7. Jika user menyebut "hutang" + nama + nominal → langsung upsert_debt
8. Jika user menyebut "lunas" → langsung update_debt_status
9. Jika user menyebut "beli saham" + nama + nominal → langsung upsert_asset
10. Jika user menyebut "ingatkan" + judul + tanggal + nominal → langsung upsert_reminder
11. KONVERSI: "rb"×1000, "jt"×1000000. Contoh "50rb"=50000, "5jt"=5000000
12. Setelah berhasil panggil function, beri konfirmasi ke user bahwa data sudah dicatat.
13. Balas BAHASA INDONESIA yang ramah.`,
      },
      ...messages,
    ],
    tools: tools || undefined,
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0].message;
}

export const SYSTEM_TOOLS = [
  {
    type: "function",
    function: {
      name: "upsert_transaction",
      description:
        "Mencatat pemasukan atau pengeluaran baru, atau update yang sudah ada",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID transaksi jika update (kosongkan untuk baru)",
          },
          scope: {
            type: "string",
            enum: ["pribadi", "toko"],
            description: "Scope transaksi",
          },
          store_id: {
            type: "string",
            description: "ID toko (jika scope toko)",
          },
          type: {
            type: "string",
            enum: ["pemasukan", "pengeluaran"],
            description: "Jenis transaksi",
          },
          amount: {
            type: "number",
            description: "Jumlah nominal",
          },
          category: {
            type: "string",
            description: "Kategori (contoh: Makanan, Transport, Gaji, dll)",
          },
          description: {
            type: "string",
            description: "Deskripsi transaksi",
          },
          date: {
            type: "string",
            description: "Tanggal (YYYY-MM-DD)",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["scope", "type", "amount", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_debt",
      description:
        "Mencatat atau update hutang/piutang baru",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID hutang jika update",
          },
          scope: {
            type: "string",
            enum: ["pribadi", "toko"],
            description: "Scope hutang",
          },
          type: {
            type: "string",
            enum: ["hutang_saya", "hutang_orang"],
            description: "Jenis hutang",
          },
          person_name: {
            type: "string",
            description: "Nama orang",
          },
          amount: {
            type: "number",
            description: "Jumlah nominal",
          },
          status: {
            type: "string",
            enum: ["belum_lunas", "lunas"],
            description: "Status hutang",
          },
          due_date: {
            type: "string",
            description: "Tanggal jatuh tempo (YYYY-MM-DD)",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["scope", "type", "person_name", "amount", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_asset",
      description:
        "Mencatat atau update aset/portofolio",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID aset jika update",
          },
          name: {
            type: "string",
            description: "Nama aset (contoh: BBCA, TLKM, Gold)",
          },
          category: {
            type: "string",
            enum: ["saham", "forex", "emas", "dll"],
            description: "Kategori aset",
          },
          amount: {
            type: "number",
            description: "Nilai/jumlah aset",
          },
          metadata: {
            type: "object",
            description: "Data tambahan (contoh: jumlah lot, harga beli, dll)",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["name", "category", "amount", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_budget",
      description:
        "Mencatat atau update budget bulanan",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID budget jika update",
          },
          scope: {
            type: "string",
            enum: ["pribadi", "toko"],
            description: "Scope budget",
          },
          category: {
            type: "string",
            description: "Kategori budget",
          },
          monthly_limit: {
            type: "number",
            description: "Batas budget bulanan",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["scope", "category", "monthly_limit", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_reminder",
      description:
        "Mencatat atau update pengingat tagihan/hutang",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID reminder jika update",
          },
          title: {
            type: "string",
            description: "Judul pengingat",
          },
          amount: {
            type: "number",
            description: "Jumlah nominal",
          },
          due_date: {
            type: "string",
            description: "Tanggal jatuh tempo (YYYY-MM-DD)",
          },
          type: {
            type: "string",
            enum: ["tagihan", "hutang", "piutang"],
            description: "Tipe pengingat",
          },
          status: {
            type: "string",
            enum: ["pending", "lunas"],
            description: "Status",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["title", "due_date", "type", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_saving_goal",
      description:
        "Mencatat atau update target tabungan",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID saving goal jika update",
          },
          goal_name: {
            type: "string",
            description: "Nama target tabungan",
          },
          target_amount: {
            type: "number",
            description: "Jumlah target",
          },
          current_amount: {
            type: "number",
            description: "Jumlah sudah ditabung",
          },
          target_date: {
            type: "string",
            description: "Target tanggal tercapai (YYYY-MM-DD)",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["goal_name", "target_amount", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_transaction",
      description: "Menghapus transaksi berdasarkan ID",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID transaksi yang akan dihapus",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_debt_status",
      description:
        "Update status hutang menjadi lunas atau belum_lunas",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID hutang",
          },
          status: {
            type: "string",
            enum: ["lunas", "belum_lunas"],
            description: "Status baru",
          },
          created_by: {
            type: "string",
            enum: ["suami", "istri"],
            description: "Pencatat",
          },
        },
        required: ["id", "status", "created_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description:
        "Mendapatkan ringkasan kesehatan keuangan terkini",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_transactions",
      description: "Mencari transaksi berdasarkan keyword, kategori, atau nominal. Berguna untuk menemukan ID transaksi sebelum menghapus.",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Kata kunci pencarian (contoh: token, gaji, makan, 50000)",
          },
          type: {
            type: "string",
            enum: ["pemasukan", "pengeluaran"],
            description: "Filter berdasarkan jenis transaksi",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_all_transactions",
      description: "MENGHAPUS SEMUA transaksi dalam database. Gunakan hanya jika user meminta reset total. Beri konfirmasi ke user sebelum menjalankan.",
      parameters: {
        type: "object",
        properties: {
          confirm: {
            type: "boolean",
            description: "Konfirmasi dari user. WAJIB true untuk menjalankan.",
          },
        },
        required: ["confirm"],
      },
    },
  },
];
