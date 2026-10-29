import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { carsQuery, withContacts } from "@/lib/cars-server";

// GET /api/cars - Fetch all cars with optional search and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    const sessionData = await getSession(supabase);

    if (mine && !sessionData?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch this page and the exact matching total in one request.
    // The count is used by the client to decide whether to enable "Next".
    const {
      data: cars,
      error,
      count,
    } = await carsQuery(supabase, searchParams, mine ? sessionData?.userId : undefined).range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      cars: await withContacts(supabase, cars ?? [], { showSellerDetails: mine }),
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
export async function POST(request: NextRequest) {
  try {
    const sessionData = await getSession();

    if (!sessionData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buyers contact the seller by phone, so every listing needs one.
    if (!sessionData.phone) {
      return NextResponse.json(
        { error: "Add your phone number in your dashboard before listing a car" },
        { status: 400 }
      );
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
        users!cars_seller_id_fkey!inner(user_id, fullname, email, phone, is_premium, profile_picture_url)
      `
      )
      .single();

    if (error) {
      console.error("Error creating car:", error);

      const duplicateChassis = error.code === "23505";
      return NextResponse.json(
        {
          error: duplicateChassis
            ? "A car with this chassis number is already listed"
            : error.message,
        },
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
