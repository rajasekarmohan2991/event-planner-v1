package com.eventplanner.events;

import com.eventplanner.events.dto.EventRequest;
import com.eventplanner.events.dto.EventResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-03T10:22:59+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.44.0.v20251118-1623, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class EventMapperImpl implements EventMapper {

    @Override
    public Event toEntity(EventRequest request) {
        if ( request == null ) {
            return null;
        }

        Event event = new Event();

        event.setName( request.getName() );
        event.setStartsAt( request.getStartsAt() );
        event.setEndsAt( request.getEndsAt() );
        event.setVenue( request.getVenue() );
        event.setAddress( request.getAddress() );
        event.setCity( request.getCity() );
        event.setCategory( request.getCategory() );
        event.setPriceInr( request.getPriceInr() );
        event.setDescription( request.getDescription() );
        event.setBannerUrl( request.getBannerUrl() );
        event.setBudgetInr( request.getBudgetInr() );
        event.setExpectedAttendees( request.getExpectedAttendees() );
        event.setEventMode( request.getEventMode() );
        event.setTermsAndConditions( request.getTermsAndConditions() );
        event.setDisclaimer( request.getDisclaimer() );
        event.setEventManagerName( request.getEventManagerName() );
        event.setEventManagerContact( request.getEventManagerContact() );
        event.setEventManagerEmail( request.getEventManagerEmail() );

        return event;
    }

    @Override
    public EventResponse toResponse(Event event) {
        if ( event == null ) {
            return null;
        }

        EventResponse eventResponse = new EventResponse();

        eventResponse.setId( event.getId() );
        eventResponse.setName( event.getName() );
        eventResponse.setVenue( event.getVenue() );
        eventResponse.setAddress( event.getAddress() );
        eventResponse.setCity( event.getCity() );
        eventResponse.setLatitude( event.getLatitude() );
        eventResponse.setLongitude( event.getLongitude() );
        if ( event.getStatus() != null ) {
            eventResponse.setStatus( event.getStatus().name() );
        }
        eventResponse.setCategory( event.getCategory() );
        eventResponse.setEventMode( event.getEventMode() );
        eventResponse.setStartsAt( event.getStartsAt() );
        eventResponse.setEndsAt( event.getEndsAt() );
        eventResponse.setPriceInr( event.getPriceInr() );
        eventResponse.setDescription( event.getDescription() );
        eventResponse.setBannerUrl( event.getBannerUrl() );
        eventResponse.setBudgetInr( event.getBudgetInr() );
        eventResponse.setExpectedAttendees( event.getExpectedAttendees() );
        eventResponse.setTermsAndConditions( event.getTermsAndConditions() );
        eventResponse.setDisclaimer( event.getDisclaimer() );
        eventResponse.setEventManagerName( event.getEventManagerName() );
        eventResponse.setEventManagerContact( event.getEventManagerContact() );
        eventResponse.setEventManagerEmail( event.getEventManagerEmail() );

        return eventResponse;
    }

    @Override
    public void updateEntity(EventRequest request, Event event) {
        if ( request == null ) {
            return;
        }

        event.setName( request.getName() );
        event.setStartsAt( request.getStartsAt() );
        event.setEndsAt( request.getEndsAt() );
        event.setVenue( request.getVenue() );
        event.setAddress( request.getAddress() );
        event.setCity( request.getCity() );
        event.setCategory( request.getCategory() );
        event.setPriceInr( request.getPriceInr() );
        event.setDescription( request.getDescription() );
        event.setBannerUrl( request.getBannerUrl() );
        event.setBudgetInr( request.getBudgetInr() );
        event.setExpectedAttendees( request.getExpectedAttendees() );
        event.setEventMode( request.getEventMode() );
        event.setTermsAndConditions( request.getTermsAndConditions() );
        event.setDisclaimer( request.getDisclaimer() );
        event.setEventManagerName( request.getEventManagerName() );
        event.setEventManagerContact( request.getEventManagerContact() );
        event.setEventManagerEmail( request.getEventManagerEmail() );
    }
}
