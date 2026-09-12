import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/cars - Fetch all cars with optional search and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const brand_id = searchParams.get("brand_id");
    const min_price = searchParams.get("min_price");
    const max_price = searchParams.get("max_price");
    const min_year = searchParams.get("min_year");
    const max_year = searchParams.get("max_year");
    const body_type = searchParams.get("body_type");
    const fuel_type = searchParams.get("fuel_type");
    const transmission = searchParams.get("transmission");
    const max_mileage = searchParams.get("max_mileage");
    const mine = searchParams.get("mine") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const sessionData = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (mine && !sessionData?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("cars")
      .select(
        `
        *,
        car_brands!inner(brand_id, brand_name),
        users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium)
      `
      )
      .order("created_at", { ascending: false });

    if (mine) {
      query = query.eq("seller_id", sessionData.userId);
    } else {
      query = query.eq("is_sold", false).eq("approval_status", "approved");
    }

    // Apply search filters
    if (search) {
      query = query.or(
        `model.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (brand_id) {
      query = query.eq("brand_id", brand_id);
    }

    if (min_price) {
      query = query.gte("price", parseFloat(min_price));
    }

    if (max_price) {
      query = query.lte("price", parseFloat(max_price));
    }

    if (min_year) {
      query = query.gte("year", parseInt(min_year));
    }

    if (max_year) {
      query = query.lte("year", parseInt(max_year));
    }

    if (body_type) {
      query = query.eq("body_type", body_type);
    }

    if (fuel_type) {
      query = query.eq("fuel_type", fuel_type);
    }

    if (transmission) {
      query = query.eq("transmission", transmission);
    }

    if (max_mileage) {
      query = query.lte("mileage", parseInt(max_mileage));
    }

    // Get total count for pagination
    const { count } = await query;

    // Apply pagination
    const { data: cars, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const adminContact = !mine && cars?.some((car) => !car.users?.is_premium)
      ? (await supabase.from("users").select("fullname, email, phone").eq("user_type", "admin").order("created_at", { ascending: true }).limit(1).maybeSingle()).data
      : null;

    const carsWithContact = cars?.map((car) => ({
      ...car,
      // A standard seller's details must never be exposed by the public API.
      users: !mine && !car.users?.is_premium
        ? { user_id: car.users.user_id, fullname: car.users.fullname, is_premium: false }
        : car.users,
      contact: car.users?.is_premium
        ? { fullname: car.users.fullname, email: car.users.email, phone: car.users.phone, is_seller: true }
        : { ...(adminContact || { fullname: "Kampala Cars", email: "", phone: null }), is_seller: false },
    }));

    return NextResponse.json({
      cars: carsWithContact,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cars - Create a new car listing
// POST /api/cars - Create a new car listing
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    if (!sessionData.userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Both buyers and sellers can create car listings.
    // Only admins are restricted from using the normal marketplace listing.
    if (sessionData.userType === "admin") {
      return NextResponse.json(
        { error: "Admins cannot create car listings" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const body = await request.json();

    const {
      brand_id,
      model,
      title,
      chassis_number,
      description,
      body_type,
      fuel_type,
      year,
      price,
      currency = "UGX",
      mileage,
      color,
      engine_size,
      transmission,
      drive_type,
      features,
      image_urls,
    } = body;

    if (
      !brand_id ||
      !model ||
      !title ||
      !chassis_number ||
      !body_type ||
      !fuel_type ||
      !year ||
      !price ||
      !transmission ||
      !drive_type ||
      !image_urls?.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedChassisNumber = chassis_number.trim().toUpperCase();
    const { data: duplicateCar } = await supabase
      .from("cars")
      .select("car_id")
      .ilike("chassis_number", normalizedChassisNumber)
      .maybeSingle();

    if (duplicateCar) {
      return NextResponse.json(
        { error: "A car with this chassis number is already listed" },
        { status: 409 }
      );
    }

    const { data: car, error } = await supabase
      .from("cars")
      .insert({
        seller_id: sessionData.userId,
        brand_id,
        model,
        title,
        chassis_number: normalizedChassisNumber,
        description,
        body_type,
        fuel_type,
        year: parseInt(year),
        price: parseFloat(price),
        currency,
        mileage: mileage ? parseInt(mileage) : null,
        color: color || null,
        engine_size: engine_size || null,
        transmission,
        drive_type,
        features: features || null,
        image_urls,
        is_sold: false,
        approval_status: "pending",
      })
      .select(
        `
        *,
        car_brands!inner(brand_id, brand_name),
        users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium)
      `
      )
      .single();

    if (error) {
      console.error("Error creating car:", error);

      const duplicateChassis = error.code === "23505";
      return NextResponse.json(
        { error: duplicateChassis ? "A car with this chassis number is already listed" : error.message },
        { status: duplicateChassis ? 409 : 400 }
      );
    }

    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cars error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
