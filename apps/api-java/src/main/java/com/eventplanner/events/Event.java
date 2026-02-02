package com.eventplanner.events;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "starts_at", nullable = false)
    private OffsetDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private OffsetDateTime endsAt;

    @Column(name = "venue")
    private String venue;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "category")
    private String category;

    @Column(name = "price_inr")
    private Integer priceInr;

    @Column(name = "description")
    private String description;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(name = "budget_inr")
    private Integer budgetInr;

    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    @Column(name = "tenant_id")
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_mode", nullable = false)
    private EventMode eventMode = EventMode.IN_PERSON;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    // Legal & Event Manager Information
    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "disclaimer", columnDefinition = "TEXT")
    private String disclaimer;

    @Column(name = "event_manager_name")
    private String eventManagerName;

    @Column(name = "event_manager_contact")
    private String eventManagerContact;

    @Column(name = "event_manager_email")
    private String eventManagerEmail;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public OffsetDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(OffsetDateTime startsAt) { this.startsAt = startsAt; }
    public OffsetDateTime getEndsAt() { return endsAt; }
    public void setEndsAt(OffsetDateTime endsAt) { this.endsAt = endsAt; }
    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getPriceInr() { return priceInr; }
    public void setPriceInr(Integer priceInr) { this.priceInr = priceInr; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }
    public Integer getBudgetInr() { return budgetInr; }
    public void setBudgetInr(Integer budgetInr) { this.budgetInr = budgetInr; }
    public Integer getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(Integer expectedAttendees) { this.expectedAttendees = expectedAttendees; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public EventMode getEventMode() { return eventMode; }
    public void setEventMode(EventMode eventMode) { this.eventMode = eventMode; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

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
