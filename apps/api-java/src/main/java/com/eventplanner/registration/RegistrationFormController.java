package com.eventplanner.registration;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events/{eventId}/registrations/form")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class RegistrationFormController {
    private final RegistrationCustomFieldRepository repo;
    private final EventRepository events;

    public RegistrationFormController(RegistrationCustomFieldRepository repo, EventRepository events) {
        this.repo = repo;
        this.events = events;
    }

    @GetMapping
    public ResponseEntity<List<FieldDto>> getFields(@PathVariable Long eventId) {
        // Validate event exists
        events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        List<RegistrationCustomField> fields = repo.findByEventIdOrderByOrderIndexAsc(eventId);
        return ResponseEntity.ok(fields.stream().map(this::toDto).collect(Collectors.toList()));
    }

    @PostMapping("/fields")
    public ResponseEntity<FieldDto> createField(@PathVariable Long eventId, @RequestBody FieldDto dto) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        RegistrationCustomField f = RegistrationCustomField.builder()
                .event(e)
                .key(dto.key)
                .label(dto.label)
                .type(dto.type)
                .required(dto.required)
                .optionsJson(dto.optionsJson)
                .orderIndex(dto.orderIndex != null ? dto.orderIndex : 0)
                .visibility(dto.visibility != null ? dto.visibility : "PUBLIC")
                .logicJson(dto.logicJson)
                .build();
        RegistrationCustomField saved = repo.save(f);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/fields/{fieldId}")
    public ResponseEntity<FieldDto> updateField(@PathVariable Long eventId, @PathVariable Long fieldId, @RequestBody FieldDto dto) {
        // Validate event exists
        events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        RegistrationCustomField f = repo.findByIdAndEventId(fieldId, eventId)
                .orElseThrow(() -> new NoSuchElementException("Field not found"));
        if (dto.key != null) f.setKey(dto.key);
        if (dto.label != null) f.setLabel(dto.label);
        if (dto.type != null) f.setType(dto.type);
        f.setRequired(dto.required);
        f.setOptionsJson(dto.optionsJson);
        if (dto.orderIndex != null) f.setOrderIndex(dto.orderIndex);
        if (dto.visibility != null) f.setVisibility(dto.visibility);
        f.setLogicJson(dto.logicJson);
        return ResponseEntity.ok(toDto(repo.save(f)));
    }

    @DeleteMapping("/fields/{fieldId}")
    public ResponseEntity<Void> deleteField(@PathVariable Long eventId, @PathVariable Long fieldId) {
        RegistrationCustomField f = repo.findByIdAndEventId(fieldId, eventId)
                .orElseThrow(() -> new NoSuchElementException("Field not found"));
        repo.delete(f);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorder(@PathVariable Long eventId, @RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null) return ResponseEntity.badRequest().build();
        for (int i = 0; i < ids.size(); i++) {
            final int idx = i;
            Long id = ids.get(i);
            repo.findByIdAndEventId(id, eventId).ifPresent(f -> {
                f.setOrderIndex(idx);
                repo.save(f);
            });
        }
        return ResponseEntity.ok().build();
    }

    private FieldDto toDto(RegistrationCustomField f) {
        FieldDto d = new FieldDto();
        d.id = f.getId();
        d.eventId = f.getEvent().getId();
        d.key = f.getKey();
        d.label = f.getLabel();
        d.type = f.getType();
        d.required = f.isRequired();
        d.optionsJson = f.getOptionsJson();
        d.orderIndex = f.getOrderIndex();
        d.visibility = f.getVisibility();
        d.logicJson = f.getLogicJson();
        return d;
    }

    public static class FieldDto {
        public Long id;
        public Long eventId;
        public String key;
        public String label;
        public String type;
        public boolean required;
        public String optionsJson;
        public Integer orderIndex;
        public String visibility;
        public String logicJson;
    }
}
