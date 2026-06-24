import { MapPin, Verified } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EquipmentCardProps {
  id: string;
  title: string;
  brand: string;
  price: number;
  location: string;
  condition: string;
  image: string;
  isVerified?: boolean;
}

export function EquipmentCard({
  id,
  title,
  brand,
  price,
  location,
  condition,
  image,
  isVerified = true,
}: EquipmentCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link to={`/equipment/${id}`} className="block h-full group">
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full h-full border-slate-200">
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs font-semibold">
              {condition}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 flex-1">
          <div className="text-sm text-muted-foreground mb-1 font-medium">{brand}</div>
          <h3 className="font-bold text-slate-900 leading-tight mb-3 line-clamp-2">{title}</h3>
          
          <div className="flex items-center text-sm text-slate-500 mb-2">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            {location}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
          <div>
            <div className="font-bold text-lg text-slate-900">{formattedPrice}</div>
            {isVerified && (
              <div className="flex items-center text-xs text-emerald-600 font-medium mt-0.5">
                <Verified className="h-3 w-3 mr-1" /> Verified Seller
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="hidden group-hover:flex">
            Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
