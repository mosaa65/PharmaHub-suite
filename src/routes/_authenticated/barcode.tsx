import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Printer, Search, Plus, Minus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/barcode")({
  component: BarcodePage,
});

interface LabelItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  expiry_date?: string;
  count: number;
}

type LabelSize = "small" | "medium" | "a4";

/** Generate a simple SVG barcode using Code128 algorithm (pure JS, no library needed) */
function generateBarcodeSVG(code: string, width = 180, height = 50): string {
  // Code 128 B character set mapping (simplified for ASCII 32-127)
  const CODE128B_PATTERNS: Record<number, string> = {
    32:"11011001100",33:"11001101100",34:"11001100110",35:"10010011000",36:"10010001100",
    37:"10001001100",38:"10011001000",39:"10011000100",40:"10001100100",41:"11001001000",
    42:"11001000100",43:"11000100100",44:"10110011100",45:"10011011100",46:"10011001110",
    47:"10111001100",48:"10011101100",49:"10011100110",50:"11001110010",51:"11001011100",
    52:"11001001110",53:"11011100100",54:"11001110100",55:"11101101110",56:"11101001100",
    57:"11100101100",58:"11100100110",59:"11101100100",60:"11100110100",61:"11100110010",
    62:"11011011000",63:"11011000110",64:"11000110110",65:"10100011000",66:"10001011000",
    67:"10001000110",68:"10110001000",69:"10001101000",70:"10001100010",71:"11010001000",
    72:"11000101000",73:"11000100010",74:"10110111000",75:"10110001110",76:"10001101110",
    77:"10111011000",78:"10111000110",79:"10001110110",80:"11101110110",81:"11010001110",
    82:"11000101110",83:"11011101000",84:"11011100010",85:"11011101110",86:"11101011000",
    87:"11101000110",88:"11100010110",89:"11101101000",90:"11101100010",91:"11100011010",
    92:"11101111010",93:"11001000010",94:"11110001010",95:"10100110000",96:"10100001100",
    97:"10010110000",98:"10010000110",99:"10000101100",100:"10000100110",101:"10110010000",
    102:"10110000100",103:"10011010000",104:"10011000010",105:"10000110100",106:"10000110010",
    107:"11000010010",108:"11001010000",109:"11110111010",110:"11000010100",111:"10001111010",
    112:"10100111100",113:"10010111100",114:"10010011110",115:"10111100100",116:"10011110100",
    117:"10011110010",118:"11110100100",119:"11110010100",120:"11110010010",121:"11011011110",
    122:"11011110110",123:"11110110110",124:"10101111000",125:"10100011110",126:"10001011110",
    127:"10111101000",
  };

  const START_B = "11010010000";
  const STOP = "1100011101011";

  let bits = START_B;
  let checksum = 104; // START B value

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const pattern = CODE128B_PATTERNS[charCode];
    if (!pattern) continue;
    bits += pattern;
    checksum += (charCode - 32) * (i + 1);
  }

  // Checksum character
  const checksumVal = (checksum % 103) + 32;
  bits += CODE128B_PATTERNS[checksumVal] ?? CODE128B_PATTERNS[32];
  bits += STOP;

  const barWidth = width / bits.length;
  let rects = "";
  let x = 0;
  let inBar = false;
  let barStart = 0;

  for (let i = 0; i <= bits.length; i++) {
    const bit = bits[i];
    if (bit === "1" && !inBar) { barStart = x; inBar = true; }
    else if (bit !== "1" && inBar) {
      rects += `<rect x="${barStart.toFixed(2)}" y="0" width="${(x - barStart).toFixed(2)}" height="${height}" fill="black"/>`;
      inBar = false;
    }
    x += barWidth;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>`;
}

function Label80({ item, size }: { item: LabelItem; size: LabelSize }) {
  const { t } = useI18n();
  const dims = { small: { w: 150, bh: 40, fsize: 9 }, medium: { w: 220, bh: 55, fsize: 10 }, a4: { w: 260, bh: 60, fsize: 11 } };
  const d = dims[size];
  const svg = item.barcode ? generateBarcodeSVG(item.barcode, d.w - 16, d.bh) : "";
  const expLabel = item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "";

  return (
    <div
      className="border border-gray-300 bg-white rounded-sm flex flex-col items-center p-1.5 gap-1 print:border-gray-400"
      style={{ width: d.w, fontSize: d.fsize }}
    >
      <div className="font-bold text-center leading-tight text-black line-clamp-2" style={{ fontSize: d.fsize + 1 }}>
        {item.name}
      </div>
      {svg && (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      {!svg && item.barcode && (
        <div className="text-center font-mono text-xs text-black">{item.barcode}</div>
      )}
      <div className="font-mono text-center text-black text-[9px]">{item.barcode}</div>
      <div className="flex justify-between w-full">
        <span className="font-bold text-black">{Number(item.price).toFixed(2)} {t("currency")}</span>
        {expLabel && <span className="text-gray-600" style={{ fontSize: d.fsize - 1 }}>انتهاء: {expLabel}</span>}
      </div>
    </div>
  );
}

function BarcodePage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [size, setSize] = useState<LabelSize>("medium");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products-barcode"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, barcode, price, expiry_date")
        .order("name");
      return data ?? [];
    },
  });

  const filtered = products.filter((p: any) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q);
  });

  const addProduct = (p: any) => {
    const existing = labels.find((l) => l.id === p.id);
    if (existing) {
      setLabels((ls) => ls.map((l) => l.id === p.id ? { ...l, count: l.count + 1 } : l));
    } else {
      setLabels((ls) => [...ls, { id: p.id, name: p.name, barcode: p.barcode ?? p.id.slice(0, 12), price: p.price, expiry_date: p.expiry_date, count: 1 }]);
    }
  };

  const updateCount = (id: string, delta: number) => {
    setLabels((ls) =>
      ls.map((l) => l.id === id ? { ...l, count: Math.max(0, l.count + delta) } : l)
        .filter((l) => l.count > 0)
    );
  };

  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>طباعة الملصقات</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: Arial, sans-serif; direction: rtl; }
            .grid { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; }
            .label { border: 1px solid #888; border-radius: 2px; padding: 4px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; background: white; page-break-inside: avoid; }
            @media print { @page { margin: 5mm; } }
          </style>
        </head>
        <body>
          <div class="grid">${content.innerHTML}</div>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }, []);

  const totalLabels = labels.reduce((s, l) => s + l.count, 0);

  return (
    <div>
      <PageHeader
        title={t("barcodeLabels")}
        icon={<Tag className="h-5 w-5" />}
        actions={
          <Button onClick={handlePrint} disabled={labels.length === 0} className="gap-2 gradient-primary">
            <Printer className="h-4 w-4" /> {t("printLabels")} ({totalLabels})
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Left: Product Selector */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-bold mb-3">{t("selectProducts")}</h3>
            <div className="relative mb-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="ps-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("noData")}</p>
              )}
              {filtered.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full text-start rounded-lg px-3 py-2 hover:bg-accent/40 transition flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.barcode || "بدون باركود"}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {Number(p.price).toFixed(2)} {t("currency")}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Labels List */}
          {labels.length > 0 && (
            <Card className="p-4">
              <h3 className="font-bold mb-3">{t("labelCount")}: {totalLabels}</h3>
              <div className="space-y-2">
                {labels.map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <div className="flex-1 text-sm truncate">{l.name}</div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCount(l.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{l.count}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateCount(l.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Size Selector */}
          <Card className="p-4">
            <Label className="mb-2 block">{t("labelSize")}</Label>
            <Select value={size} onValueChange={(v) => setSize(v as LabelSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{t("labelSmall")}</SelectItem>
                <SelectItem value="medium">{t("labelMedium")}</SelectItem>
                <SelectItem value="a4">{t("labelA4")}</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Right: Preview */}
        <div>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">معاينة الملصقات</h3>
              {labels.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setLabels([])}>
                  مسح الكل
                </Button>
              )}
            </div>
            {labels.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("selectProducts")} لعرض المعاينة</p>
              </div>
            ) : (
              <div ref={printRef} className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-xl min-h-32">
                {labels.flatMap((l) =>
                  Array.from({ length: l.count }, (_, i) => (
                    <Label80 key={`${l.id}-${i}`} item={l} size={size} />
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
