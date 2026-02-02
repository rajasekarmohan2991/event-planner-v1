package com.eventplanner.events.dto;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventMode;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.OffsetDateTime;

public class EventResponse {
    private Long id;
    private String name;
    private String venue;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private String status;
    private String category;
    private EventMode eventMode;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime startsAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime endsAt;

    private Integer priceInr;
    private String description;
    private String bannerUrl;
    private Integer budgetInr;
    private Integer expectedAttendees;

    private String termsAndConditions;
    private String disclaimer;
    private String eventManagerName;
    private String eventManagerContact;
    private String eventManagerEmail;

    // Default constructor for frameworks
    public EventResponse() {}

    // Constructor from Event entity
    public EventResponse(Event event) {
        this.id = event.getId();
        this.name = event.getName();
        this.venue = event.getVenue();
        this.address = event.getAddress();
        this.city = event.getCity();
        this.status = event.getStatus() != null ? event.getStatus().name() : null;
        this.latitude = event.getLatitude();
        this.longitude = event.getLongitude();
        this.category = event.getCategory();
        this.eventMode = event.getEventMode();
        this.startsAt = event.getStartsAt();
        this.endsAt = event.getEndsAt();
        this.priceInr = event.getPriceInr();
        this.description = event.getDescription();
        this.bannerUrl = event.getBannerUrl();
        this.budgetInr = event.getBudgetInr();
        this.expectedAttendees = event.getExpectedAttendees();
        this.termsAndConditions = event.getTermsAndConditions();
        this.disclaimer = event.getDisclaimer();
        this.eventManagerName = event.getEventManagerName();
        this.eventManagerContact = event.getEventManagerContact();
        this.eventManagerEmail = event.getEventManagerEmail();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public EventMode getEventMode() {
        return eventMode;
    }

    public void setEventMode(EventMode eventMode) {
        this.eventMode = eventMode;
    }

    public OffsetDateTime getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(OffsetDateTime startsAt) {
        this.startsAt = startsAt;
    }

    public OffsetDateTime getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(OffsetDateTime endsAt) {
        this.endsAt = endsAt;
    }

    public Integer getPriceInr() {
        return priceInr;
    }

    public void setPriceInr(Integer priceInr) {
        this.priceInr = priceInr;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBannerUrl() {
        return bannerUrl;
    }

    public void setBannerUrl(String bannerUrl) {
        this.bannerUrl = bannerUrl;
    }

    public Integer getBudgetInr() {
        return budgetInr;
    }

    public void setBudgetInr(Integer budgetInr) {
        this.budgetInr = budgetInr;
    }

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    public String getTermsAndConditions() {
        return termsAndConditions;
    }

    public void setTermsAndConditions(String termsAndConditions) {
        this.termsAndConditions = termsAndConditions;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public String getEventManagerName() {
        return eventManagerName;
    }

    public void setEventManagerName(String eventManagerName) {
        this.eventManagerName = eventManagerName;
    }

    public String getEventManagerContact() {
        return eventManagerContact;
    }

    public void setEventManagerContact(String eventManagerContact) {
        this.eventManagerContact = eventManagerContact;
    }

    public String getEventManagerEmail() {
        return eventManagerEmail;
    }

    public void setEventManagerEmail(String eventManagerEmail) {
        this.eventManagerEmail = eventManagerEmail;
    }
}
