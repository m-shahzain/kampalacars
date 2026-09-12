"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { CarBrand } from "@/lib/types";
import {
  Upload,
  Car,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function UploadPage() {
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [formData, setFormData] = useState({
    brand_id: "",
    model: "",
    title: "",
    chassis_number: "",
    description: "",
    body_type: "",
    fuel_type: "",
    year: new Date().getFullYear(),
    price: "",
    mileage: "",
    color: "",
    engine_size: "",
    transmission: "",
    drive_type: "",
    features: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { user } = useAuth();
  const router = useRouter();

  // Any logged-in normal user can sell a car.
  // Only admins are redirected to the admin panel.
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else if (user.user_type === "admin") {
      router.push("/admin");
    } else {
      fetchBrands();
    }
  }, [user, router]);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + imageFiles.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    setError("");

    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };

      reader.readAsDataURL(file);
    });

    // Allow selecting the same file again later
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Image upload failed");
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

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Failed to list car");
      }
    } catch (err: any) {
      console.error("Error listing car:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
            className="space-y-6 bg-white rounded-lg shadow-md p-6"
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />

                  <p className="text-sm text-gray-500 mb-2">
                    {imageFiles.length === 0
                      ? "Upload photos of your car"
                      : "Add more photos"}
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required={imageFiles.length === 0}
                  />
                </div>
              )}
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

              <Button type="submit" loading={loading || uploading} size="lg">
                {uploading
                  ? "Uploading Image..."
                  : loading
                  ? "Listing Car..."
                  : "List Car"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
