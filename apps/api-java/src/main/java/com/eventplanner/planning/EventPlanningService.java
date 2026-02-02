package com.eventplanner.planning;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import com.eventplanner.geo.Location;
import com.eventplanner.geo.LocationService;
import com.eventplanner.planning.dto.EventPlanningDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventPlanningService {
    private final EventPlanningRepository repo;
    private final EventRepository eventRepo;
    private final LocationService locationService;

    public EventPlanningService(EventPlanningRepository repo, EventRepository eventRepo, LocationService locationService) {
        this.repo = repo;
        this.eventRepo = eventRepo;
        this.locationService = locationService;
    }

    public EventPlanningDto getByEventId(Long eventId) {
        return repo.findByEvent_Id(eventId).map(this::toDto).orElse(null);
    }

    @Transactional
    public EventPlanningDto create(Long eventId, EventPlanningDto dto) {
        if (repo.findByEvent_Id(eventId).isPresent()) {
            // treat as update if exists
            return update(eventId, dto);
        }
        Event event = eventRepo.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        EventPlanning ep = new EventPlanning();
        ep.setEvent(event);
        apply(ep, dto);
        return toDto(repo.save(ep));
    }

    @Transactional
    public EventPlanningDto update(Long eventId, EventPlanningDto dto) {
        EventPlanning ep = repo.findByEvent_Id(eventId).orElseGet(() -> {
            Event ev = eventRepo.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
            EventPlanning n = new EventPlanning();
            n.setEvent(ev);
            return n;
        });
        apply(ep, dto);
        return toDto(repo.save(ep));
    }

    private void apply(EventPlanning ep, EventPlanningDto dto) {
        ep.setBudgetInr(dto.budgetInr);
        ep.setExpectedAttendees(dto.expectedAttendees);
        if (dto.locationId != null) {
            Location loc = locationService.findById(dto.locationId).orElse(null);
            ep.setLocation(loc);
        }
    }

    private EventPlanningDto toDto(EventPlanning ep) {
        EventPlanningDto d = new EventPlanningDto();
        d.id = ep.getId();
        d.eventId = ep.getEvent() != null ? ep.getEvent().getId() : null;
        d.locationId = ep.getLocation() != null ? ep.getLocation().getId() : null;
        d.budgetInr = ep.getBudgetInr();
        d.expectedAttendees = ep.getExpectedAttendees();
        return d;
    }
}
