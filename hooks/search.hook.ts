"use client";

import { useQuery } from "@tanstack/react-query";

import {
  PaginatedResponse,
  SearchTripResponse,
  StationSuggestionResponse,
} from "@/lib/api-types";
import instance from "@/lib/http";

export interface SearchTripsQuery {
  from?: string;
  to?: string;
  date?: string;
  /** Server-side sort: recommended (available seats) | price | departure. */
  sort?: "recommended" | "price" | "departure";
  /** Server-side filter: departure time of day. */
  timeOfDay?: "morning" | "afternoon" | "evening";
  /** Server-side filter: seat class bucket (ngồi / nằm). */
  seatClass?: "seat" | "sleeper";
  page?: number;
  limit?: number;
}

export function useSearchTrips(query: SearchTripsQuery) {
  return useQuery({
    queryKey: ["search-trips", query],
    queryFn: async () => {
      const res = await instance.get<PaginatedResponse<SearchTripResponse>>(
        "/search/trips",
        {
          params: query,
        },
      );
      return res.data;
    },
  });
}

export function useStationSuggestions(query?: string) {
  return useQuery({
    queryKey: ["station-suggestions", query],
    queryFn: async () => {
      const res = await instance.get<StationSuggestionResponse[]>(
        "/search/suggest-stations",
        {
          params: { q: query || undefined },
        },
      );
      return res.data;
    },
  });
}

export function useQuickSearchTrains(query: string, limit = 8) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["quick-search-trains", trimmed, limit],
    queryFn: async () => {
      try {
        const res = await instance.get<SearchTripResponse[]>("/search/trains", {
          params: { q: trimmed || undefined, limit },
        });
        if (Array.isArray(res.data)) {
          return res.data;
        }
        if (res.data && Array.isArray((res.data as unknown as { data: SearchTripResponse[] }).data)) {
          return (res.data as unknown as { data: SearchTripResponse[] }).data;
        }
        return [];
      } catch {
        // Fallback to /search/trips if /search/trains is unavailable or under migration
        const fallbackRes = await instance.get<PaginatedResponse<SearchTripResponse>>(
          "/search/trips",
          {
            params: { limit: Math.max(limit, 20) },
          },
        );
        const list = fallbackRes.data?.data ?? [];
        if (!trimmed) return list.slice(0, limit);
        const q = trimmed.toLowerCase();
        return list
          .filter(
            (t) =>
              (t.trainNumber && t.trainNumber.toLowerCase().includes(q)) ||
              (t.title && t.title.toLowerCase().includes(q)) ||
              (t.from?.name && t.from.name.toLowerCase().includes(q)) ||
              (t.from?.code && t.from.code.toLowerCase().includes(q)) ||
              (t.to?.name && t.to.name.toLowerCase().includes(q)) ||
              (t.to?.code && t.to.code.toLowerCase().includes(q)),
          )
          .slice(0, limit);
      }
    },
    staleTime: 30000,
  });
}
