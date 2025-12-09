package com.eventplanner.geo;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LocationService {
    private final LocationRepository repo;

    public LocationService(LocationRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public Location findOrCreate(LocationDto dto) {
        if (dto.placeId != null && !dto.placeId.isBlank()) {
            return repo.findByPlaceId(dto.placeId).orElseGet(() -> repo.save(fromDto(new Location(), dto)));
        }
        return repo.save(fromDto(new Location(), dto));
    }

    public java.util.Optional<Location> findById(Long id) {
        return repo.findById(id);
    }

    public LocationDto toDto(Location l) {
        LocationDto d = new LocationDto();
        d.id = l.getId();
        d.placeId = l.getPlaceId();
        d.name = l.getName();
        d.displayName = l.getDisplayName();
        d.address = l.getAddress();
        d.city = l.getCity();
        d.state = l.getState();
        d.country = l.getCountry();
        d.lat = l.getLat();
        d.lon = l.getLon();
        d.timezone = l.getTimezone();
        d.venueType = l.getVenueType();
        return d;
    }

    private Location fromDto(Location l, LocationDto d) {
        l.setPlaceId(d.placeId);
        l.setName(d.name);
        l.setDisplayName(d.displayName);
        l.setAddress(d.address);
        l.setCity(d.city);
        l.setState(d.state);
        l.setCountry(d.country);
        l.setLat(d.lat);
        l.setLon(d.lon);
        l.setTimezone(d.timezone);
        l.setVenueType(d.venueType);
        return l;
    }
}
