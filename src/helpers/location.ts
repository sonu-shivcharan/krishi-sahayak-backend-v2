import axios from "axios";

export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<{ district?: string; taluka?: string }> => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API;
    if (!apiKey) {
      console.warn("GOOGLE_MAPS_API key is missing");
      return {};
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
    );

    if (response.data.status !== "OK" || !response.data.results.length) {
      return {};
    }

    const result = response.data.results[0];
    let district: string | undefined;
    let taluka: string | undefined;

    for (const component of result.address_components) {
      if (component.types.includes("administrative_area_level_3")) {
        taluka = component.long_name.trim();
      }
      if (component.types.includes("administrative_area_level_2")) {
        district = component.long_name.trim();
      }
    }

    return { district, taluka };
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return {};
  }
};
