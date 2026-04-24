import math
from typing import Optional

ROSLINDALE_CENTROID = (42.2834, -71.1270)

NEIGHBORHOOD_CENTROIDS: dict[str, tuple[float, float]] = {
    "roslindale": (42.2834, -71.1270),
    "jamaica plain": (42.3109, -71.1132),
    "jp": (42.3109, -71.1132),
    "dorchester": (42.2986, -71.0638),
    "roxbury": (42.3151, -71.0859),
    "south boston": (42.3354, -71.0487),
    "southie": (42.3354, -71.0487),
    "east boston": (42.3721, -71.0220),
    "charlestown": (42.3780, -71.0603),
    "back bay": (42.3503, -71.0810),
    "fenway": (42.3467, -71.0972),
    "allston": (42.3534, -71.1313),
    "brighton": (42.3468, -71.1564),
    "west roxbury": (42.2806, -71.1582),
    "hyde park": (42.2556, -71.1234),
    "mattapan": (42.2715, -71.0921),
    "mission hill": (42.3269, -71.1027),
    "south end": (42.3407, -71.0734),
    "downtown": (42.3601, -71.0589),
    "beacon hill": (42.3588, -71.0707),
    "north end": (42.3647, -71.0542),
    "newton": (42.3370, -71.2092),
    "brookline": (42.3317, -71.1217),
}


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(a)), 1)


def _geocode_address(address: str) -> Optional[tuple[float, float]]:
    try:
        from geopy.geocoders import Nominatim
        geolocator = Nominatim(user_agent="boston-camp-finder/1.0")
        location = geolocator.geocode(address, timeout=5)
        if location:
            return (location.latitude, location.longitude)
    except Exception:
        pass
    return None


def distance_from_roslindale(
    address: Optional[str], neighborhood: Optional[str]
) -> Optional[float]:
    if address:
        coords = _geocode_address(address)
        if coords:
            return _haversine_miles(*ROSLINDALE_CENTROID, *coords)

    if neighborhood:
        key = neighborhood.lower().strip()
        for name, coords in NEIGHBORHOOD_CENTROIDS.items():
            if name in key or key in name:
                return _haversine_miles(*ROSLINDALE_CENTROID, *coords)

    return None
