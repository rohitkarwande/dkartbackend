import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useCreateEquipment, EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from "@/hooks/useEquipment";
import { useNavigate } from "react-router-dom";
import { WizardStepper } from "@/components/shared/WizardStepper";
import { UploadZone } from "@/components/shared/UploadZone";

const STEPS = [
  { id: "category", label: "Category" },
  { id: "details", label: "Details" },
  { id: "images", label: "Images" },
  { id: "price", label: "Price & Location" },
  { id: "review", label: "Review & Publish" },
];

export function SellEquipment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const createEquipment = useCreateEquipment();

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    brand: "",
    model: "",
    manufacturingYear: "",
    condition: "" as typeof EQUIPMENT_CONDITIONS[number] | "",
    description: "",
    price: "",
    city: "",
    state: "",
    files: [] as File[],
  });

  const update = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const nextStep = () => {
    setError("");
    // Validate before proceeding
    if (currentStep === 0 && !formData.category) {
      setError("Please select a category.");
      return;
    }
    if (currentStep === 1 && (!formData.title || !formData.brand || !formData.model || !formData.condition)) {
      setError("Please fill in all required fields (Title, Brand, Model, Condition).");
      return;
    }
    if (currentStep === 3 && (!formData.price || !formData.city)) {
      setError("Price and City are required.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handlePublish = async () => {
    setError("");
    // Build FormData with exact backend field names
    const data = new FormData();
    data.append("title", formData.title);
    data.append("category", formData.category);
    data.append("brand", formData.brand);
    data.append("model", formData.model);
    data.append("condition", formData.condition);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("city", formData.city);
    if (formData.state) data.append("state", formData.state);
    if (formData.manufacturingYear) data.append("manufacturingYear", formData.manufacturingYear);

    // Append images with the field name 'images' (matches multer config)
    formData.files.forEach((file) => {
      data.append("images", file);
    });

    try {
      await createEquipment.mutateAsync(data);
      navigate("/dashboard/listings");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to publish listing. Please try again.");
    }
  };

  const conditionLabel: Record<string, string> = {
    Used: "Used (Working Condition)",
    Refurbished: "Refurbished (Restored to OEM Specs)",
    Spare: "Spare Parts / Components",
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Add Equipment Listing</h1>
          <p className="text-slate-500 mt-2">Fill in the details below to list your equipment on Dr.Kart.</p>
        </div>

        <div className="mb-10">
          <WizardStepper steps={STEPS} currentStep={currentStep} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
            {error}
          </div>
        )}

        <Card className="border-0 shadow-sm rounded-xl bg-white p-6 md:p-10">

          {/* Step 0: Category */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Select Equipment Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update("category", cat)}
                    className={`p-4 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                      formData.category === cat
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Equipment Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Equipment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-2">
                  <Label>Equipment Title <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. GE Optima MR360 1.5T MRI Machine"
                    className="h-11"
                  />
                  <p className="text-xs text-slate-400">5-150 characters. Be specific — good titles get more inquiries.</p>
                </div>
                <div className="space-y-2">
                  <Label>Brand <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => update("brand", e.target.value)}
                    placeholder="e.g. GE Healthcare, Siemens, Philips"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model Number <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => update("model", e.target.value)}
                    placeholder="e.g. Optima MR360"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year of Manufacture</Label>
                  <Input
                    type="number"
                    value={formData.manufacturingYear}
                    onChange={(e) => update("manufacturingYear", e.target.value)}
                    placeholder={String(new Date().getFullYear() - 5)}
                    min="1990"
                    max={String(new Date().getFullYear())}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condition <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-1 gap-2">
                    {EQUIPMENT_CONDITIONS.map((cond) => (
                      <label
                        key={cond}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.condition === cond
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="condition"
                          value={cond}
                          checked={formData.condition === cond}
                          onChange={() => update("condition", cond)}
                          className="accent-emerald-600"
                        />
                        <span className={`text-sm font-medium ${formData.condition === cond ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {conditionLabel[cond]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the equipment's condition, history, included accessories, service records, etc."
                  className="resize-none"
                />
                <p className="text-xs text-slate-400">{formData.description.length}/3000 characters</p>
              </div>
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Upload Images</h2>
                <p className="text-slate-500 text-sm mt-1">Upload up to 10 clear images. Listings with images get 3x more inquiries. Images are optional but recommended.</p>
              </div>
              <UploadZone onUpload={(files) => update("files", files)} />
              {formData.files.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {formData.files.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {formData.files.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  ⚠️ No images uploaded. Listings without images are saved as "Draft" and are less visible. You can still publish without images.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Price & Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Price & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Asking Price (₹) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => update("price", e.target.value)}
                    placeholder="e.g. 1500000"
                    min="0"
                    className="h-11"
                  />
                  {formData.price && (
                    <p className="text-sm text-slate-500">
                      = ₹{Number(formData.price).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Publish */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Review Your Listing</h2>
              <div className="bg-slate-50 rounded-xl border p-6 space-y-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {[
                    ["Category", formData.category],
                    ["Title", formData.title],
                    ["Brand", formData.brand],
                    ["Model", formData.model],
                    ["Condition", formData.condition],
                    ["Year", formData.manufacturingYear || "Not specified"],
                    ["Price", formData.price ? `₹${Number(formData.price).toLocaleString('en-IN')}` : "Not specified"],
                    ["City", formData.city],
                    ["State", formData.state || "Not specified"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="text-slate-500 block mb-0.5">{label}</span>
                      <span className="font-semibold text-slate-900">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                {formData.description && (
                  <div className="pt-4 border-t">
                    <span className="text-slate-500 block mb-1 text-sm">Description</span>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{formData.description}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <span className="text-slate-500 block mb-1 text-sm">Images</span>
                  <span className="font-semibold text-slate-900">{formData.files.length} image(s) ready to upload</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <strong>Note:</strong> Listings without images will be saved as <strong>Draft</strong> status. 
                Listings with images will be immediately <strong>Active</strong> on the marketplace.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep} className="px-8 bg-slate-900 hover:bg-slate-800 text-white">
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={createEquipment.isPending}
                className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {createEquipment.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Publish Listing</>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
