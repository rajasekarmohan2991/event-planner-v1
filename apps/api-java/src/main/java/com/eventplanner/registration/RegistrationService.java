package com.eventplanner.registration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RegistrationResponse create(Long eventId, RegistrationRequest req) {
        Registration reg = new Registration();
        reg.setEventId(eventId);
        reg.setType(req.getType());
        try {
            String json = req.getData() == null ? "{}" : objectMapper.writeValueAsString(req.getData());
            reg.setDataJson(json);
        } catch (JsonProcessingException e) {
            reg.setDataJson("{}");
        }

        Registration saved = registrationRepository.save(reg);

        return RegistrationResponse.builder()
                .id(String.valueOf(saved.getId()))
                .eventId(eventId)
                .type(saved.getType())
                .status("CREATED")
                .build();
    }

    public List<RegistrationResponse> listByEvent(Long eventId) {
        return registrationRepository.findByEventId(eventId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<RegistrationResponse> listByEvent(Long eventId, RegistrationType type) {
        List<Registration> regs = (type == null)
                ? registrationRepository.findByEventId(eventId)
                : registrationRepository.findByEventIdAndType(eventId, type);
        return regs.stream().map(this::toDto).collect(Collectors.toList());
    }

    public RegistrationResponse getOne(Long eventId, Long id) {
        Registration r = registrationRepository.findById(id).orElse(null);
        if (r == null || !r.getEventId().equals(eventId)) return null;
        return toDto(r);
    }

    public RegistrationResponse update(Long eventId, Long id, RegistrationRequest req) {
        Registration r = registrationRepository.findById(id).orElse(null);
        if (r == null || !r.getEventId().equals(eventId)) return null;
        if (req.getType() != null) r.setType(req.getType());
        try {
            String json = req.getData() == null ? r.getDataJson() : objectMapper.writeValueAsString(req.getData());
            r.setDataJson(json);
        } catch (JsonProcessingException e) {
            // keep previous dataJson
        }
        Registration saved = registrationRepository.save(r);
        return toDto(saved);
    }

    public boolean delete(Long eventId, Long id) {
        Registration r = registrationRepository.findById(id).orElse(null);
        if (r == null || !r.getEventId().equals(eventId)) return false;
        registrationRepository.deleteById(id);
        return true;
    }

    private RegistrationResponse toDto(Registration saved) {
        return RegistrationResponse.builder()
                .id(String.valueOf(saved.getId()))
                .eventId(saved.getEventId())
                .type(saved.getType())
                .status("CREATED")
                .build();
    }
}
