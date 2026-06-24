import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search as SearchIcon, Filter, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["MRI", "X-Ray", "Cathlab", "ECG", "Ultrasound", "Refurbished", "Spare_Parts", "Monitoring", "Surgical", "Diagnostic"];
const CONDITIONS = ["New", "Refurbished", "Used", "Spare Parts"];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category") ? [searchParams.get("category")!] : []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    keyword: keyword || undefined,
    category: selectedCategories[0] || undefined,
    condition: selectedConditions[0] || undefined,
  };

  const { data: equipment, isLoading, isError } = useEquipment(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    if (keyword) params.keyword = keyword;
    if (selectedCategories[0]) params.category = selectedCategories[0];
    if (selectedConditions[0]) params.condition = selectedConditions[0];
    setSearchParams(params);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? [] : [cat]);
  };
  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev => prev.includes(cond) ? [] : [cond]);
  };
  const clearAll = () => {
    setKeyword("");
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSearchParams({});
  };

  const hasFilters = keyword || selectedCategories.length > 0 || selectedConditions.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search medical equipment by name, brand, or category..." 
            className="pl-11 h-12 text-base border-slate-200"
          />
        </div>
        <Button type="submit" className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 font-semibold">
          Search
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="h-12 px-4 md:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </form>

      <div className="flex gap-8">
        
        {/* Sidebar Filters */}
        <div className={`w-56 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" /> Filters
              </h3>
              {hasFilters && (
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Category</h4>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cat-${cat}`}
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      <label htmlFor={`cat-${cat}`} className="text-sm text-slate-600 cursor-pointer">
                        {cat.replace("_", " ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Condition</h4>
                <div className="space-y-2">
                  {CONDITIONS.map((cond) => (
                    <div key={cond} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cond-${cond}`}
                        checked={selectedConditions.includes(cond)}
                        onCheckedChange={() => toggleCondition(cond)}
                      />
                      <label htmlFor={`cond-${cond}`} className="text-sm text-slate-600 cursor-pointer">
                        {cond}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {keyword && <Badge variant="secondary" className="gap-1">{keyword} <button onClick={() => setKeyword("")}><X className="h-3 w-3" /></button></Badge>}
              {selectedCategories.map(c => <Badge key={c} variant="secondary" className="gap-1">{c} <button onClick={() => toggleCategory(c)}><X className="h-3 w-3" /></button></Badge>)}
              {selectedConditions.map(c => <Badge key={c} variant="secondary" className="gap-1">{c} <button onClick={() => toggleCondition(c)}><X className="h-3 w-3" /></button></Badge>)}
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              {isLoading ? "Searching..." : `${equipment?.length ?? 0} Results Found`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
              Failed to search equipment. Make sure the backend is running.
            </div>
          ) : !equipment?.length ? (
            <div className="p-16 text-center border rounded-xl bg-white border-dashed">
              <SearchIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No equipment found</h3>
              <p className="text-slate-400 mt-1 mb-6">Try adjusting your search terms or removing some filters.</p>
              <Button variant="outline" onClick={clearAll}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.map((item: any) => (
                <EquipmentCard 
                  key={item.id}
                  id={String(item.id)}
                  title={item.title}
                  brand={item.brand}
                  price={item.price}
                  location={[item.city, item.state].filter(Boolean).join(", ") || "India"}
                  condition={item.condition}
                  image={item.images?.[0]?.image_url 
                    ? `http://localhost:3000${item.images[0].image_url}` 
                    : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
