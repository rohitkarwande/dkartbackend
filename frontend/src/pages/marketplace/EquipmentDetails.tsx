import { useParams, useNavigate, Link } from "react-router-dom";
import { useSingleEquipment, useSimilarEquipment } from "@/hooks/useEquipment";
import type { Equipment } from "@/hooks/useEquipment";
import { useCreateInquiry } from "@/hooks/useInquiries";
import { 
  Loader2, MapPin, Tag, ShieldCheck, Mail, ArrowLeft, 
  Phone, Building2, Calendar, CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { EquipmentCard } from "@/components/shared/EquipmentCard";

export function EquipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: equipment, isLoading, isError } = useSingleEquipment(id || "");
  const { data: similar } = useSimilarEquipment(id || "");
  const createInquiry = useCreateInquiry();

  const [inquiryMsg, setInquiryMsg] = useState("I am interested in this equipment. Please share pricing and availability details.");
  const [isSent, setIsSent] = useState(false);
  const [inquiryError, setInquiryError] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-red-500 mb-4">Equipment not found or failed to load.</p>
        <Button asChild variant="outline"><Link to="/search">← Back to Search</Link></Button>
      </div>
    );
  }

  const handleContactSeller = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setInquiryError("");
    
    if (!id) {
      setInquiryError("Invalid equipment ID.");
      return;
    }

    try {
      console.log("Sending inquiry payload:", { equipment_post_id: id, message: inquiryMsg });
      await createInquiry.mutateAsync({
        equipment_post_id: id,
        message: inquiryMsg,
      });
      setIsSent(true);
    } catch (err: any) {
      console.error("Inquiry error response:", err.response?.data);
      const msg = err.response?.data?.error || "Failed to send inquiry.";
      setInquiryError(msg);
    }
  };

  const formattedPrice = equipment.price
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(equipment.price)
    : "Price on Request";

  const imageUrls = (equipment.images || []).map((img: any) => 
    typeof img === 'string' ? img : `http://localhost:3000${img.image_url}`
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back breadcrumb */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Image Gallery */}
          <div className="bg-white rounded-2xl overflow-hidden border shadow-sm">
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              {imageUrls.length > 0 ? (
                <img 
                  src={imageUrls[0]} 
                  alt={equipment.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"; }}
                />
              ) : (
                <div className="text-center text-slate-400">
                  <p className="text-lg font-medium">No Images Available</p>
                </div>
              )}
            </div>
            {imageUrls.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50 border-t">
                {imageUrls.slice(1).map((url: string, i: number) => (
                  <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg object-cover border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b">Equipment Specifications</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Category", equipment.category],
                ["Brand", equipment.brand],
                ["Model", equipment.model],
                ["Year of Manufacture", equipment.manufacturing_year || "Not specified"],
                ["Condition", equipment.condition],
                ["Status", equipment.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-slate-500 block mb-0.5">{label}</span>
                  <span className="font-semibold text-slate-900">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {equipment.description && (
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Description</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{equipment.description}</p>
            </div>
          )}
        </div>

        {/* Right: Price + CTA */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm sticky top-20">
            {/* Status badge */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="capitalize text-xs">{equipment.category}</Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${equipment.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600'}`}
              >
                {equipment.status}
              </Badge>
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">{equipment.title}</h1>
            <p className="text-slate-500 text-sm mb-4">{equipment.brand} · {equipment.model}</p>

            <div className="text-3xl font-bold text-slate-900 mb-5">{formattedPrice}</div>

            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                {[equipment.city, equipment.state].filter(Boolean).join(", ") || "Location not specified"}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Tag className="h-4 w-4 mr-2 text-slate-400" />
                Condition: <span className="font-medium ml-1">{equipment.condition}</span>
              </div>
              {equipment.manufacturing_year && (
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  Manufactured: {equipment.manufacturing_year}
                </div>
              )}
              <div className="flex items-center text-sm text-emerald-600 font-medium">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verified Seller
              </div>
            </div>

            {/* Inquiry CTA */}
            {isSent ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-700">Inquiry Sent!</p>
                <p className="text-sm text-green-600 mt-1">The seller will contact you soon. Check your inquiries dashboard.</p>
                <Button asChild variant="link" size="sm" className="mt-2 text-green-700">
                  <Link to="/dashboard/inquiries">View My Inquiries →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                  placeholder="Write your message to the seller..."
                  className="resize-none text-sm"
                  rows={3}
                />
                {inquiryError && (
                  <p className="text-xs text-red-600">{inquiryError}</p>
                )}
                <Button
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  onClick={handleContactSeller}
                  disabled={createInquiry.isPending}
                >
                  {createInquiry.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" /> Contact Seller</>
                  )}
                </Button>
                {!localStorage.getItem("token") && (
                  <p className="text-xs text-center text-slate-500">
                    <Link to="/login" className="text-emerald-600 font-medium hover:underline">Login</Link> required to contact seller
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similar && similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Similar Equipment</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {similar.slice(0, 5).map((item) => (
              <EquipmentCard
                key={item.id}
                id={String(item.id)}
                title={item.title}
                brand={item.brand}
                price={item.price}
                location={[item.city, item.state].filter(Boolean).join(", ") || "India"}
                condition={item.condition}
                image={(item.images?.[0] as any)?.image_url 
                  ? `http://localhost:3000${(item.images[0] as any).image_url}` 
                  : "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800"}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
