/**
 * Canonical North–South railway station list (fallback when the
 * station-suggestions API is unavailable). Single source of truth shared by
 * the home page, search page, ticket catalogue and the 2D route map.
 */
export const STATIONS = [
  { code: "HAN", name: "Hà Nội", km: "0 km", kmNum: 0 },
  { code: "PLY", name: "Phủ Lý", km: "56 km", kmNum: 56 },
  { code: "NDH", name: "Nam Định", km: "87 km", kmNum: 87 },
  { code: "NBI", name: "Ninh Bình", km: "115 km", kmNum: 115 },
  { code: "BSO", name: "Bỉm Sơn", km: "141 km", kmNum: 141 },
  { code: "THA", name: "Thanh Hóa", km: "176 km", kmNum: 176 },
  { code: "VIH", name: "Vinh", km: "319 km", kmNum: 319 },
  { code: "HPO", name: "Hương Phố", km: "387 km", kmNum: 387 },
  { code: "DHO", name: "Đồng Hới", km: "522 km", kmNum: 522 },
  { code: "DHA", name: "Đông Hà", km: "622 km", kmNum: 622 },
  { code: "HUE", name: "Huế", km: "688 km", kmNum: 688 },
  { code: "DAD", name: "Đà Nẵng", km: "791 km", kmNum: 791 },
  { code: "TKY", name: "Tam Kỳ", km: "865 km", kmNum: 865 },
  { code: "QNG", name: "Quảng Ngãi", km: "928 km", kmNum: 928 },
  { code: "DTR", name: "Diêu Trì", km: "1.096 km", kmNum: 1096 },
  { code: "QNH", name: "Quy Nhơn", km: "1.106 km", kmNum: 1106 },
  { code: "THO", name: "Tuy Hòa", km: "1.198 km", kmNum: 1198 },
  { code: "NTR", name: "Nha Trang", km: "1.315 km", kmNum: 1315 },
  { code: "TCH", name: "Tháp Chàm", km: "1.408 km", kmNum: 1408 },
  { code: "PTH", name: "Phan Thiết", km: "1.500 km", kmNum: 1500 },
  { code: "BTH", name: "Bình Thuận", km: "1.522 km", kmNum: 1522 },
  { code: "LKH", name: "Long Khánh", km: "1.649 km", kmNum: 1649 },
  { code: "BHO", name: "Biên Hòa", km: "1.697 km", kmNum: 1697 },
  { code: "SGN", name: "Sài Gòn", km: "1.726 km", kmNum: 1726 },
] as const;

export type Station = (typeof STATIONS)[number];

export function findStationByCode(code?: string | null): Station | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return STATIONS.find((s) => s.code.toUpperCase() === upper);
}

export function estimateJourneyHours(fromCode?: string, toCode?: string): number {
  const from = findStationByCode(fromCode);
  const to = findStationByCode(toCode);
  if (!from || !to) return 4;
  const distance = Math.abs(to.kmNum - from.kmNum);
  // Average train speed ~ 55-60 km/h on North-South railway
  return Math.max(1, Math.round((distance / 58) * 10) / 10);
}
