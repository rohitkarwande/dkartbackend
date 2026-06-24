import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSubmitKyc } from "@/hooks/useAuth";
import { ShieldCheck, Building2, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DOC_TYPES = [
  { value: "GST_Certificate", label: "GST Certificate" },
  { value: "Medical_License", label: "Medical Device License" },
  { value: "Company_Incorporation", label: "Company Incorporation Document" },
  { value: "Drug_License", label: "Drug License" },
  { value: "Trade_License", label: "Trade License" },
  { value: "Other", label: "Other Business ID" },
];

export function KycVerification() {
  const navigate = useNavigate();
  const submitKyc = useSubmitKyc();
  
  const [docType, setDocType] = useState("GST_Certificate");
  const [docNumber, setDocNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setError("Please enter your document number.");
      return;
    }
    setError("");
    
    try {
      // Backend expects document_type and document_url (we store doc number as the URL/reference)
      await submitKyc.mutateAsync({ 
        document_type: docType, 
        document_url: `DOC:${docType}:${docNumber.trim()}:${companyName.trim()}`,
      });
      setSuccess(true);
      setTimeout(() => navigate("/sell"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "KYC submission failed. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Become a Seller on Dr.Kart</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          To list medical equipment, verify your business credentials. 
          This builds trust with buyers across the platform.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">1</div>
          <span className="text-sm font-medium text-slate-700">Register</span>
        </div>
        <div className="w-8 h-px bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">2</div>
          <span className="text-sm font-medium text-slate-700">Verify Business</span>
        </div>
        <div className="w-8 h-px bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold">3</div>
          <span className="text-sm font-medium text-slate-400">List Equipment</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-8">
        {success ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Submitted!</h2>
            <p className="text-slate-500">Your account has been upgraded to Seller. Redirecting you to list equipment...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-400" /> Business Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization Name</Label>
                <Input 
                  id="company"
                  placeholder="e.g. Apollo Hospitals Equipment Division"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docType">Document Type</Label>
                  <select 
                    id="docType"
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    required
                  >
                    {DOC_TYPES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docNumber">Document Number / ID</Label>
                  <Input 
                    id="docNumber"
                    placeholder="e.g. 27AAPFU0939F1Z3"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">What happens next?</p>
                <p>Your submission will be reviewed by the Dr.Kart team within 24 hours. Your account will be temporarily upgraded so you can start listing immediately.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-4 justify-end items-center">
              <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-700">
                Cancel, go back to Marketplace
              </Link>
              <Button 
                type="submit" 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-12 px-8"
                disabled={submitKyc.isPending}
              >
                {submitKyc.isPending ? "Verifying & Upgrading..." : "Submit & Become a Seller"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
