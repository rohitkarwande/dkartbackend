import { useMyListings, useDeleteEquipment, useUpdateEquipmentStatus } from "@/hooks/useEquipment";
import type { Equipment } from "@/hooks/useEquipment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Loader2, PlusCircle, Trash2, Archive, CheckCircle2, 
  MapPin, Calendar, Eye
} from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  Active: "bg-green-50 text-green-700 border-green-200",
  Draft: "bg-amber-50 text-amber-700 border-amber-200",
  Sold: "bg-blue-50 text-blue-700 border-blue-200",
  Archived: "bg-slate-100 text-slate-500 border-slate-200",
};

export function Listings() {
  const { data: listings, isLoading, isError } = useMyListings();
  const deleteEquipment = useDeleteEquipment();
  const updateStatus = useUpdateEquipmentStatus();
  const [confirmDelete, setConfirmDelete] = useState<string | number | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-xl">
        Failed to load listings. Make sure you're logged in as a seller.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Equipment Listings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your inventory · {listings?.length ?? 0} total listing{listings?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Link to="/sell">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Listing
          </Link>
        </Button>
      </div>

      {!listings?.length ? (
        <div className="bg-white border border-dashed rounded-xl p-16 text-center">
          <PlusCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No listings yet</h3>
          <p className="text-slate-400 mb-6 text-sm">Create your first equipment listing to start receiving inquiries.</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/sell">Create First Listing</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((item: Equipment) => {
            const imageUrl = item.images?.[0]
              ? `http://localhost:3000${(item.images[0] as any).image_url || item.images[0]}`
              : null;
            const formattedPrice = item.price
              ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price)
              : "Price on Request";

            return (
              <div key={item.id} className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-36 h-32 sm:h-auto bg-slate-100 shrink-0">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${statusColors[item.status] || ''}`}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-slate-400">{item.category}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-slate-500 mb-2">{item.brand} · {item.model}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item.city || "Location not set"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Price + Actions */}
                    <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-between gap-3 shrink-0">
                      <div className="text-lg font-bold text-slate-900">{formattedPrice}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/equipment/${item.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Link>
                        </Button>
                        {item.status === 'Draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatus.mutate({ id: item.id, status: 'Active' })}
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activate
                          </Button>
                        )}
                        {item.status === 'Active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => updateStatus.mutate({ id: item.id, status: 'Sold' })}
                            disabled={updateStatus.isPending}
                          >
                            Mark Sold
                          </Button>
                        )}
                        {confirmDelete === item.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600">Sure?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => {
                                deleteEquipment.mutate(item.id);
                                setConfirmDelete(null);
                              }}
                              disabled={deleteEquipment.isPending}
                            >
                              Yes, Archive
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDelete(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmDelete(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
