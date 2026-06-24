import { useState } from "react";
import { useSellerInquiries, useBuyerInquiries, useUpdateInquiryStatus } from "@/hooks/useInquiries";
import { useCreateChatRoom } from "@/hooks/useChat";
import { Loader2, MessageSquare, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

export function Inquiries() {
  const { data: sellerInquiries, isLoading: isLoadingSeller } = useSellerInquiries();
  const { data: buyerInquiries, isLoading: isLoadingBuyer } = useBuyerInquiries();
  const updateStatus = useUpdateInquiryStatus();
  const createRoom = useCreateChatRoom();
  const navigate = useNavigate();

  const handleStatusChange = async (id: number, status: string) => {
    await updateStatus.mutateAsync({ id, status });
  };

  const handleStartChat = async (inquiryId: number) => {
    try {
      await createRoom.mutateAsync({ inquiry_id: inquiryId });
      navigate("/dashboard/chat");
    } catch (err) {
      console.error("Failed to create chat room", err);
      // If room already exists, the API might return an error or we might just navigate. 
      // Ideally backend handles 'get or create'. Let's navigate anyway to see if they can find it.
      navigate("/dashboard/chat");
    }
  };

  const sellerColumns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "equipment_name",
      header: "Equipment",
      cell: ({ row }) => <div className="font-semibold text-slate-900">{row.getValue("equipment_name") || "Equipment Listing"}</div>,
    },
    {
      accessorKey: "buyer_email",
      header: "Buyer Email",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={
              status === "Pending"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : status === "Contacted"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : status === "Closed_Won"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }
          >
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inquiry = row.original;
        const status = inquiry.status;

        return (
          <div className="flex items-center gap-2">
            {status === "Pending" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  onClick={() => handleStatusChange(inquiry.id, "Contacted")}
                >
                  <Check className="h-4 w-4 mr-1" /> Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  onClick={() => handleStatusChange(inquiry.id, "Closed_Lost")}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
            
            {status !== "Pending" && status !== "Closed_Lost" && (
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => handleStartChat(inquiry.id)}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Chat
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const buyerColumns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "equipment_name",
      header: "Equipment",
      cell: ({ row }) => <div className="font-semibold text-slate-900">{row.getValue("equipment_name") || "Equipment Listing"}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={
              status === "Pending"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : status === "Contacted"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : status === "Closed_Won"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }
          >
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inquiry = row.original;
        const status = inquiry.status;

        return (
          <div className="flex items-center gap-2">
            {status === "Contacted" && (
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => handleStartChat(inquiry.id)}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Open Chat
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inquiries</h1>
        <p className="text-muted-foreground mt-2">
          Manage your incoming leads and outgoing equipment requests.
        </p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-12">
          <TabsTrigger value="received" className="text-base">Received (Seller)</TabsTrigger>
          <TabsTrigger value="sent" className="text-base">Sent (Buyer)</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-6">
          {isLoadingSeller ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-1">
              <DataTable columns={sellerColumns} data={sellerInquiries || []} />
            </div>
          )}
        </TabsContent>
        <TabsContent value="sent" className="mt-6">
          {isLoadingBuyer ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
             <div className="bg-white rounded-xl shadow-sm border p-1">
              <DataTable columns={buyerColumns} data={buyerInquiries || []} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
