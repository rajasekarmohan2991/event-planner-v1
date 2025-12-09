package com.eventplanner.attendees;

import com.eventplanner.attendees.dto.CreateAttendeeRequest;
import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttendeeService {

    private final EventRepository eventRepository;
    private final AttendeeRepository attendeeRepository;

    @Transactional
    public Attendee create(Long eventId, CreateAttendeeRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        Attendee a = Attendee.builder()
                .event(event)
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .answersJson(req.getAnswersJson())
                .status("PENDING")
                .build();
        return attendeeRepository.save(a);
    }
}
