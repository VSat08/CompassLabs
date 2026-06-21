import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, Calendar, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';
import { companiesApi, type CompanyProfile as ICompanyProfile } from '../api/companies';
import SearchBar from '../components/SearchBar';

export default function CompanyProfile() {
  const { ticker } = useParams<{ ticker: string }>();
  const location = useLocation();
  const companyName = location.state?.companyName;
  const [data, setData] = useState<ICompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [ticker]);

  // Number formatters
  const formatMarketCap = (num?: number, currency: string = 'USD') => {
    if (!num) return "N/A";
    const prefix = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || '$';
    if (num >= 1e12) return `${prefix}${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M`;
    return `${prefix}${num.toLocaleString()}`;
  };

  const formatPrice = (num?: number, currency: string = 'USD') => {
    if (num === undefined || num === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  useEffect(() => {
    async function fetchData() {
      if (!ticker) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await companiesApi.getProfile(ticker, companyName);
        setData(response);
        document.title = `${response.raw_profile.name} | CompassLabs`;
      } catch (err: unknown) {
        // Narrow the error type if it's from Axios
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setError(`Company "${companyName || ticker.split('.')[0]}" could not be found.`);
        } else {
          setError("An error occurred while fetching company data. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    // Reset title on unmount
    return () => { document.title = 'CompassLabs'; };
  }, [ticker, companyName]);

  return (
    <div className="min-h-screen bg-(--cl-color-bg) text-(--cl-color-text) font-sans selection:bg-(--cl-color-primary-soft)">
      
      {/* Persistent Navigation */}
      <header className="border-b border-(--cl-color-border) bg-(--cl-color-surface) sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/workspace" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-(--cl-radius-sm) bg-(--cl-color-primary) flex items-center justify-center shadow-(--cl-shadow-sm)">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-(--cl-color-text) hidden sm:block">
              Compass<span className="text-(--cl-color-primary)">Labs</span>
            </span>
          </Link>
          <div className="flex-1 max-w-xl ml-8">
            <SearchBar />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-(--cl-color-primary-soft) border-t-(--cl-color-primary) rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-semibold text-(--cl-color-text)">Analyzing {companyName || ticker.split('.')[0]}...</h2>
            <p className="text-(--cl-color-text-muted) mt-2">Gathering data from Wikipedia, Wikidata, and Yahoo Finance</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-16 h-16 text-(--cl-color-error) mb-4" />
            <h2 className="text-3xl font-bold text-(--cl-color-text) mb-2">Not Found</h2>
            <p className="text-(--cl-color-text-muted) max-w-md">{error}</p>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-(--cl-color-primary) text-white px-6 py-2 rounded-(--cl-radius-md) font-medium hover:bg-(--cl-color-primary-hover) transition-colors"
              >
                Try Again
              </button>
              <Link to="/workspace" className="flex items-center gap-2 text-(--cl-color-primary) hover:text-(--cl-color-primary-hover) px-4">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header Section */}
            <div className="mb-12">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-5xl font-extrabold text-(--cl-color-text) tracking-tight mb-2">
                    {data.raw_profile.name}
                  </h1>
                  <div className="flex items-center gap-4 text-(--cl-color-text-muted) font-medium">
                    <span className="px-3 py-1 bg-(--cl-color-surface-soft) rounded-(--cl-radius-sm) text-(--cl-color-text) border border-(--cl-color-border)">
                      {data.raw_profile.ticker.split('.')[0]}
                    </span>
                    {data.raw_profile.financials.sector && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> {data.raw_profile.financials.sector}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Overview & Facts */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Overview Card */}
                <div className="bg-(--cl-color-surface) border border-(--cl-color-border) rounded-(--cl-radius-lg) p-8 shadow-(--cl-shadow-md)">
                  <h3 className="text-xl font-semibold text-(--cl-color-text) mb-4">Company Overview</h3>
                  <p className="text-(--cl-color-text-muted) leading-relaxed text-lg">
                    {data.raw_profile.overview}
                  </p>
                </div>

                {/* News Feed */}
                <div className="bg-(--cl-color-surface) border border-(--cl-color-border) rounded-(--cl-radius-lg) p-8 shadow-(--cl-shadow-md)">
                  <h3 className="text-xl font-semibold text-(--cl-color-text) mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-(--cl-color-primary)" /> Recent News
                  </h3>
                  <div className="space-y-6">
                    {data.raw_profile.news.map((item, i) => (
                      <a 
                        key={i} 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group block border-b border-(--cl-color-border) last:border-0 pb-6 last:pb-0"
                      >
                        <h4 className="text-lg text-(--cl-color-text) group-hover:text-(--cl-color-primary) transition-colors font-medium mb-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-(--cl-color-text-muted)">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.published_at).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Financials & Facts */}
              <div className="space-y-8">
                
                {/* Financial Snapshot */}
                <div className="bg-(--cl-color-surface) border border-(--cl-color-border) rounded-(--cl-radius-lg) p-8 shadow-(--cl-shadow-md)">
                  <h3 className="text-xl font-semibold text-(--cl-color-text) mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-(--cl-color-success)" /> Financial Snapshot
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-(--cl-color-text-muted) font-medium mb-1">Market Cap</div>
                      <div className="text-3xl font-bold text-(--cl-color-text)">
                        {formatMarketCap(data.raw_profile.financials.market_cap, data.raw_profile.financials.currency)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-(--cl-color-text-muted) font-medium mb-1">Current Price</div>
                        <div className="text-xl font-semibold text-(--cl-color-text)">
                          {formatPrice(data.raw_profile.financials.current_price, data.raw_profile.financials.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-(--cl-color-text-muted) font-medium mb-1">52W High</div>
                        <div className="text-xl font-semibold text-(--cl-color-text)">
                          {formatPrice(data.raw_profile.financials["52_week_high"], data.raw_profile.financials.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Facts */}
                <div className="bg-(--cl-color-surface) border border-(--cl-color-border) rounded-(--cl-radius-lg) p-8 shadow-(--cl-shadow-md)">
                  <h3 className="text-xl font-semibold text-(--cl-color-text) mb-6">Quick Facts</h3>
                  <div className="space-y-4">
                    {data.raw_profile.facts.founded && (
                      <div className="flex justify-between items-center py-2 border-b border-(--cl-color-border)">
                        <span className="text-(--cl-color-text-muted)">Founded</span>
                        <span className="text-(--cl-color-text) font-medium">{data.raw_profile.facts.founded}</span>
                      </div>
                    )}
                    {data.raw_profile.facts.website && (
                      <div className="flex justify-between items-center py-2 border-b border-(--cl-color-border)">
                        <span className="text-(--cl-color-text-muted)">Website</span>
                        <a 
                          href={data.raw_profile.facts.website.startsWith('http') ? data.raw_profile.facts.website : `https://${data.raw_profile.facts.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-(--cl-color-primary) hover:text-(--cl-color-primary-hover) font-medium flex items-center gap-1"
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {data.raw_profile.financials.industry && (
                      <div className="flex justify-between items-center py-2 border-b border-(--cl-color-border)">
                        <span className="text-(--cl-color-text-muted)">Industry</span>
                        <span className="text-(--cl-color-text) font-medium text-right max-w-[150px] truncate">
                          {data.raw_profile.financials.industry}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
