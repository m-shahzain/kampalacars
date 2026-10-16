"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { CarBrand } from "@/lib/types";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_SOURCE_IMAGE_BYTES,
  compressImage,
  compressImages,
} from "@/lib/compress-image";
import {
  Loader2,
  Upload,
  Car,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Drafts saved before photos were compressed on selection still hold originals.
const needsCompression = (file: File) =>
  !["image/webp", "image/jpeg"].includes(file.type) || file.size > 0.55 * 1024 * 1024;
const DRAFT_STORAGE_KEY = "kampala-cars-listing-draft";
const DRAFT_IMAGES_DB = "kampala-cars-drafts";
const DRAFT_IMAGES_STORE = "images";

const DEFAULT_FORM_DATA = {
  brand_id: "", model: "", title: "", chassis_number: "", description: "",
  body_type: "", fuel_type: "", year: new Date().getFullYear(), price: "",
  mileage: "", color: "", engine_size: "", transmission: "", drive_type: "", features: "",
};

type FormData = typeof DEFAULT_FORM_DATA;
type FieldName = keyof FormData | "images";
type FieldErrors = Partial<Record<FieldName, string>>;

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_IMAGES_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DRAFT_IMAGES_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDraftImages(images: File[]) {
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_IMAGES_STORE, "readwrite");
    transaction.objectStore(DRAFT_IMAGES_STORE).put(images, "listing");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function getDraftImages(): Promise<File[]> {
  const database = await openDraftDatabase();
  const images = await new Promise<File[]>((resolve, reject) => {
    const request = database.transaction(DRAFT_IMAGES_STORE).objectStore(DRAFT_IMAGES_STORE).get("listing");
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return images;
}

async function clearDraftImages() {
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DRAFT_IMAGES_STORE, "readwrite");
    transaction.objectStore(DRAFT_IMAGES_STORE).delete("listing");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function getResponseData(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const message = (await response.text()).trim();
  return { error: message || `Request failed (${response.status})` };
}

export default function UploadPage() {
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [success, setSuccess] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Drafts are intentionally stored on this device only; nothing is sent until List Car succeeds.
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) setFormData({ ...DEFAULT_FORM_DATA, ...JSON.parse(savedDraft) });
    } catch {
      // A malformed or unavailable local draft should never prevent listing a car.
    }

    getDraftImages()
      .then(async (images) => {
        if (images.some(needsCompression)) setProcessingImages(true);
        const ready: File[] = [];
        for (const image of images) {
          if (!needsCompression(image)) {
            ready.push(image);
            continue;
          }
          try {
            ready.push(await compressImage(image));
          } catch {
            // A draft photo that cannot be processed is dropped; the seller can add it again.
          }
        }
        setImageFiles(ready);
        setImagePreviews(ready.map((image) => URL.createObjectURL(image)));
      })
      .catch(() => undefined)
      .finally(() => {
        setProcessingImages(false);
        setDraftRestored(true);
      });
  }, []);

  useEffect(() => {
    if (!draftRestored) return;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
  }, [formData, draftRestored]);

  useEffect(() => {
    if (!draftRestored) return;
    saveDraftImages(imageFiles).catch(() => undefined);
  }, [imageFiles, draftRestored]);

  // Any logged-in normal user can sell a car.
  // Only admins are redirected to the admin panel.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/login");
    } else if (user.user_type === "admin") {
      router.push("/admin");
    } else {
      fetchBrands();
    }
  }, [user, authLoading, router]);

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      const data = await response.json();

      if (response.ok) {
        setBrands(data.brands);
      } else {
        setError(data.error || "Failed to load car brands");
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      setError("Failed to load car brands");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const field = e.target.name as keyof FormData;
    setFormData({ ...formData, [field]: e.target.value });
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Allow selecting the same file again later
    e.target.value = "";
    if (!files.length) return;

    if (files.length + imageFiles.length > 10) {
      setFieldErrors((current) => ({ ...current, images: "You can add up to 10 photos." }));
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !ACCEPTED_IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_SOURCE_IMAGE_BYTES
    );

    if (invalidFile) {
      setFieldErrors((current) => ({ ...current, images:
        !ACCEPTED_IMAGE_TYPES.includes(invalidFile.type)
          ? "Images must be JPG, PNG, or WebP files"
          : "Each image must be 25 MB or smaller"
      }));
      return;
    }

    setFieldErrors((current) => ({ ...current, images: undefined }));
    setProcessingImages(true);

    try {
      // Photos are shrunk before they are stored or uploaded.
      const compressed = await compressImages(files);
      setImageFiles((prev) => [...prev, ...compressed]);
      setImagePreviews((prev) => [...prev, ...compressed.map((file) => URL.createObjectURL(file))]);
    } catch (compressionError) {
      setFieldErrors((current) => ({ ...current, images:
        compressionError instanceof Error ? compressionError.message : "Could not process the selected photos."
      }));
    } finally {
      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    const requiredFields: Array<[keyof FormData, string]> = [
      ["chassis_number", "Enter the chassis number."], ["brand_id", "Choose a brand."],
      ["drive_type", "Choose the drive type."], ["model", "Enter the model."],
      ["title", "Enter a listing title."], ["body_type", "Choose the body type."],
      ["fuel_type", "Choose the fuel type."], ["transmission", "Choose the transmission."],
      ["price", "Enter a valid price."], ["description", "Add a description of the car."],
    ];
    requiredFields.forEach(([field, message]) => { if (!String(formData[field]).trim()) errors[field] = message; });
    if (Number(formData.price) <= 0) errors.price = "Enter a price greater than zero.";
    if (formData.mileage && Number(formData.mileage) < 0) errors.mileage = "Mileage cannot be negative.";
    if (!imageFiles.length) errors.images = "Add at least one photo of the car.";
    return errors;
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!imageFiles.length) {
      throw new Error("No images selected");
    }

    setUploading(true);

    try {
      const urls: string[] = [];

      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        const data = await getResponseData(response);

        if (!response.ok) {
          throw new Error(
            response.status === 413
              ? "Image upload is too large. Each image must be 4 MB or smaller"
              : data.error || "Image upload failed"
          );
        }

        urls.push(data.url);
      }

      return urls;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    if (!user) {
      setError("You must be logged in to list a car");
      return;
    }

    if (user.user_type === "admin") {
      setError("Admins cannot list cars from this page");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      let imageUrls: string[] = [];

      if (imageFiles.length) {
        imageUrls = await uploadImages();
      }

      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand_id: formData.brand_id,
          model: formData.model,
          title: formData.title,
          chassis_number: formData.chassis_number,
          description: formData.description,
          body_type: formData.body_type,
          fuel_type: formData.fuel_type,
          year: parseInt(formData.year.toString()),
          price: parseFloat(formData.price),
          currency: "UGX",
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          color: formData.color || null,
          engine_size: formData.engine_size || null,
          transmission: formData.transmission,
          drive_type: formData.drive_type,
          features: formData.features || null,
          image_urls: imageUrls,
        }),
      });

      const data = await getResponseData(response);

      if (response.ok) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        await clearDraftImages().catch(() => undefined);
        setSuccess(true);

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        const message = String(data.error || "").toLowerCase();
        if (message.includes("chassis")) setFieldErrors({ chassis_number: "This chassis number is already in use." });
        else setError("We could not save your listing. Your draft has been kept—please try again.");
      }
    } catch (err: any) {
      setError("We could not save your listing. Check your connection and try again—your draft is safe.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  if (user.user_type === "admin") {
    return null;
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>

              <div className="mt-3">
                <h3 className="text-lg font-medium text-green-800">
                  Car submitted for approval!
                </h3>

                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Your listing is pending admin approval. It will appear on
                    the marketplace after approval. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Car className="mx-auto h-12 w-12 text-blue-600 mb-4" />

            <h1 className="text-3xl font-bold text-gray-900">Sell Your Car</h1>

            <p className="text-gray-600 mt-2">
              List your car on Kampala Cars marketplace
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6 bg-white rounded-lg shadow-md p-6"
            data-invalid-fields={Object.keys(fieldErrors).filter((field) => fieldErrors[field as FieldName]).join(" ")}
          >
            {/* Car Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car Images *{" "}
                <span className="text-xs text-gray-400 font-normal">
                  ({imageFiles.length}/10)
                </span>
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {imagePreviews.map((preview, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden group"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageFiles.length < 10 && (
                <div data-image-upload className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />

                  <p className="text-sm text-gray-500 mb-2">
                    {imageFiles.length === 0
                      ? "Upload photos of your car"
                      : "Add more photos"}
                  </p>

                  {processingImages && (
                    <p className="flex items-center justify-center text-sm text-blue-700 mb-2" aria-live="polite">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing photos...
                    </p>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={processingImages}
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required={imageFiles.length === 0}
                  />
                </div>
              )}
              {fieldErrors.images && <p className="mt-1 text-sm text-red-600">{fieldErrors.images}</p>}
            </div>

            {/* Basic Car Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chassis_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Chassis Number *
                </label>
                <input
                  id="chassis_number"
                  name="chassis_number"
                  required
                  value={formData.chassis_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. JTMBD33V106012345"
                />
                <p className="mt-1 text-xs text-gray-500">Must be unique for each vehicle.</p>
              </div>

              <div>
                <label
                  htmlFor="brand_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Brand *
                </label>

                <select
                  id="brand_id"
                  name="brand_id"
                  required
                  value={formData.brand_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a brand</option>

                  {brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="drive_type" className="block text-sm font-medium text-gray-700 mb-1">Drive Type *</label>
                <select id="drive_type" name="drive_type" required value={formData.drive_type} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select drive type</option>
                  <option value="2wd">2WD</option>
                  <option value="4wd">4WD</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Model *
                </label>

                <input
                  type="text"
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Camry"
                />
              </div>
            </div>

            {/* Listing Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Listing Title *
              </label>

              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2020 Toyota Camry - Excellent Condition"
              />
            </div>

            {/* Car Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="body_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Body Type *
                </label>

                <select
                  id="body_type"
                  name="body_type"
                  required
                  value={formData.body_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select body type</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="wagon">Wagon</option>
                  <option value="pickup">Pickup</option>
                  <option value="van">Van</option>
                  <option value="minivan">Minivan</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="fuel_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fuel Type *
                </label>

                <select
                  id="fuel_type"
                  name="fuel_type"
                  required
                  value={formData.fuel_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select fuel type</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="cng">CNG</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="transmission"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transmission *
                </label>

                <select
                  id="transmission"
                  name="transmission"
                  required
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select transmission</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Year *
                </label>

                <select
                  id="year"
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from(
                    { length: 30 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price and Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price (UGX) *
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-sm font-semibold text-gray-400">USh</span>
                  </div>

                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25000"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="mileage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mileage (km)
                </label>

                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  min="0"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Color
                </label>

                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Red"
                />
              </div>

              <div>
                <label
                  htmlFor="engine_size"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Engine Size
                </label>

                <input
                  type="text"
                  id="engine_size"
                  name="engine_size"
                  value={formData.engine_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2.0L"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label
                htmlFor="features"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Features
              </label>

              <input
                type="text"
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Leather seats, Sunroof, Navigation system"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your car's condition, maintenance history, and any additional details..."
              />
            </div>

            {/* Error */}
            {Object.keys(fieldErrors).some((field) => fieldErrors[field as FieldName]) && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium text-red-800">Please correct the highlighted fields:</p>
                <ul className="mt-1 list-disc pl-5">
                  {Object.entries(fieldErrors).map(([field, message]) => message && <li key={field}>{message}</li>)}
                </ul>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>

                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>

                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button type="submit" loading={loading || uploading || processingImages} size="lg">
                {processingImages
                  ? "Processing photos..."
                  : uploading
                  ? "Uploading Image..."
                  : loading
                  ? "Listing Car..."
                  : "List Car"}
              </Button>
            </div>
          </form>
          <style jsx>{`
            form[data-invalid-fields~="chassis_number"] #chassis_number,
            form[data-invalid-fields~="brand_id"] #brand_id,
            form[data-invalid-fields~="drive_type"] #drive_type,
            form[data-invalid-fields~="model"] #model,
            form[data-invalid-fields~="title"] #title,
            form[data-invalid-fields~="body_type"] #body_type,
            form[data-invalid-fields~="fuel_type"] #fuel_type,
            form[data-invalid-fields~="transmission"] #transmission,
            form[data-invalid-fields~="price"] #price,
            form[data-invalid-fields~="mileage"] #mileage,
            form[data-invalid-fields~="description"] #description {
              border-color: #ef4444;
              box-shadow: 0 0 0 2px #fee2e2;
            }
            form[data-invalid-fields~="images"] [data-image-upload] { border-color: #ef4444; }
          `}</style>
        </div>
      </div>
    </Layout>
  );
}
