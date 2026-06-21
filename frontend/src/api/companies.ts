import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

export interface CompanyProfile {
  raw_profile: {
    name: string;
    ticker: string;
    overview: string;
    facts: Record<string, string>;
    news: Array<{
      title: string;
      link: string;
      published_at: string;
    }>;
    financials: {
      current_price?: number;
      currency?: string;
      market_cap?: number;
      revenue_growth?: number;
      profit_margins?: number;
      "52_week_high"?: number;
      "52_week_low"?: number;
      sector?: string;
      industry?: string;
    };
  };
}

export const companiesApi = {
  search: async (query: string): Promise<SearchResult[]> => {
    const { data } = await api.get(`/companies/search?q=${query}`);
    return data.data;
  },

  getProfile: async (ticker: string, companyName?: string): Promise<CompanyProfile> => {
    const params = companyName ? { company_name: companyName } : {};
    const { data } = await api.get(`/companies/${ticker}`, { params });
    return data.data;
  }
};
