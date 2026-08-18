import { createClient } from "@/lib/supabase/server";

// Kept apart from reports.js because that file is imported by the client-side
// dispatch list, and the server client pulls in next/headers.

const REPORT_PHOTO_BUCKET = "report-photos";
const PHOTO_LINK_EXPIRY_SECONDS = 600;

// `location` is PostGIS geometry; PostgREST hands it back as GeoJSON.
const REPORT_DETAIL_COLUMNS =
  "report_id, ticket_number, zone, barangay, municipality, nearest_landmark, report_details, photo_url, status, priority, decline_reason, other_homes_affected, created_at, updated_at, location, consumer(profile_id, users(first_name, last_name))";

// report-photos is a private bucket, so the browser gets a short-lived signed
// URL instead of the stored key.
async function createPhotoLink(supabase, storedPath) {
  if (/^https?:\/\//i.test(storedPath)) {
    return storedPath;
  }

  // Stored values are bare filenames ("1786…_report_photo.jpg"), but tolerate a
  // leading bucket name in case older rows were saved with the prefix.
  let objectPath = storedPath.replace(/^\/+/, "");
  if (objectPath.startsWith(`${REPORT_PHOTO_BUCKET}/`)) {
    objectPath = objectPath.slice(REPORT_PHOTO_BUCKET.length + 1);
  }

  const { data, error } = await supabase.storage
    .from(REPORT_PHOTO_BUCKET)
    .createSignedUrl(objectPath, PHOTO_LINK_EXPIRY_SECONDS);

  if (error) {
    console.error("Could not sign report photo", error);
    return null;
  }

  return data.signedUrl;
}

export async function getReportById(reportId) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_DETAIL_COLUMNS)
    .eq("report_id", reportId)
    .maybeSingle();

  if (error) {
    // 22P02 is a malformed uuid in the URL — same outcome as a missing report
    if (error.code === "22P02") {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  const consumerUser = Array.isArray(data.consumer?.users)
    ? data.consumer.users[0]
    : data.consumer?.users;

  const consumerName =
    [consumerUser?.first_name, consumerUser?.last_name]
      .filter(Boolean)
      .join(" ") || null;

  // GeoJSON stores coordinates as [longitude, latitude]
  const coordinates = Array.isArray(data.location?.coordinates)
    ? {
        longitude: data.location.coordinates[0],
        latitude: data.location.coordinates[1],
      }
    : null;

  return {
    ...data,
    consumerName,
    coordinates,
    photoLink: data.photo_url
      ? await createPhotoLink(supabase, data.photo_url)
      : null,
  };
}

export async function declineReport(reportId, reason) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "cancelled",
      decline_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("report_id", reportId)
    .select("report_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  // Nothing comes back when RLS blocks the update or the report is gone
  return data;
}
