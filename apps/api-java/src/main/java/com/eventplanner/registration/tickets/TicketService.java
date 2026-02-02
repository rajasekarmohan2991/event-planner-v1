package com.eventplanner.registration.tickets;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class TicketService {
    private final TicketRepository repo;
    private final EventRepository events;

    public TicketService(TicketRepository repo, EventRepository events) {
        this.repo = repo;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<TicketDto> list(Long eventId) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        return repo.findByEvent(e).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public TicketDto create(Long eventId, TicketDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Ticket t = new Ticket();
        t.setEvent(e);
        t.setName(dto.name);
        t.setGroupId(dto.groupId);
        t.setFree(dto.free);
        t.setPriceInMinor(dto.priceInMinor != null ? dto.priceInMinor : 0);
        t.setCurrency(dto.currency != null ? dto.currency : "INR");
        t.setQuantity(dto.quantity != null ? dto.quantity : 0);
        t.setSold(0);
        t.setRequiresApproval(dto.requiresApproval);
        t.setStatus(dto.status != null ? dto.status : "Open");
        t.setSalesStartAt(dto.salesStartAt);
        t.setSalesEndAt(dto.salesEndAt);
        Ticket saved = repo.save(t);
        return toDto(saved);
    }

    @Transactional
    public TicketDto update(Long eventId, Long ticketId, TicketDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Ticket t = repo.findById(ticketId).orElseThrow(() -> new NoSuchElementException("Ticket not found"));
        if (!t.getEvent().getId().equals(e.getId())) throw new NoSuchElementException("Ticket not in event");
        if (dto.name != null) t.setName(dto.name);
        if (dto.groupId != null) t.setGroupId(dto.groupId);
        t.setFree(dto.free);
        if (dto.priceInMinor != null) t.setPriceInMinor(dto.priceInMinor);
        if (dto.currency != null) t.setCurrency(dto.currency);
        if (dto.quantity != null) t.setQuantity(dto.quantity);
        if (dto.sold != null) t.setSold(dto.sold);
        t.setRequiresApproval(dto.requiresApproval);
        if (dto.status != null) t.setStatus(dto.status);
        t.setSalesStartAt(dto.salesStartAt);
        t.setSalesEndAt(dto.salesEndAt);
        return toDto(repo.save(t));
    }

    @Transactional
    public void delete(Long eventId, Long ticketId) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Ticket t = repo.findById(ticketId).orElseThrow(() -> new NoSuchElementException("Ticket not found"));
        if (!t.getEvent().getId().equals(e.getId())) throw new NoSuchElementException("Ticket not in event");
        repo.delete(t);
    }

    private TicketDto toDto(Ticket t) {
        TicketDto d = new TicketDto();
        d.id = t.getId();
        d.eventId = t.getEvent().getId();
        d.name = t.getName();
        d.groupId = t.getGroupId();
        d.free = t.isFree();
        d.priceInMinor = t.getPriceInMinor();
        d.currency = t.getCurrency();
        d.quantity = t.getQuantity();
        d.sold = t.getSold();
        d.requiresApproval = t.isRequiresApproval();
        d.status = t.getStatus();
        d.salesStartAt = t.getSalesStartAt();
        d.salesEndAt = t.getSalesEndAt();
        return d;
    }
}
