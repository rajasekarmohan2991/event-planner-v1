package com.eventplanner.events.dto;

import jakarta.validation.constraints.*;
import com.eventplanner.events.EventMode;
import java.time.OffsetDateTime;

public class EventRequest {
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;
    
    @Size(max = 200, message = "Venue must be less than 200 characters")
    private String venue;

    @Size(max = 300, message = "Address must be less than 300 characters")
    private String address;

    @Size(max = 100, message = "City must be less than 100 characters")
    private String city;
    
    private OffsetDateTime startsAt;

    private OffsetDateTime endsAt;
    
    @PositiveOrZero(message = "Price must be 0 or greater")
    private Integer priceInr;
    
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    @Size(max = 500, message = "Banner URL must be less than 500 characters")
    private String bannerUrl;

    @Size(max = 100, message = "Category must be less than 100 characters")
    private String category;

    @NotNull(message = "Event mode is required")
    private EventMode eventMode;

    @PositiveOrZero(message = "Budget must be 0 or greater")
    private Integer budgetInr;

    @PositiveOrZero(message = "Expected attendees must be 0 or greater")
    private Integer expectedAttendees;

    private String termsAndConditions;
    private String disclaimer;
    private String eventManagerName;
    private String eventManagerContact;
    private String eventManagerEmail;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public OffsetDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(OffsetDateTime startsAt) { this.startsAt = startsAt; }

    public OffsetDateTime getEndsAt() { return endsAt; }
    public void setEndsAt(OffsetDateTime endsAt) { this.endsAt = endsAt; }

    public Integer getPriceInr() { return priceInr; }
    public void setPriceInr(Integer priceInr) { this.priceInr = priceInr; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public EventMode getEventMode() { return eventMode; }
    public void setEventMode(EventMode eventMode) { this.eventMode = eventMode; }

    public Integer getBudgetInr() { return budgetInr; }
    public void setBudgetInr(Integer budgetInr) { this.budgetInr = budgetInr; }

    public Integer getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(Integer expectedAttendees) { this.expectedAttendees = expectedAttendees; }

    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public String getEventManagerName() { return eventManagerName; }
    public void setEventManagerName(String eventManagerName) { this.eventManagerName = eventManagerName; }

    public String getEventManagerContact() { return eventManagerContact; }
    public void setEventManagerContact(String eventManagerContact) { this.eventManagerContact = eventManagerContact; }

    public String getEventManagerEmail() { return eventManagerEmail; }
    public void setEventManagerEmail(String eventManagerEmail) { this.eventManagerEmail = eventManagerEmail; }
}
