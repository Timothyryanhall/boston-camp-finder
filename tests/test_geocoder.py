from scraper.geocoder import distance_from_roslindale, _haversine_miles

def test_haversine_same_point():
    assert _haversine_miles(42.2834, -71.1270, 42.2834, -71.1270) == 0.0

def test_haversine_known_distance():
    # Roslindale to Jamaica Plain centroid is ~2.0 miles
    dist = _haversine_miles(42.2834, -71.1270, 42.3109, -71.1132)
    assert 1.5 < dist < 3.5

def test_distance_by_neighborhood():
    dist = distance_from_roslindale(address=None, neighborhood="Jamaica Plain")
    assert dist is not None
    assert 1.5 < dist < 3.5

def test_distance_by_neighborhood_case_insensitive():
    dist = distance_from_roslindale(address=None, neighborhood="jamaica plain")
    assert dist is not None

def test_distance_roslindale_to_itself():
    dist = distance_from_roslindale(address=None, neighborhood="Roslindale")
    assert dist == 0.0

def test_distance_returns_none_when_no_info():
    dist = distance_from_roslindale(address=None, neighborhood=None)
    assert dist is None

def test_distance_unknown_neighborhood_returns_none():
    dist = distance_from_roslindale(address=None, neighborhood="Atlantis")
    assert dist is None
